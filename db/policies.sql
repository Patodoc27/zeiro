-- ZEIRO · Row Level Security (3 roles claros en lugar de los contextos de Moodle)
-- Ejecutar después de schema.sql.

alter table public.profiles       enable row level security;
alter table public.courses        enable row level security;
alter table public.enrollments    enable row level security;
alter table public.course_teachers enable row level security;
alter table public.sections       enable row level security;
alter table public.modules        enable row level security;
alter table public.questions      enable row level security;
alter table public.quiz_attempts  enable row level security;
alter table public.submissions    enable row level security;
alter table public.grades         enable row level security;
alter table public.announcements  enable row level security;
alter table public.module_views   enable row level security;

-- Helpers ----------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and role = 'admin') $$;

create or replace function public.is_docente()
returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and role in ('docente','admin')) $$;

create or replace function public.teaches(cid uuid)
returns boolean language sql stable security definer set search_path = public as
$$ select is_admin() or exists (
     select 1 from courses c where c.id = cid and c.teacher_id = auth.uid()
   ) or exists (
     select 1 from course_teachers ct where ct.course_id = cid and ct.teacher_id = auth.uid()
   ) $$;

create or replace function public.enrolled(cid uuid)
returns boolean language sql stable security definer set search_path = public as
$$ select teaches(cid) or exists (
     select 1 from enrollments e where e.course_id = cid and e.student_id = auth.uid()
   ) $$;

create or replace function public.module_course(mid uuid)
returns uuid language sql stable security definer set search_path = public as
$$ select course_id from modules where id = mid $$;

-- profiles ---------------------------------------------------------------
-- Nombres visibles para toda la escuela (la docente necesita ver a sus alumnos
-- y los alumnos a sus docentes). Edición: solo el propio perfil o admin.
create policy profiles_select on public.profiles
  for select to authenticated using (true);
create policy profiles_update on public.profiles
  for update to authenticated using (id = auth.uid() or is_admin());
create policy profiles_admin_insert on public.profiles
  for insert to authenticated with check (is_admin());

-- courses ----------------------------------------------------------------
create policy courses_select on public.courses
  for select to authenticated using (enrolled(id));
create policy courses_write on public.courses
  for all to authenticated using (is_admin()) with check (is_admin());
create policy courses_teacher_update on public.courses
  for update to authenticated using (teaches(id)) with check (teaches(id));

-- enrollments -------------------------------------------------------------
create policy enrollments_select on public.enrollments
  for select to authenticated using (teaches(course_id) or student_id = auth.uid());
create policy enrollments_write on public.enrollments
  for all to authenticated using (teaches(course_id)) with check (teaches(course_id));

create policy course_teachers_select on public.course_teachers
  for select to authenticated using (teaches(course_id) or teacher_id = auth.uid());
create policy course_teachers_write on public.course_teachers
  for all to authenticated using (is_admin()) with check (is_admin());

-- sections / modules ------------------------------------------------------
create policy sections_select on public.sections
  for select to authenticated using (enrolled(course_id));
create policy sections_write on public.sections
  for all to authenticated using (teaches(course_id)) with check (teaches(course_id));

create policy modules_select on public.modules
  for select to authenticated using (enrolled(course_id));
create policy modules_write on public.modules
  for all to authenticated using (teaches(course_id)) with check (teaches(course_id));

-- questions ---------------------------------------------------------------
-- Los estudiantes NO leen la tabla (las respuestas correctas viven en payload):
-- usan la función quiz_questions() que devuelve las preguntas sin soluciones.
create policy questions_teacher on public.questions
  for all to authenticated using (teaches(module_course(module_id)))
  with check (teaches(module_course(module_id)));

create or replace function public.quiz_questions(mid uuid)
returns table (id uuid, type text, prompt text, points numeric, payload jsonb, position int)
language sql stable security definer set search_path = public as
$$ select id, type, prompt, points,
          case
            when type = 'mcq'   then jsonb_build_object('choices', payload->'choices','multiple',coalesce(payload->'multiple',false))
            when type = 'tf'    then '{}'::jsonb
            when type = 'short' then jsonb_build_object('case_sensitive', coalesce(payload->'case_sensitive',false))
            when type = 'match' then jsonb_build_object('left', payload->'left', 'right', payload->'right')
            else '{}'::jsonb
          end,
          position
     from questions
    where module_id = mid and enrolled(module_course(mid))
    order by position $$;

-- quiz_attempts ------------------------------------------------------------
create policy attempts_student on public.quiz_attempts
  for all to authenticated
  using (student_id = auth.uid() and enrolled(module_course(module_id)))
  with check (student_id = auth.uid() and enrolled(module_course(module_id)));
create policy attempts_teacher on public.quiz_attempts
  for all to authenticated using (teaches(module_course(module_id)))
  with check (teaches(module_course(module_id)));

-- submissions --------------------------------------------------------------
create policy submissions_student on public.submissions
  for all to authenticated
  using (student_id = auth.uid() and enrolled(module_course(module_id)))
  with check (student_id = auth.uid() and enrolled(module_course(module_id)));
create policy submissions_teacher on public.submissions
  for all to authenticated using (teaches(module_course(module_id)))
  with check (teaches(module_course(module_id)));

-- grades -------------------------------------------------------------------
create policy grades_student on public.grades
  for select to authenticated using (student_id = auth.uid());
create policy grades_teacher on public.grades
  for all to authenticated using (teaches(course_id)) with check (teaches(course_id));

-- announcements ------------------------------------------------------------
create policy announcements_select on public.announcements
  for select to authenticated using (
    course_id is null and (audience = 'todos' or
      (audience = 'docentes' and is_docente()) or
      (audience = 'estudiantes' and not is_docente()))
    or (course_id is not null and enrolled(course_id))
  );
create policy announcements_teacher on public.announcements
  for insert to authenticated with check (
    author_id = auth.uid() and (is_admin() or (course_id is not null and teaches(course_id)))
  );
create policy announcements_update on public.announcements
  for update to authenticated using (author_id = auth.uid() or is_admin());
create policy announcements_delete on public.announcements
  for delete to authenticated using (author_id = auth.uid() or is_admin());

-- module_views -------------------------------------------------------------
create policy views_student on public.module_views
  for all to authenticated using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy views_teacher on public.module_views
  for select to authenticated using (teaches(module_course(module_id)));

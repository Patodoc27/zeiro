-- ZEIRO · Esquema de base de datos (Supabase / Postgres)
-- ~15 tablas limpias contra las ~400 de Moodle.
-- Ejecutar en el SQL Editor de Supabase, en este orden: schema → policies → seed (opcional).

create extension if not exists "pgcrypto";

-- ============ IDENTIDAD Y ROLES ============
-- 3 roles claros en lugar de los "contextos" anidados de Moodle.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  role        text not null check (role in ('admin','docente','estudiante')),
  email       text,
  created_at  timestamptz not null default now()
);

-- Crea el perfil al registrarse un usuario (rol por defecto: estudiante;
-- el admin luego lo puede cambiar desde el panel).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role, email)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
          coalesce(new.raw_user_meta_data->>'role','estudiante'),
          new.email);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ CURSOS ============
create table if not exists public.courses (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,                 -- "Biología · 5° 1°"
  short_name  text,                          -- "BIO 5-1"
  color       text default '#0E7C66',
  description text,
  school_year text,                          -- "2026"
  teacher_id  uuid references public.profiles(id) on delete set null,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.enrollments (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references public.courses(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (course_id, student_id)
);

-- Docentes extra asignados al curso (además de courses.teacher_id).
create table if not exists public.course_teachers (
  course_id  uuid not null references public.courses(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  primary key (course_id, teacher_id)
);

-- ============ CONTENIDO: SECCIONES Y MÓDULOS ============
create table if not exists public.sections (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references public.courses(id) on delete cascade,
  title      text not null,                  -- "Unidad 1 · La célula"
  position   int  not null default 0
);

-- Un módulo = recurso o actividad. content es JSON flexible por tipo,
-- en lugar de una tabla por tipo como en Moodle (forum_*, quiz_*, assign_*...).
create table if not exists public.modules (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses(id) on delete cascade,
  section_id  uuid references public.sections(id) on delete cascade,
  type        text not null check (type in ('page','file','link','quiz','assignment','announcement')),
  title       text not null,
  content     jsonb not null default '{}'::jsonb,
  -- page: {body} · file: {file_url, file_name} · link: {url}
  -- quiz: {time_limit_min, attempts_allowed, shuffle, pass_grade, open_at, close_at}
  -- assignment: {instructions, max_grade, due_date, allow_late}
  -- announcement: {body}
  position    int  not null default 0,
  visible     boolean not null default true,
  due_date    timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists modules_course_idx on public.modules (course_id, section_id, position);

-- ============ CUESTIONARIOS ============
create table if not exists public.questions (
  id        uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  type      text not null check (type in ('mcq','tf','short','match','essay')),
  prompt    text not null,
  points    numeric not null default 1,
  -- mcq: {choices:[...], correct:[índices]} (multi o single)
  -- tf:  {correct:true|false}
  -- short:{accepted:["respuesta","variante"], case_sensitive:false}
  -- match:{left:[...], right:[...]}  (correct = posición 1:1)
  -- essay:{} (corrección manual)
  payload   jsonb not null default '{}'::jsonb,
  position  int not null default 0
);

create table if not exists public.quiz_attempts (
  id          uuid primary key default gen_random_uuid(),
  module_id   uuid not null references public.modules(id) on delete cascade,
  student_id  uuid not null references public.profiles(id) on delete cascade,
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  -- answers: {question_id: respuesta} — respuesta según tipo:
  -- mcq:[íds] tf:bool short:text match:{left:text->right:text} essay:text
  answers     jsonb not null default '{}'::jsonb,
  score       numeric,          -- puntos obtenidos (auto-calculado)
  max_score   numeric,          -- puntos posibles
  needs_review boolean not null default false, -- tiene essay pendiente
  status      text not null default 'open' check (status in ('open','submitted','graded'))
);

-- ============ TAREAS ============
create table if not exists public.submissions (
  id            uuid primary key default gen_random_uuid(),
  module_id     uuid not null references public.modules(id) on delete cascade,
  student_id    uuid not null references public.profiles(id) on delete cascade,
  body          text,
  file_url      text,
  submitted_at  timestamptz not null default now(),
  grade         numeric,
  feedback      text,
  graded_at     timestamptz,
  graded_by     uuid references public.profiles(id),
  unique (module_id, student_id)
);

-- ============ CALIFICACIONES ============
-- Libro de calificaciones: una fila por (curso, alumno, módulo calificable).
-- Las notas de cuestionarios/tareas aterrizan acá automáticamente (trigger)
-- y el docente también puede cargar notas manuales.
create table if not exists public.grades (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references public.courses(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  module_id  uuid references public.modules(id) on delete cascade, -- null = nota manual
  label      text,                         -- etiqueta si module_id es null
  grade      numeric,
  max_grade  numeric not null default 10,
  weight     numeric not null default 1,
  updated_at timestamptz not null default now(),
  unique (course_id, student_id, module_id, label)
);

-- ============ COMUNICADOS ============
create table if not exists public.announcements (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid references public.courses(id) on delete cascade, -- null = global
  author_id  uuid not null references public.profiles(id),
  title      text not null,
  body       text not null,
  audience   text not null default 'todos' check (audience in ('todos','estudiantes','docentes')),
  created_at timestamptz not null default now()
);

-- ============ PROGRESO / VISTO ============
create table if not exists public.module_views (
  module_id  uuid not null references public.modules(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  viewed_at  timestamptz not null default now(),
  primary key (module_id, student_id)
);

-- ============ TRIGGERS: intentos/entregas → grades ============
create or replace function public.sync_grade_from_attempt()
returns trigger language plpgsql security definer set search_path = public as $$
declare c uuid; mg numeric;
begin
  if new.status in ('submitted','graded') and new.score is not null then
    select m.course_id, coalesce((m.content->>'max_grade')::numeric,10)
      into c, mg from public.modules m where m.id = new.module_id;
    insert into public.grades (course_id, student_id, module_id, grade, max_grade)
    values (c, new.student_id, new.module_id,
            round(new.score * mg / nullif(new.max_score,0), 1), mg)
    on conflict (course_id, student_id, module_id, label)
    do update set grade = excluded.grade, updated_at = now();
  end if;
  return new;
end $$;

drop trigger if exists trg_attempt_grade on public.quiz_attempts;
create trigger trg_attempt_grade after insert or update on public.quiz_attempts
  for each row execute function public.sync_grade_from_attempt();

create or replace function public.sync_grade_from_submission()
returns trigger language plpgsql security definer set search_path = public as $$
declare c uuid; mg numeric;
begin
  if new.grade is not null then
    select m.course_id, coalesce((m.content->>'max_grade')::numeric,10)
      into c, mg from public.modules m where m.id = new.module_id;
    insert into public.grades (course_id, student_id, module_id, grade, max_grade)
    values (c, new.student_id, new.module_id, new.grade, mg)
    on conflict (course_id, student_id, module_id, label)
    do update set grade = excluded.grade, updated_at = now();
  end if;
  return new;
end $$;

drop trigger if exists trg_submission_grade on public.submissions;
create trigger trg_submission_grade after insert or update on public.submissions
  for each row execute function public.sync_grade_from_submission();

-- ============ STORAGE ============
-- Bucket para archivos de materiales y entregas (crear en el dashboard o por API):
--   nombre: zeiro-files  ·  público: no  ·  lectura con URL firmada.

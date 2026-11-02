-- ZEIRO · Datos de ejemplo (opcional)
-- PRIMERO crear los usuarios en Supabase → Authentication → Add user
--   (o por signUp desde la app). Emails usados por este seed:
--     direccion@zeiro.app   (admin)
--     bio@zeiro.app         (docente)
--     mat@zeiro.app         (docente)
--     alumna1@zeiro.app ... alumna6@zeiro.app  (estudiantes)
-- Después ejecutar este archivo: vincula todo por email.

do $$
declare
  admin_id  uuid; bio_id uuid; mat_id uuid;
  c_bio uuid; c_mat uuid;
  s1 uuid; s2 uuid; m1 uuid; m2 uuid;
  alu uuid;
begin
  select id into admin_id from profiles where email = 'direccion@zeiro.app';
  select id into bio_id   from profiles where email = 'bio@zeiro.app';
  select id into mat_id   from profiles where email = 'mat@zeiro.app';

  if admin_id is null or bio_id is null then
    raise notice 'Faltan usuarios: creá direccion@zeiro.app y bio@zeiro.app primero.';
    return;
  end if;

  update profiles set role = 'admin'    where id = admin_id;
  update profiles set role = 'docente'  where id in (bio_id, mat_id);

  insert into courses (name, short_name, color, description, school_year, teacher_id)
  values ('Biología · 5° 1°', 'BIO 5-1', '#0E7C66',
          'Seres vivos, célula, biomoléculas y metabolismo.', '2026', bio_id)
  returning id into c_bio;

  insert into courses (name, short_name, color, description, school_year, teacher_id)
  values ('Matemática · 3° 2°', 'MAT 3-2', '#3D5AFE',
          'Funciones, ecuaciones y geometría analítica.', '2026', mat_id)
  returning id into c_mat;

  insert into enrollments (course_id, student_id)
  select c_bio, id from profiles where email like 'alumna%@zeiro.app';
  insert into enrollments (course_id, student_id)
  select c_mat, id from profiles where email in ('alumna1@zeiro.app','alumna2@zeiro.app','alumna3@zeiro.app');

  insert into sections (course_id, title, position) values
    (c_bio, 'Unidad 1 · La célula', 1),
    (c_bio, 'Unidad 2 · Biomoléculas', 2)
  returning id into s1;
  select id into s2 from sections where course_id = c_bio and position = 2;

  insert into sections (course_id, title, position) values
    (c_mat, 'Funciones lineales', 1)
  returning id into m1;

  insert into modules (course_id, section_id, type, title, content, position) values
    (c_bio, s1, 'page', 'La célula: unidad de la vida',
     '{"body":"<p>La célula es la unidad estructural y funcional de los seres vivos...</p>"}', 1),
    (c_bio, s1, 'link', 'Video: tour por la célula',
     '{"url":"https://www.youtube.com/results?search_query=la+celula"}', 2),
    (c_bio, s1, 'assignment', 'TP 1 · Comparación célula animal y vegetal',
     '{"instructions":"Elaborar un cuadro comparativo con al menos 6 diferencias.","max_grade":10,"allow_late":true}', 3),
    (c_bio, s2, 'quiz', 'Cuestionario · Biomoléculas',
     '{"time_limit_min":15,"attempts_allowed":2,"shuffle":true,"pass_grade":6,"max_grade":10}', 1),
    (c_bio, s2, 'page', 'Guía de biomoléculas',
     '{"body":"<p>Glúcidos, lípidos, proteínas y ácidos nucleicos...</p>"}', 2),
    (c_mat, m1, 'assignment', 'TP 1 · Gráficas de funciones',
     '{"instructions":"Graficar 5 funciones e indicar pendiente y ordenada.","max_grade":10}', 1);

  select id into m2 from modules where course_id = c_bio and type = 'quiz' limit 1;

  insert into questions (module_id, type, prompt, points, payload, position) values
    (m2, 'mcq', '¿Cuál de estas biomoléculas cumple principalmente función estructural?', 2,
     '{"choices":["Glucosa","Colágeno","ATP","Glucógeno"],"correct":[1]}', 1),
    (m2, 'tf', 'Los lípidos son solubles en agua.', 1,
     '{"correct":false}', 2),
    (m2, 'short', '¿Qué biomolécula guarda la información genética?', 2,
     '{"accepted":["ADN","ácido desoxirribonucleico","acido desoxirribonucleico"]}', 3),
    (m2, 'match', 'Uní la biomolécula con su función.', 3,
     '{"left":["Proteínas","Lípidos","Glúcidos"],"right":["Enzimas y estructura","Reserva y membranas","Energía rápida"]}', 4),
    (m2, 'essay', 'Explicá con tus palabras por qué se dice que las proteínas son "obreras" de la célula.', 2,
     '{}', 5);

  insert into announcements (course_id, author_id, title, body, audience) values
    (null, admin_id, 'Bienvenidos a Zeiro',
     'Esta es la plataforma del colegio. Acá van a encontrar materiales, tareas y cuestionarios.', 'todos'),
    (c_bio, bio_id, 'Primer cuestionario habilitado',
     'Ya está abierto el cuestionario de Biomoléculas: tienen 2 intentos.', 'estudiantes');
end $$;

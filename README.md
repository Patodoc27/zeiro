# Zeiro · Plataforma educativa

Alternativa libre y moderna a Moodle para una escuela completa: docentes que suben
materiales gratis, cuestionarios autocorregidos, tareas con devolución, libro de
calificaciones, agenda y comunicados. Diseñada **primero para PC** (panel lateral
panorámico) y usable también desde el celular como PWA instalable.

## Probar ya (modo demo, sin servidor)

Abrí `index.html` (o la URL de GitHub Pages una vez publicado) y elegí un rol:

- **Dirección** — administra usuarios, cursos e inscripciones.
- **Docente** — crea secciones y módulos dentro de sus cursos (edición inline, sin
  "activar edición"), arma cuestionarios, corrige entregas e intentos, carga notas.
- **Estudiante** — recorre materiales, rinde cuestionarios con temporizador,
  entrega tareas y ve sus notas.

Los datos demo viven en el navegador (localStorage) y se pueden reiniciar borrando
la clave `zeiro_demo_v1`.

## Puesta en producción (gratis)

1. **Base de datos** — crear un proyecto en [supabase.com](https://supabase.com)
   (plan Free) y ejecutar, en orden, en el SQL Editor:
   `db/schema.sql` → `db/policies.sql` → (opcional) `db/seed.sql`.
2. **Storage** — crear el bucket `zeiro-files` (privado; lectura con URL firmada)
   para adjuntos de materiales y entregas.
3. **Configurar** — en `app/config.js` pegar `SUPABASE_URL` y `SUPABASE_ANON_KEY`
   del proyecto. Con eso la app pasa del modo demo al login real por email.
4. **Hosting** — ya está en GitHub Pages (`/index.html` estático). También sirve
   cualquier hosting de archivos estáticos.

## Arquitectura

- `index.html` + `theme.css` + `app/*.js` — PWA vanilla, sin build ni frameworks.
- `db/schema.sql` — ~15 tablas limpias (contra las ~400 de Moodle).
- `db/policies.sql` — seguridad por fila: 3 roles claros (admin, docente,
  estudiante); los estudiantes no pueden leer respuestas correctas (`quiz_questions`).
- `sw.js` — shell cacheado: el material ya abierto funciona sin conexión.
- `docs/analisis-moodle.md` — debilidades de Moodle y cómo las resuelve Zeiro.

## Qué corrige respecto de Moodle

Edición inline permanente, un módulo se crea en 1 pantalla, autocorrección de
preguntas objetivas, planilla simple de notas autoguardadas, calendario que sale
solo de las fechas de entrega, duplicar curso en 1 clic, notificaciones en la home
y cero servidor que administrar.

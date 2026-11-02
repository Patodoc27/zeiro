# Análisis de Moodle → decisiones de Zeiro

## Qué se investigó

- **Clones/alternativas en GitHub**: `classroomio/classroomio` (1,7k★, SvelteKit+Supabase, orientado a empresas), `paideia-lms/Paideia` (Bun+React, binario único, en desarrollo), `deathlegionteamlk/doodle` (PHP 8, "Moodle-like but better"), Chamilo, Open edX, Canvas (open core), Frappe LMS, Google Classroom (cerrado).
- **Estructura interna de Moodle**: ~400 tablas. Núcleo: `course`, `course_sections`, `course_modules`, `modules` (tipos de actividad), `context`/`role_assignments` (permisos por contexto anidado), `grade_items`/`grade_grades` (gradebook), `question_*` (banco de preguntas separado del motor de intentos), `quiz_attempts`, `assign_submission`, `forum_*`, `enrol_*`.
- **Usabilidad reportada por docentes** (estudios de caso Tanzania, Uruguay, España; informes de performance UW-Madison).

## Estructura de Moodle (lo que hace bien)

1. Curso → secciones (temas/semanas) → módulos (recursos + actividades). Es un buen modelo mental y Zeiro lo conserva.
2. Banco de preguntas reutilizable separado del cuestionario.
3. Gradebook con ponderaciones y categorías.
4. Roles por contexto (sitio, curso, actividad).
5. Todo es un plugin → enorme ecosistema, pero también su mayor debilidad.

## Debilidades de Moodle y cómo las corrige Zeiro

| # | Debilidad de Moodle | Solución en Zeiro |
|---|---|---|
| 1 | "Activar edición": todo cambio exige entrar en modo edición, menús de 3 niveles y recargas | Edición inline permanente para el docente: agregar sección/módulo es un botón dentro de la propia página; autoguardado |
| 2 | UX laberíntica: crear un cuestionario toca ~8 pantallas y opciones crípticas | Asistente de 1 pantalla por tipo de actividad; defaults sensatos; opciones avanzadas colapsadas |
| 3 | ~400 tablas, arquitectura PHP de 2002, plugins frágiles que se rompen entre versiones | ~15 tablas limpias, API REST (PostgREST), cero plugins: todo integrado |
| 4 | Requiere servidor propio administrado (PHP + cron + mail + moodledata) | Gratis y sin servidor: GitHub Pages (frontend) + Supabase free (Postgres/Auth/Storage/Realtime) |
| 5 | Mobile pobre; la app oficial es otra cosa más para instalar/configurar | PWA instalable, mismo código para PC y celular (aunque Zeiro se diseña PC-first) |
| 6 | Gradebook intimidante: categorías anidadas, fórmulas, esquemas de calificación ocultos | Planilla plana por curso: alumnos × actividades, celda autoguardada, promedio ponderado visible |
| 7 | Notificaciones débiles (dependen de cron/mail configurado) | Panel de novedades en la home + Realtime; sin cron |
| 8 | Cuestionarios: corrección manual tediosa para preguntas objetivas; intentos difíciles de revisar | Autocorrección inmediata (opción múltiple, V/F, respuesta corta, emparejamiento); la docente solo revisa lo abierto y las notas finales |
| 9 | Permisos por "contextos" anidados: nadie entiende quién ve qué | 3 roles claros (admin, docente, estudiante) + RLS por fila en la base |
| 10 | Estética genérica y envejecida | Identidad propia Zeiro, modo claro, íconos SVG propios, cero elementos decorativos que no funcionen |
| 11 | Calendario separado que hay que alimentar a mano | Las fechas de entrega de los módulos ya son el calendario: vista agenda por curso y global |
| 12 | Duplicar/reutilizar un curso exige backup/restore | "Duplicar curso" nativo: copia secciones+módulos+quiz en 1 clic |
| 13 | Nada funciona sin conexión | PWA con shell cacheado; el estudiante puede repasar material ya abierto sin internet |

## Alcance de la versión 1

Roles admin/docente/estudiante · cursos con secciones · módulos: página, archivo, enlace, cuestionario, tarea, comunicado · banco de preguntas por docente · cuestionarios con temporizador, intentos y autocorrección · entregas con corrección y devolución · libro de calificaciones ponderado · agenda · comunicados por curso y globales · alta de usuarios e inscripciones.

V2 natural: foros, asistencia, familias, insignias, importación de CSV, reportes PDF.

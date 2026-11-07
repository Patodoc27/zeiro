# Análisis de clones de Moodle recientes (2025–2026)

Búsqueda en GitHub de proyectos que clonan/replican Moodle con actividad 2025-2026, para mapear todo lo que una plataforma educativa debe tener.

## Clones encontrados

| Repo | Creado | Qué aporta |
|---|---|---|
| **deathlegionteamlk/doodle** | jun-2026 | El más completo: "Moodle-like, but better". PHP+SQLite, 3 roles, IA integrada, gamificación, flashcards SM-2, mensajería, calendario iCal, certificados, encuestas, learning paths, analytics, REST API |
| **paideia-lms/Paideia** | sep-2025 | LMS en un solo binario (Bun+React). Cursos, quizzes, grading, roles, control de versiones de contenido, importación desde Moodle/Canvas |
| **enyojoo/easelms** | feb-2025 | Next.js+Supabase (¡nuestro stack!). Video con progreso guardado, prerrequisitos, categorías/tags, analytics, modos de inscripción, certificados, badges |
| **classroomio/classroomio** | 2023, activo | Alternativa a Moodle para empresas: LMS completo maduro |
| Varios `moodle-clone` estudiantiles | 2025 | Clones académicos simples (PHP), sin features nuevas |

## Elementos/botones que tiene una plataforma educativa completa (según doodle v2 + Paideia + EaseLMS)

### Administración
- Dashboard con estadísticas y gráfico de actividad 30 días
- Gestión de usuarios (crear, editar, suspender, roles)
- Catálogo con categorías anidadas
- Comunicados a todos, por rol o por curso
- Registro de auditoría
- Analytics de engagement y tasas de finalización

### Docente
- Panel con cola de entregas pendientes
- Cursos con imagen de portada, niveles, clave de inscripción
- Currícula modular (Unidades → lecciones/módulos)
- Tipos de lección: texto/HTML, archivo, URL/video
- Tareas con fecha y puntaje; entregas texto+archivo; corrección con feedback y notificación
- Cuestionarios autocorregidos (opción múltiple, V/F, corta) con intentos, tiempo, nota de aprobación, mezcla, mostrar-respuestas-después
- Planilla de notas por curso
- Progreso por estudiante (% completado)
- Plantillas de certificados auto-emitidos
- Encuestas/sondeos rápidos
- Learning paths (secuencias de cursos)
- Analytics por curso

### Estudiante
- Catálogo con búsqueda/filtros y auto-inscripción (opcionalmente con clave)
- Vista de aprendizaje con barra lateral de currícula y tracking de progreso
- Cuestionarios con puntaje instantáneo
- Entregas con texto + adjuntos
- Notas por curso desglosadas
- Foros (temas, respuestas, fijar, cerrar)
- Notificaciones in-app
- Flashcards con repetición espaciada (SM-2)
- XP, niveles, insignias, racha diaria, leaderboard
- Calendario con vencimientos + eventos propios + export iCal
- Certificados verificables por código
- Encuestas
- Mensajería directa docente↔estudiante
- Asistente IA de estudio

## Estado de Zeiro vs. esa lista

### Ya está
Roles · cursos con secciones/solapas/etiquetas/visibilidad programable · 9 tipos de módulo (Página, **Libro**, Archivo, Enlace, Cuestionario, Tarea, Comunicado, Foro, HTML) · cuestionarios con 5 tipos de pregunta (más que doodle: MC, V/F, corta, relación, ensayo) + timer/intentos/mezcla/aprobación · entregas multi-archivo + enlaces + HTML · planilla de notas + CSV · asistencia · foros · notificaciones · insignias · banco de preguntas · agenda · voz (lectura + dictado) · diseño instruccional completo · PWA offline

### Falta (orden sugerido de implementación)
1. **Mensajería interna** 1-a-1 con badge de no leídos
2. **Certificados** de finalización imprimibles con código
3. **Encuestas** por curso con resultados en vivo
4. **XP + niveles + racha + leaderboard** (extiende las insignias)
5. **Progreso por estudiante** para el docente
6. **Flashcards** de repaso
7. **Catálogo + inscripción por código de curso**
8. **Analytics** para dirección (actividad, finalización)
9. **Exportar agenda** (iCal / Google Calendar)
10. **Rúbricas** de corrección
11. **Asistente de estudio** (resumen/quiz generado del material, sin API externa)
12. **Vista "pendientes"** del estudiante + rol familia

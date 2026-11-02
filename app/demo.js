/* ZEIRO · Datos de demostración (modo sin backend).
   Escuela ejemplo: 1 dirección, 3 docentes, 8 estudiantes, 3 cursos. */
window.Z_DEMO_SEED = {
  meta: { seq: 900 },
  profiles: [
    { id: 'u-admin', full_name: 'Patricia Inés Castro', role: 'admin',      email: 'direccion@zeiro.demo' },
    { id: 'u-bio',   full_name: 'Lucía Fernández',      role: 'docente',    email: 'lfernandez@zeiro.demo' },
    { id: 'u-mat',   full_name: 'Marcos Ruiz',          role: 'docente',    email: 'mruiz@zeiro.demo' },
    { id: 'u-his',   full_name: 'Ana Torres',           role: 'docente',    email: 'atorres@zeiro.demo' },
    { id: 'u-e1', full_name: 'Aguirre, Martina',   role: 'estudiante', email: 'maguirre@zeiro.demo' },
    { id: 'u-e2', full_name: 'Benítez, Joaquín',   role: 'estudiante', email: 'jbenitez@zeiro.demo' },
    { id: 'u-e3', full_name: 'Correa, Valentina',  role: 'estudiante', email: 'vcorrea@zeiro.demo' },
    { id: 'u-e4', full_name: 'Díaz, Santino',      role: 'estudiante', email: 'sdiaz@zeiro.demo' },
    { id: 'u-e5', full_name: 'Escudero, Catalina', role: 'estudiante', email: 'cescudero@zeiro.demo' },
    { id: 'u-e6', full_name: 'Flores, Mateo',      role: 'estudiante', email: 'mflores@zeiro.demo' },
    { id: 'u-e7', full_name: 'Gómez, Antonia',     role: 'estudiante', email: 'agomez@zeiro.demo' },
    { id: 'u-e8', full_name: 'Herrera, Bautista',  role: 'estudiante', email: 'bherrera@zeiro.demo' }
  ],
  courses: [
    { id: 'c-bio', name: 'Biología · 5° 1°', short_name: 'BIO 5-1', color: '#14B8A6',
      description: 'Seres vivos, organización celular, biomoléculas y metabolismo.', school_year: '2026',
      teacher_id: 'u-bio', active: true, created_at: '2026-02-20T10:00:00Z' },
    { id: 'c-mat', name: 'Matemática · 3° 2°', short_name: 'MAT 3-2', color: '#2563EB',
      description: 'Funciones, ecuaciones y geometría analítica.', school_year: '2026',
      teacher_id: 'u-mat', active: true, created_at: '2026-02-20T10:00:00Z' },
    { id: 'c-his', name: 'Historia · 4° 1°', short_name: 'HIS 4-1', color: '#7C3AED',
      description: 'Argentina y mundo, siglos XIX y XX.', school_year: '2026',
      teacher_id: 'u-his', active: true, created_at: '2026-02-20T10:00:00Z' }
  ],
  enrollments: [
    { id: 'en1', course_id: 'c-bio', student_id: 'u-e1' }, { id: 'en2', course_id: 'c-bio', student_id: 'u-e2' },
    { id: 'en3', course_id: 'c-bio', student_id: 'u-e3' }, { id: 'en4', course_id: 'c-bio', student_id: 'u-e4' },
    { id: 'en5', course_id: 'c-bio', student_id: 'u-e5' }, { id: 'en6', course_id: 'c-bio', student_id: 'u-e6' },
    { id: 'en7', course_id: 'c-bio', student_id: 'u-e7' }, { id: 'en8', course_id: 'c-bio', student_id: 'u-e8' },
    { id: 'en9', course_id: 'c-mat', student_id: 'u-e1' }, { id: 'en10', course_id: 'c-mat', student_id: 'u-e2' },
    { id: 'en11', course_id: 'c-mat', student_id: 'u-e3' }, { id: 'en12', course_id: 'c-mat', student_id: 'u-e4' },
    { id: 'en13', course_id: 'c-his', student_id: 'u-e5' }, { id: 'en14', course_id: 'c-his', student_id: 'u-e6' },
    { id: 'en15', course_id: 'c-his', student_id: 'u-e7' }, { id: 'en16', course_id: 'c-his', student_id: 'u-e8' }
  ],
  sections: [
    { id: 's-b1', course_id: 'c-bio', title: 'Unidad 1 · La célula', position: 1 },
    { id: 's-b2', course_id: 'c-bio', title: 'Unidad 2 · Biomoléculas', position: 2 },
    { id: 's-m1', course_id: 'c-mat', title: 'Funciones lineales', position: 1 },
    { id: 's-h1', course_id: 'c-his', title: 'El siglo XIX argentino', position: 1 }
  ],
  modules: [
    { id: 'm-b1', course_id: 'c-bio', section_id: 's-b1', type: 'page', position: 1, visible: true, due_date: null,
      title: 'La célula: unidad estructural y funcional',
      content: { body: '<p>Todo ser vivo está formado por una o más células. La célula es la <b>unidad estructural</b> (todo organismo está hecho de ellas), <b>funcional</b> (realiza nutrición, relación y reproducción) y <b>genética</b> (contiene el material hereditario).</p><h4>Tipos celulares</h4><ul><li><b>Procariota</b>: sin núcleo definido; el ADN está disperso. Ej.: bacterias.</li><li><b>Eucariota</b>: núcleo delimitado por membrana. Ej.: células animales, vegetales, hongos.</li></ul><h4>Orgánulos clave</h4><ul><li><b>Mitocondria</b>: respiración celular, produce ATP.</li><li><b>Cloroplasto</b> (solo vegetales): fotosíntesis.</li><li><b>Ribosomas</b>: síntesis de proteínas.</li><li><b>Membrana plasmática</b>: controla entradas y salidas.</li></ul>' }, created_at: '2026-03-02T12:00:00Z' },
    { id: 'm-b2', course_id: 'c-bio', section_id: 's-b1', type: 'link', position: 2, visible: true, due_date: null,
      title: 'Video: tour interactivo por la célula',
      content: { url: 'https://www.youtube.com/results?search_query=la+celula+eucariota+animal+y+vegetal' }, created_at: '2026-03-02T12:05:00Z' },
    { id: 'm-b3', course_id: 'c-bio', section_id: 's-b1', type: 'assignment', position: 3, visible: true,
      due_date: '2026-11-10T23:59:00Z',
      title: 'TP 1 · Célula animal vs. vegetal',
      content: { instructions: 'Elaborar un cuadro comparativo con al menos <b>6 diferencias</b> entre célula animal y vegetal (presencia de pared, cloroplastos, vacuolas, forma, centriolos, nutrición). Se puede adjuntar una imagen o escribir el cuadro en texto.', max_grade: 10, allow_late: true }, created_at: '2026-03-03T12:00:00Z' },
    { id: 'm-b4', course_id: 'c-bio', section_id: 's-b2', type: 'quiz', position: 1, visible: true,
      due_date: '2026-11-14T23:59:00Z',
      title: 'Cuestionario · Biomoléculas',
      content: { time_limit_min: 15, attempts_allowed: 2, shuffle: true, pass_grade: 6, max_grade: 10,
                 intro: 'Preguntas sobre glúcidos, lípidos, proteínas y ácidos nucleicos. Tenés 2 intentos: cuenta el mejor.' }, created_at: '2026-03-10T12:00:00Z' },
    { id: 'm-b5', course_id: 'c-bio', section_id: 's-b2', type: 'page', position: 2, visible: true, due_date: null,
      title: 'Guía de estudio · Biomoléculas',
      content: { body: '<p><b>Glúcidos</b>: energía rápida (glucosa) y reserva (almidón, glucógeno). <b>Lípidos</b>: membranas, reserva y aislación. <b>Proteínas</b>: enzimas, estructura, defensa, transporte. <b>Ácidos nucleicos</b>: ADN y ARN, información genética.</p>' }, created_at: '2026-03-10T12:10:00Z' },
    { id: 'm-m1', course_id: 'c-mat', section_id: 's-m1', type: 'page', position: 1, visible: true, due_date: null,
      title: 'Función lineal: fórmula y gráfica',
      content: { body: '<p>Una función lineal tiene la forma <b>y = m·x + b</b>, donde <i>m</i> es la pendiente y <i>b</i> la ordenada al origen.</p>' }, created_at: '2026-03-04T12:00:00Z' },
    { id: 'm-m2', course_id: 'c-mat', section_id: 's-m1', type: 'assignment', position: 2, visible: true,
      due_date: '2026-11-12T23:59:00Z',
      title: 'TP 1 · Gráficas de funciones',
      content: { instructions: 'Graficar las 5 funciones dadas en clase e indicar pendiente y ordenada al origen de cada una.', max_grade: 10, allow_late: false }, created_at: '2026-03-04T12:10:00Z' },
    { id: 'm-h1', course_id: 'c-his', section_id: 's-h1', type: 'page', position: 1, visible: true, due_date: null,
      title: 'La organización nacional',
      content: { body: '<p>Entre 1852 y 1862 se sancionó la Constitución Nacional y se organizó el Estado argentino.</p>' }, created_at: '2026-03-05T12:00:00Z' },
    { id: 'm-h2', course_id: 'c-his', section_id: 's-h1', type: 'announcement', position: 2, visible: true, due_date: null,
      title: 'Recuerden: debate el viernes',
      content: { body: 'El viernes debatimos unitarios vs. federales. Traigan la guía leída.' }, created_at: '2026-03-05T12:30:00Z' }
  ],
  questions: [
    { id: 'q1', module_id: 'm-b4', type: 'mcq', position: 1, points: 2,
      prompt: '¿Cuál de estas biomoléculas cumple principalmente función estructural?',
      payload: { choices: ['Glucosa', 'Colágeno', 'ATP', 'Glucógeno'], correct: [1], multiple: false } },
    { id: 'q2', module_id: 'm-b4', type: 'tf', position: 2, points: 1,
      prompt: 'Los lípidos son solubles en agua.', payload: { correct: false } },
    { id: 'q3', module_id: 'm-b4', type: 'mcq', position: 3, points: 2,
      prompt: 'Seleccioná TODAS las funciones de las proteínas.',
      payload: { choices: ['Enzimas que aceleran reacciones', 'Reserva de energía a largo plazo', 'Anticuerpos de defensa', 'Transporte como la hemoglobina'], correct: [0, 2, 3], multiple: true } },
    { id: 'q4', module_id: 'm-b4', type: 'short', position: 4, points: 2,
      prompt: '¿Qué biomolécula guarda la información genética?',
      payload: { accepted: ['ADN', 'ácido desoxirribonucleico', 'acido desoxirribonucleico'], case_sensitive: false } },
    { id: 'q5', module_id: 'm-b4', type: 'match', position: 5, points: 2,
      prompt: 'Uní cada biomolécula con su función principal.',
      payload: { left: ['Proteínas', 'Lípidos', 'Glúcidos'], right: ['Enzimas y estructura', 'Reserva y membranas', 'Energía rápida'] } },
    { id: 'q6', module_id: 'm-b4', type: 'essay', position: 6, points: 1,
      prompt: 'Explicá con tus palabras por qué se dice que las proteínas son las "obreras" de la célula.',
      payload: {} }
  ],
  quiz_attempts: [
    { id: 'a1', module_id: 'm-b4', student_id: 'u-e2', started_at: '2026-10-28T14:00:00Z', finished_at: '2026-10-28T14:11:00Z',
      answers: { q1: [1], q2: false, q3: [0, 2], q4: 'adn', q5: { 'Proteínas': 'Enzimas y estructura', 'Lípidos': 'Energía rápida', 'Glúcidos': 'Reserva y membranas' }, q6: 'Porque hacen casi todo el trabajo: son enzimas, defienden y transportan.' },
      score: 6.4, max_score: 10, needs_review: true, status: 'submitted' },
    { id: 'a2', module_id: 'm-b4', student_id: 'u-e3', started_at: '2026-10-29T10:00:00Z', finished_at: '2026-10-29T10:09:00Z',
      answers: { q1: [1], q2: false, q3: [0, 2, 3], q4: 'ADN', q5: { 'Proteínas': 'Enzimas y estructura', 'Lípidos': 'Reserva y membranas', 'Glúcidos': 'Energía rápida' }, q6: 'Las proteínas son enzimas que catalizan reacciones, forman estructuras como el colágeno y defienden al organismo; por eso se las compara con obreros que construyen y mantienen.' },
      score: 9, max_score: 10, needs_review: false, status: 'graded' }
  ],
  submissions: [
    { id: 'sb1', module_id: 'm-b3', student_id: 'u-e1', submitted_at: '2026-10-30T18:00:00Z',
      body: 'Pared celular: solo vegetal. Cloroplastos: solo vegetal. Vacuola: grande en vegetal, chica en animal. Forma: vegetal poliédrica, animal redonda. Centriolos: solo animal. Nutrición: vegetal autótrofa.',
      grade: 9, feedback: 'Muy completo. Bien diferenciada la nutrición.', graded_at: '2026-10-31T10:00:00Z', graded_by: 'u-bio' },
    { id: 'sb2', module_id: 'm-b3', student_id: 'u-e4', submitted_at: '2026-10-31T20:30:00Z',
      body: 'La vegetal tiene pared y cloroplastos, la animal no. La animal tiene centriolos.',
      grade: null, feedback: null }
  ],
  grades: [
    { id: 'g1', course_id: 'c-bio', student_id: 'u-e1', module_id: 'm-b3', grade: 9, max_grade: 10, weight: 1, updated_at: '2026-10-31T10:00:00Z' },
    { id: 'g2', course_id: 'c-bio', student_id: 'u-e3', module_id: 'm-b4', grade: 9, max_grade: 10, weight: 1, updated_at: '2026-10-29T10:10:00Z' },
    { id: 'g3', course_id: 'c-bio', student_id: 'u-e2', module_id: 'm-b4', grade: 6.4, max_grade: 10, weight: 1, updated_at: '2026-10-28T14:12:00Z' },
    { id: 'g4', course_id: 'c-bio', student_id: 'u-e1', module_id: null, label: 'Oral Unidad 1', grade: 8, max_grade: 10, weight: 1, updated_at: '2026-10-25T10:00:00Z' },
    { id: 'g5', course_id: 'c-bio', student_id: 'u-e2', module_id: null, label: 'Oral Unidad 1', grade: 4, max_grade: 10, weight: 1, updated_at: '2026-10-25T10:00:00Z' }
  ],
  announcements: [
    { id: 'an1', course_id: null, author_id: 'u-admin', title: 'Bienvenidos a Zeiro',
      body: 'Esta es la nueva plataforma del colegio: materiales, tareas, cuestionarios y notas en un solo lugar.', audience: 'todos', created_at: '2026-10-20T12:00:00Z' },
    { id: 'an2', course_id: 'c-bio', author_id: 'u-bio', title: 'Cuestionario de Biomoléculas habilitado',
      body: 'Ya está abierto. Tienen 2 intentos y cuenta el mejor puntaje.', audience: 'estudiantes', created_at: '2026-10-27T12:00:00Z' }
  ],
  module_views: [
    { module_id: 'm-b1', student_id: 'u-e1', viewed_at: '2026-10-28T09:00:00Z' },
    { module_id: 'm-b1', student_id: 'u-e2', viewed_at: '2026-10-28T09:10:00Z' }
  ]
};

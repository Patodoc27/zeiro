/* ZEIRO · Vistas (todas las pantallas por rol). */
(function () {
  var Z = window.Z = window.Z || {};
  var api = function () { return Z.api; };
  var esc = function (s) { return Z.esc(s); };
  var TICON = { page: 'page', file: 'file', link: 'link', quiz: 'quiz', assignment: 'task', announcement: 'mega' };
  var TNOMBRE = { page: 'Página', file: 'Archivo', link: 'Enlace', quiz: 'Cuestionario', assignment: 'Tarea', announcement: 'Comunicado del curso' };

  function topbar(titulo, sub, extra) {
    return '<div class="topbar"><div><h1>' + esc(titulo) + '</h1>' +
      (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div><div class="esp"></div>' + (extra || '') + '</div>';
  }
  function volver(hash, txt) {
    return '<a class="btn sec sm" href="' + hash + '" style="margin-bottom:12px">' + ZI('back') + ' ' + (txt || 'Volver') + '</a>';
  }
  function esDocenteDe(c) {
    var me = api().me();
    return me.role === 'admin' || (c.teacher_id && c.teacher_id === me.id);
  }
  function notaCls(n) { return n == null ? '' : (n >= 6 ? 'buen' : 'mala'); }
  function pillNota(n) { return n == null ? '<span class="pill gris">—</span>' : '<span class="pill ' + (n >= 6 ? 'tur' : 'mal') + '">' + n + '</span>'; }

  /* ================= HOME ================= */
  function home() {
    var me = api().me();
    Promise.all([api().myCourses(), api().announcements()]).then(function (rs) {
      var cursos = rs[0], anns = rs[1];
      var h = topbar('Hola, ' + esc(me.full_name.split(',')[0].split(' ')[0]),
        'Bienvenido/a a Zeiro — ' + new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }));
      h += '<div class="grid gr4" style="margin-bottom:18px">';
      h += '<div class="kpi"><div class="n">' + cursos.length + '</div><div class="t">' + (me.role === 'estudiante' ? 'Cursos en los que estás' : 'Cursos a cargo') + '</div></div>';
      var pend = 0, evals = 0;
      cursos.forEach(function (c) { /* se calcula abajo por curso */ });
      h += '<div class="kpi tur"><div class="n" id="k_entregas">…</div><div class="t">' + (me.role === 'estudiante' ? 'Entregas próximas' : 'Cuestionarios/tareas activas') + '</div></div>';
      h += '<div class="kpi azu"><div class="n" id="k_anuncios">' + anns.length + '</div><div class="t">Comunicados</div></div>';
      h += '<div class="kpi neg"><div class="n" id="k_alumnos">…</div><div class="t">' + (me.role === 'estudiante' ? 'Materiales nuevos' : 'Estudiantes') + '</div></div>';
      h += '</div>';
      h += '<div class="grid" style="grid-template-columns:2fr 1fr">';
      h += '<div class="card"><div class="entre"><h2 style="font-size:17px">' + (me.role === 'estudiante' ? 'Mis cursos' : 'Cursos') + '</h2>' +
        (me.role === 'admin' ? '<button class="btn sm" id="h_ncurso">' + ZI('plus') + ' Nuevo curso</button>' : '') + '</div><div id="h_cursos" style="margin-top:14px"></div></div>';
      h += '<div class="card"><h2 style="font-size:17px;margin-bottom:12px">Novedades</h2><div id="h_anns"></div></div>';
      h += '</div>';
      var main = Z.shell(h, '#/home');

      var lista = main.querySelector('#h_cursos');
      lista.innerHTML = cursos.length ? cursos.map(function (c) {
        return '<a class="curso-tile" href="#/curso/' + c.id + '" style="text-decoration:none;color:inherit">' +
          '<div class="barra" style="background:' + esc(c.color || '#7C3AED') + '"></div>' +
          '<div class="cuerpo"><h3>' + esc(c.name) + '</h3><p>' + esc(c.description || '') + '</p>' +
          '<div class="meta"><span class="pill vio">' + esc(c.short_name || '') + '</span>' +
          '<span class="pill gris">' + esc(c.school_year || '') + '</span></div></div>' + ZI('back') + '</a>';
      }).join('') : '<div class="vacio">' + ZI('book') + '<p>Todavía no hay cursos asignados.</p></div>';
      lista.querySelectorAll('.curso-tile > .ic:last-child').forEach(function (i) {
        i.style.transform = 'scaleX(-1)'; i.style.alignSelf = 'center'; i.style.marginRight = '14px'; i.style.color = 'var(--neg-150)';
      });

      var aa = main.querySelector('#h_anns');
      aa.innerHTML = anns.length ? anns.slice(0, 6).map(function (a) {
        return '<div style="padding:10px 0;border-bottom:1px solid var(--linea)">' +
          '<div class="fila"><span class="pill ' + (a.course_id ? 'vio' : 'neg') + '" style="font-size:10.5px">' + esc(a.course_name) + '</span>' +
          '<small style="color:var(--neg-300);margin-left:auto">' + Z.fmtFecha(a.created_at) + '</small></div>' +
          '<b style="display:block;margin-top:5px">' + esc(a.title) + '</b>' +
          '<div style="font-size:13px;color:var(--neg-500)">' + esc(a.body).slice(0, 110) + (a.body.length > 110 ? '…' : '') + '</div></div>';
      }).join('') : '<div class="vacio">' + ZI('mega') + '<p>Sin comunicados.</p></div>';

      // KPIs por curso
      var entregas = 0, alumnos = new Set(), hechas = 0;
      var ps = cursos.map(function (c) {
        return api().course(c.id).then(function (cc) {
          cc.modules.forEach(function (m) {
            if ((m.type === 'quiz' || m.type === 'assignment') && m.visible) {
              if (m.due_date && new Date(m.due_date) >= new Date()) entregas++; else evals++;
            }
          });
          cc.students.forEach(function (s) { alumnos.add(s.id); });
        });
      });
      Promise.all(ps).then(function () {
        var k1 = main.querySelector('#k_entregas'), k2 = main.querySelector('#k_alumnos');
        if (k1) k1.textContent = entregas + evals;
        if (k2) k2.textContent = me.role === 'estudiante' ? '—' : alumnos.size;
      });
      var nc = main.querySelector('#h_ncurso');
      if (nc) nc.onclick = function () { modalCurso(null); };
    });
  }

  /* ================= MIS CURSOS ================= */
  function misCursos() {
    api().myCourses().then(function (cursos) {
      var me = api().me();
      var h = topbar(me.role === 'estudiante' ? 'Mis cursos' : 'Cursos', '',
        me.role === 'admin' ? '<button class="btn" id="mc_new">' + ZI('plus') + ' Nuevo curso</button>' : '');
      h += '<div id="mc_lista" class="grid gr2"></div>';
      var main = Z.shell(h, '#/mis-cursos');
      var el = main.querySelector('#mc_lista');
      el.innerHTML = cursos.length ? cursos.map(function (c) {
        return '<a class="curso-tile" href="#/curso/' + c.id + '" style="text-decoration:none;color:inherit">' +
          '<div class="barra" style="background:' + esc(c.color || '#7C3AED') + '"></div>' +
          '<div class="cuerpo"><h3>' + esc(c.name) + '</h3><p>' + esc(c.description || '') + '</p>' +
          '<div class="meta"><span class="pill vio">' + esc(c.short_name || '') + '</span></div></div></a>';
      }).join('') : '<div class="vacio">' + ZI('book') + '<p>Sin cursos.</p></div>';
      var nb = main.querySelector('#mc_new');
      if (nb) nb.onclick = function () { modalCurso(null); };
    });
  }

  /* ================= CURSO ================= */
  function curso(id) {
    api().course(id).then(function (c) {
      if (!c) { Z.shell(topbar('Curso no encontrado'), '#/mis-cursos'); return; }
      var me = api().me();
      var edita = esDocenteDe(c);
      var h = volver('#/mis-cursos') +
        topbar(c.name, (c.teacher ? 'Prof. ' + esc(c.teacher.full_name) + ' · ' : '') + esc(c.description || ''),
          edita
            ? '<a class="btn sec" href="#/curso/' + id + '/notas">' + ZI('star') + ' Calificaciones</a>' +
              '<button class="btn" id="c_addsec">' + ZI('plus') + ' Sección</button>'
            : (me.role === 'estudiante' ? '<a class="btn sec" href="#/curso/' + id + '/notas">' + ZI('star') + ' Mis notas</a>' : ''));
      h += '<div id="c_secs"></div>';
      var main = Z.shell(h, '#/mis-cursos');
      var wrap = main.querySelector('#c_secs');

      function pintar() {
        api().course(id).then(function (cc) { c = cc; dibujar(); });
      }
      function dibujar() {
        var secs = c.sections.slice().sort(function (a, b) { return a.position - b.position; });
        wrap.innerHTML = secs.map(function (s) {
          var mods = c.modules.filter(function (m) { return m.section_id === s.id && (edita || m.visible); })
            .sort(function (a, b) { return a.position - b.position; });
          return '<div class="seccion"><header><h3>' + esc(s.title) + '</h3>' +
            '<span class="pill gris">' + mods.length + ' ítem' + (mods.length === 1 ? '' : 's') + '</span>' +
            (edita ? '<button class="iconbtn" data-editsec="' + s.id + '" title="Renombrar">' + ZI('edit') + '</button>' +
              '<button class="iconbtn" data-delsec="' + s.id + '" title="Borrar sección">' + ZI('trash') + '</button>' : '') +
            '</header><div class="cuerpo">' +
            mods.map(function (m) { return filaModulo(m, edita); }).join('') +
            (edita ? '<div class="fila wrap" style="margin-top:10px;gap:6px">' +
              Object.keys(TNOMBRE).map(function (t) {
                return '<button class="btn sec sm" data-addmod="' + s.id + '|' + t + '">' + ZI(TICON[t]) + ' ' + TNOMBRE[t] + '</button>';
              }).join('') + '</div>' : '') +
            '</div></div>';
        }).join('') || '<div class="card vacio">' + ZI('book') + '<p>Curso vacío.' + (edita ? ' Agregá la primera sección.' : '') + '</p></div>';

        wire();
      }

      function filaModulo(m, edita) {
        var me2 = api().me();
        var href = destinoModulo(m);
        var extra = '';
        if (m.due_date) extra += '<span class="pill azu chip-estado">' + ZI('clock') + ' ' + Z.fmtFecha(m.due_date) + '</span> ';
        if (m.type === 'quiz' && m.content) {
          extra += '<span class="pill vio chip-estado">' + (m.content.attempts_allowed || 1) + ' intento' + ((m.content.attempts_allowed || 1) > 1 ? 's' : '') + '</span> ';
          if (m.content.time_limit_min) extra += '<span class="pill vio chip-estado">' + m.content.time_limit_min + ' min</span> ';
        }
        if (!m.visible) extra += '<span class="pill gris chip-estado">oculto</span> ';
        var inner = '<div class="info"><b>' + esc(m.title) + '</b><p>' + extra + descripcionModulo(m) + '</p></div>';
        var acts = '';
        if (edita) {
          acts = '<div class="acts">' +
            '<button class="iconbtn" data-move="' + m.id + '|-1" title="Subir">' + ZI('up') + '</button>' +
            '<button class="iconbtn" data-move="' + m.id + '|1" title="Bajar">' + ZI('down') + '</button>' +
            '<button class="iconbtn" data-editmod="' + m.id + '" title="Editar">' + ZI('edit') + '</button>' +
            '<button class="iconbtn" data-vismod="' + m.id + '" title="Mostrar/ocultar">' + ZI(m.visible ? 'eye' : 'eyeoff') + '</button>' +
            '<button class="iconbtn" data-delmod="' + m.id + '" title="Borrar">' + ZI('trash') + '</button></div>';
        } else if (me2.role === 'estudiante' && m.type === 'assignment') {
          acts = '<div class="acts"><a class="btn sm" href="#/entrega/' + m.id + '">Entregar</a></div>';
        } else if (me2.role === 'estudiante' && m.type === 'quiz') {
          acts = '<div class="acts"><a class="btn sm" href="#/quiz/' + m.id + '">Rendir</a></div>';
        } else if (edita && m.type === 'quiz') {
          acts = '';
        }
        return '<div class="mod' + (m.visible ? '' : ' oculto') + '"><a href="' + href + '" style="color:var(--vio-500)">' + ZI(TICON[m.type]) + '</a>' + inner + acts + '</div>';
      }
      function destinoModulo(m) {
        var me2 = api().me();
        if (edita && m.type === 'quiz') return '#/correccion-quiz/' + m.id;
        if (edita && m.type === 'assignment') return '#/corregir-entregas/' + m.id;
        if (me2.role === 'estudiante' && m.type === 'quiz') return '#/quiz/' + m.id;
        if (me2.role === 'estudiante' && m.type === 'assignment') return '#/entrega/' + m.id;
        return '#/modulo/' + m.id;
      }
      function descripcionModulo(m) {
        var c = m.content || {};
        if (m.type === 'link') return esc(c.url || '');
        if (m.type === 'file') return esc(c.file_name || 'Archivo adjunto');
        if (m.type === 'page') return esc((c.body || '').replace(/<[^>]+>/g, '').slice(0, 90)) + '…';
        if (m.type === 'quiz') return 'Cuestionario' + (c.pass_grade ? ' · aprueba con ' + c.pass_grade : '');
        if (m.type === 'assignment') return 'Tarea' + (c.max_grade ? ' · nota máx. ' + c.max_grade : '');
        if (m.type === 'announcement') return esc((c.body || '').slice(0, 90));
        return '';
      }

      function wire() {
        wrap.querySelectorAll('[data-addsec], #c_addsec').forEach(function (b) {
          b.onclick = function () { modalSeccion(null); };
        });
        var addSec = main.querySelector('#c_addsec');
        if (addSec) addSec.onclick = function () { modalSeccion(null); };
        wrap.querySelectorAll('[data-editsec]').forEach(function (b) {
          b.onclick = function () {
            var s = c.sections.filter(function (x) { return x.id === b.getAttribute('data-editsec'); })[0];
            modalSeccion(s);
          };
        });
        wrap.querySelectorAll('[data-delsec]').forEach(function (b) {
          b.onclick = function () {
            Z.confirm('Se borra la sección con todos sus ítems.', function () {
              api().deleteSection(b.getAttribute('data-delsec')).then(pintar);
            });
          };
        });
        wrap.querySelectorAll('[data-addmod]').forEach(function (b) {
          b.onclick = function () {
            var parts = b.getAttribute('data-addmod').split('|');
            modalModulo(c.id, parts[0], parts[1], null, pintar);
          };
        });
        wrap.querySelectorAll('[data-editmod]').forEach(function (b) {
          b.onclick = function () {
            var m = c.modules.filter(function (x) { return x.id === b.getAttribute('data-editmod'); })[0];
            modalModulo(c.id, m.section_id, m.type, m, pintar);
          };
        });
        wrap.querySelectorAll('[data-delmod]').forEach(function (b) {
          b.onclick = function () {
            Z.confirm('Se borra el ítem y sus datos asociados.', function () {
              api().deleteModule(b.getAttribute('data-delmod')).then(pintar);
            });
          };
        });
        wrap.querySelectorAll('[data-vismod]').forEach(function (b) {
          b.onclick = function () {
            var m = c.modules.filter(function (x) { return x.id === b.getAttribute('data-vismod'); })[0];
            api().saveModule(c.id, { id: m.id, visible: !m.visible }).then(pintar);
          };
        });
        wrap.querySelectorAll('[data-move]').forEach(function (b) {
          b.onclick = function () {
            var p = b.getAttribute('data-move').split('|');
            api().moveModule(p[0], Number(p[1])).then(pintar);
          };
        });
      }

      function modalSeccion(s) {
        var v = Z.modal('<h2>' + (s ? 'Renombrar sección' : 'Nueva sección') + '</h2>' +
          '<label>Título</label><input id="ms_t" value="' + esc(s ? s.title : '') + '" placeholder="Ej.: Unidad 3 · Ecología">' +
          '<div class="fila" style="justify-content:flex-end;margin-top:16px"><button class="btn sec" data-x>Cancelar</button>' +
          '<button class="btn" data-ok>Guardar</button></div>');
        v.querySelector('[data-x]').onclick = function () { v.remove(); };
        v.querySelector('[data-ok]').onclick = function () {
          var t = v.querySelector('#ms_t').value.trim();
          if (!t) return Z.toast('Poné un título', 'mal');
          api().saveSection(id, { id: s ? s.id : null, title: t }).then(function () { v.remove(); pintar(); });
        };
      }
      dibujar();
    });
  }

  /* ---------- editor de módulo (una sola pantalla, no 8 como Moodle) ---------- */
  function modalModulo(courseId, sectionId, tipo, m, done) {
    var c = (m && m.content) || {};
    var cuerpo = '';
    if (tipo === 'page') cuerpo = '<label>Contenido (HTML simple permitido)</label><textarea id="mm_body" style="min-height:160px">' + esc(c.body || '') + '</textarea>';
    else if (tipo === 'link') cuerpo = '<label>URL</label><input id="mm_url" value="' + esc(c.url || '') + '" placeholder="https://…">';
    else if (tipo === 'file') cuerpo = '<label>Archivo</label><input type="file" id="mm_file">' + (c.file_name ? '<p style="font-size:12px;color:var(--neg-300)">Actual: ' + esc(c.file_name) + '</p>' : '') +
      '<p style="font-size:12px;color:var(--neg-300)">En modo demo se guarda solo el nombre; con Supabase se sube a Storage.</p>';
    else if (tipo === 'assignment') cuerpo =
      '<label>Consigna</label><textarea id="mm_ins">' + esc(c.instructions || '') + '</textarea>' +
      '<div class="fila"><div style="width:130px"><label>Nota máx.</label><input type="number" id="mm_max" value="' + (c.max_grade || 10) + '"></div>' +
      '<div style="flex:1"><label>Fecha de entrega</label><input type="datetime-local" id="mm_due" value="' + (m && m.due_date ? m.due_date.slice(0, 16) : '') + '"></div></div>' +
      '<label style="margin-top:8px"><input type="checkbox" id="mm_late" ' + (c.allow_late ? 'checked' : '') + ' style="width:auto"> aceptar entregas fuera de término</label>';
    else if (tipo === 'quiz') cuerpo =
      '<label>Introducción para el estudiante</label><textarea id="mm_intro" style="min-height:60px">' + esc(c.intro || '') + '</textarea>' +
      '<div class="grid gr4">' +
      '<div><label>Minutos</label><input type="number" id="mm_time" value="' + (c.time_limit_min || '') + '" placeholder="0 = sin límite"></div>' +
      '<div><label>Intentos</label><input type="number" id="mm_att" value="' + (c.attempts_allowed || 1) + '" min="1"></div>' +
      '<div><label>Nota máx.</label><input type="number" id="mm_max" value="' + (c.max_grade || 10) + '"></div>' +
      '<div><label>Aprueba con</label><input type="number" id="mm_pass" value="' + (c.pass_grade || 6) + '"></div></div>' +
      '<label style="margin-top:8px"><input type="checkbox" id="mm_shuf" ' + (c.shuffle ? 'checked' : '') + ' style="width:auto"> mezclar preguntas por estudiante</label>' +
      '<p style="font-size:12.5px;color:var(--neg-300);margin-top:8px">Las preguntas se editan aparte desde el ítem del curso → botón de edición → "Editar preguntas".</p>';
    else if (tipo === 'announcement') cuerpo = '<label>Mensaje</label><textarea id="mm_body">' + esc(c.body || '') + '</textarea>';

    var v = Z.modal('<h2>' + (m ? 'Editar' : 'Nuevo') + ' · ' + TNOMBRE[tipo] + '</h2>' +
      '<label>Título</label><input id="mm_title" value="' + esc(m ? m.title : '') + '">' + cuerpo +
      '<div class="fila" style="justify-content:flex-end;margin-top:16px;gap:8px">' +
      (m && tipo === 'quiz' ? '<button class="btn tur" data-preg>' + ZI('edit') + ' Editar preguntas</button>' : '') +
      '<button class="btn sec" data-x>Cancelar</button><button class="btn" data-ok>Guardar</button></div>');
    v.querySelector('[data-x]').onclick = function () { v.remove(); };
    var bp = v.querySelector('[data-preg]');
    if (bp) bp.onclick = function () { v.remove(); location.hash = '#/editor-quiz/' + m.id; };
    v.querySelector('[data-ok]').onclick = function () {
      var title = v.querySelector('#mm_title').value.trim();
      if (!title) return Z.toast('Poné un título', 'mal');
      var content = {};
      var due = null;
      if (tipo === 'page' || tipo === 'announcement') content.body = v.querySelector('#mm_body').value;
      else if (tipo === 'link') content.url = v.querySelector('#mm_url').value.trim();
      else if (tipo === 'file') {
        var f = v.querySelector('#mm_file').files[0];
        content.file_name = f ? f.name : (c.file_name || 'archivo');
        content.file_url = c.file_url || null;
      } else if (tipo === 'assignment') {
        content = { instructions: v.querySelector('#mm_ins').value, max_grade: Number(v.querySelector('#mm_max').value) || 10, allow_late: v.querySelector('#mm_late').checked };
        var dd = v.querySelector('#mm_due').value;
        due = dd ? new Date(dd).toISOString() : null;
      } else if (tipo === 'quiz') {
        content = { intro: v.querySelector('#mm_intro').value, time_limit_min: Number(v.querySelector('#mm_time').value) || null,
          attempts_allowed: Number(v.querySelector('#mm_att').value) || 1, max_grade: Number(v.querySelector('#mm_max').value) || 10,
          pass_grade: Number(v.querySelector('#mm_pass').value) || 6, shuffle: v.querySelector('#mm_shuf').checked };
      }
      api().saveModule(courseId, { id: m ? m.id : null, section_id: sectionId, type: tipo, title: title, content: content, due_date: due, visible: m ? m.visible : true })
        .then(function () { v.remove(); Z.toast('Guardado', 'ok'); done && done(); });
    };
  }

  /* ---------- vista de módulo simple (page/link/file/announcement) ---------- */
  function modulo(mid) {
    // resolver curso vía módulo: buscar en todos los cursos del usuario
    api().myCourses().then(function (cursos) {
      var found = null, fcourse = null, i = 0;
      function next() {
        if (i >= cursos.length) { Z.shell(topbar('No encontrado'), '#/mis-cursos'); return; }
        api().course(cursos[i].id).then(function (c) {
          c.modules.forEach(function (m) { if (m.id === mid) { found = m; fcourse = c; } });
          i++; if (found) pintar(); else next();
        });
      }
      function pintar() {
        var m = found, c = fcourse;
        var h = volver('#/curso/' + c.id, esc(c.short_name || c.name)) + topbar(m.title, esc(c.name));
        if (m.type === 'page') h += '<div class="card" style="max-width:860px">' + (m.content.body || '') + '</div>';
        else if (m.type === 'link') h += '<div class="card"><p>' + ZI('link') + ' <a href="' + esc(m.content.url) + '" target="_blank" rel="noopener">' + esc(m.content.url) + '</a></p>' +
          '<a class="btn" href="' + esc(m.content.url) + '" target="_blank" rel="noopener" style="margin-top:8px">Abrir enlace</a></div>';
        else if (m.type === 'file') h += '<div class="card"><div class="fila">' + ZI('file') + '<b>' + esc(m.content.file_name || 'Archivo') + '</b>' +
          (m.content.file_url ? '<a class="btn sm" href="' + esc(m.content.file_url) + '" target="_blank">Descargar</a>' : '<span class="pill gris">demo</span>') + '</div></div>';
        else if (m.type === 'announcement') h += '<div class="card"><p>' + esc(m.content.body) + '</p><small style="color:var(--neg-300)">' + Z.fmtFecha(m.created_at, true) + '</small></div>';
        var main = Z.shell(h, '#/mis-cursos');
        if (api().me().role === 'estudiante') api().markViewed(mid);
      }
      next();
    });
  }

  /* ================= CUESTIONARIO: ALUMNO ================= */
  function tomarQuiz(mid) {
    var me = api().me();
    Promise.all([api().myAttempts(mid), api().questions(mid, true)]).then(function (rs) {
      var attempts = rs[0], qs = rs[1];
      api().myCourses().then(function (cursos) {
        var cm = null, cc = null, i = 0;
        (function next() {
          if (i >= cursos.length) return;
          api().course(cursos[i].id).then(function (c) {
            c.modules.forEach(function (m) { if (m.id === mid) { cm = m; cc = c; } });
            i++; if (!cm) next(); else listo();
          });
        })();
        function listo() {
          var cfg = cm.content || {};
          var hechos = attempts.filter(function (a) { return a.status !== 'open'; });
          var puede = hechos.length < (cfg.attempts_allowed || 1);
          var mejor = hechos.reduce(function (b, a) { return Math.max(b, a.score || 0); }, -1);
          var h = volver('#/curso/' + cc.id, esc(cc.short_name || cc.name)) + topbar(cm.title, 'Cuestionario · ' + esc(cc.name));
          h += '<div class="card" style="max-width:760px">';
          if (cfg.intro) h += '<p>' + esc(cfg.intro) + '</p>';
          h += '<div class="fila wrap" style="margin:12px 0">' +
            '<span class="pill azu">' + qs.length + ' preguntas</span>' +
            (cfg.time_limit_min ? '<span class="pill azu">' + ZI('clock') + ' ' + cfg.time_limit_min + ' min</span>' : '') +
            '<span class="pill vio">' + hechos.length + '/' + (cfg.attempts_allowed || 1) + ' intentos</span>' +
            (cfg.pass_grade ? '<span class="pill tur">Aprueba con ' + cfg.pass_grade + '</span>' : '') +
            (mejor >= 0 ? '<span class="pill ' + (mejor >= (cfg.pass_grade || 6) * (qs.reduce(function (s, q) { return s + q.points; }, 0) / 10) ? 'tur' : 'mal') + '">Mejor: ' + mejor + ' pts</span>' : '') + '</div>';
          if (hechos.length) {
            h += '<h3 style="font-size:14px;margin:10px 0 6px">Tus intentos</h3>' +
              hechos.map(function (a, ix) {
                return '<div class="fila entre" style="padding:8px 0;border-bottom:1px solid var(--linea)">' +
                  '<span>Intento ' + (hechos.length - ix) + ' · ' + Z.fmtFecha(a.finished_at, true) + '</span>' +
                  '<span class="fila"><b>' + (a.score == null ? '—' : a.score) + ' / ' + a.max_score + ' pts</b>' +
                  (a.needs_review ? '<span class="pill azu">en revisión</span>' : '') +
                  '<button class="btn sec sm" data-ver="' + a.id + '">Ver corrección</button></span></div>';
              }).join('');
          }
          h += '<div style="margin-top:14px">' +
            (puede && qs.length ? '<button class="btn" id="q_start" style="font-size:15px;padding:12px 26px">' + (hechos.length ? 'Nuevo intento' : 'Comenzar') + '</button>' :
              (qs.length ? '<div class="pill neg">Sin intentos disponibles</div>' : '<div class="pill gris">Sin preguntas todavía</div>')) + '</div></div>';
          h += '<div id="q_zone"></div>';
          var main = Z.shell(h, '#/mis-cursos');
          main.querySelectorAll('[data-ver]').forEach(function (b) {
            b.onclick = function () {
              var a = attempts.filter(function (x) { return x.id === b.getAttribute('data-ver'); })[0];
              verCorreccion(cc, cm, a);
            };
          });
          var st = main.querySelector('#q_start');
          if (st) st.onclick = function () { jugar(main, cm, qs); };
        }
      });
    });

    function jugar(main, m, qs) {
      var cfg = m.content || {};
      var lista = qs.slice();
      if (cfg.shuffle) lista.sort(function () { return Math.random() - 0.5; });
      var zona = main.querySelector('#q_zone');
      var h = '<div class="card" style="margin-top:16px"><div class="entre"><h2 style="font-size:16px">Respondé las ' + lista.length + ' preguntas</h2>' +
        (cfg.time_limit_min ? '<span class="timer" id="q_timer"></span>' : '') + '</div><form id="q_form" style="margin-top:14px">';
      h += lista.map(function (q, i) { return Z.quiz.renderQ(q, i); }).join('');
      h += '<button type="submit" class="btn" style="font-size:15px;padding:12px 26px;margin-top:6px">Entregar cuestionario</button></form></div>';
      zona.innerHTML = h;
      zona.scrollIntoView({ behavior: 'smooth' });
      if (cfg.time_limit_min) {
        var resta = cfg.time_limit_min * 60;
        var tEl = zona.querySelector('#q_timer');
        var iv = setInterval(function () {
          resta--;
          var mm = Math.floor(resta / 60), ss = resta % 60;
          tEl.textContent = mm + ':' + (ss < 10 ? '0' : '') + ss;
          if (resta <= 60) tEl.classList.add('urgente');
          if (resta <= 0) { clearInterval(iv); entregar(true); }
        }, 1000);
      }
      function entregar(auto) {
        var answers = Z.quiz.collect(zona, lista);
        api().submitAttempt(m.id, answers).then(function (a) {
          Z.toast(auto ? 'Tiempo agotado: se entregó solo' : '¡Entregado!', 'ok');
          tomarQuiz(m.id);
        });
      }
      zona.querySelector('#q_form').addEventListener('submit', function (e) {
        e.preventDefault();
        var sin = lista.filter(function (q) { return true; }).length - Object.keys(Z.quiz.collect(zona, lista)).length;
        if (sin > 0 && !window.confirm('Te quedan ' + sin + ' pregunta(s) sin responder. ¿Entregar igual?')) return;
        entregar(false);
      });
    }

    function verCorreccion(c, m, a) {
      api().questions(m.id, false).then(function (qs) {
        var h = volver('#/quiz/' + m.id, 'Cuestionario') + topbar(m.title, 'Tu corrección · ' + Z.fmtFecha(a.finished_at, true)) +
          '<div class="card" style="max-width:860px"><div class="entre"><h2 style="font-size:17px">Puntaje: ' + a.score + ' / ' + a.max_score + '</h2>' +
          (a.needs_review ? '<span class="pill azu">Preguntas abiertas en revisión</span>' : '<span class="pill tur">Corregido</span>') + '</div></div>' +
          '<div style="max-width:860px;margin-top:14px">' +
          qs.map(function (q) { return Z.quiz.renderReview(q, a.answers ? a.answers[q.id] : null); }).join('') + '</div>';
        Z.shell(h, '#/mis-cursos');
      });
    }
  }

  /* ================= CUESTIONARIO: EDITOR (docente) ================= */
  function editorQuiz(mid) {
    api().myCourses().then(function (cursos) {
      var cm = null, cc = null, i = 0;
      (function next() {
        if (i >= cursos.length) { Z.shell(topbar('No encontrado')); return; }
        api().course(cursos[i].id).then(function (c) {
          c.modules.forEach(function (m) { if (m.id === mid) { cm = m; cc = c; } });
          i++; if (!cm) next(); else listo();
        });
      })();
      function listo() {
        api().questions(mid, false).then(function (qs) {
          var h = volver('#/curso/' + cc.id, esc(cc.short_name || cc.name)) +
            topbar('Preguntas · ' + cm.title, esc(cc.name),
              '<button class="btn" id="eq_save">' + ZI('check') + ' Guardar todo</button>');
          h += '<div class="card"><div class="entre"><h2 style="font-size:15px">' + qs.length + ' preguntas</h2>' +
            '<button class="btn sec sm" id="eq_add">' + ZI('plus') + ' Agregar pregunta</button></div>' +
            '<div id="eq_list" style="margin-top:12px">' +
            qs.map(function (q) { return Z.quiz.editorQ(q); }).join('') + '</div></div>';
          var main = Z.shell(h, '#/mis-cursos');
          var lista = main.querySelector('#eq_list');

          function wireQ() {
            lista.querySelectorAll('.qedit').forEach(function (node) {
              node.querySelectorAll('.tipo-sel button').forEach(function (b) {
                b.onclick = function () {
                  var q = Z.quiz.collectQ(node, mid); q.type = b.getAttribute('data-tipo');
                  var tpl = { type: q.type, prompt: q.prompt, points: q.points, payload: {} };
                  if (q.type === 'mcq') tpl.payload = { choices: ['', ''], correct: [0] };
                  if (q.type === 'match') tpl.payload = { left: [], right: [] };
                  node.outerHTML = Z.quiz.editorQ({ id: q.id, type: tpl.type, prompt: tpl.prompt, points: tpl.points, payload: tpl.payload });
                  wireQ();
                };
              });
              var del = node.querySelector('[data-delq]');
              if (del) del.onclick = function () { node.remove(); };
              var addC = node.querySelector('[data-addchoice]');
              if (addC) addC.onclick = function () {
                var box = node.querySelector('[data-choices]');
                var n = box.querySelectorAll('.fila').length;
                var multi = node.querySelector('[data-multiple]') && node.querySelector('[data-multiple]').checked;
                var div = document.createElement('div');
                div.className = 'fila'; div.style.marginBottom = '6px';
                div.innerHTML = '<input type="' + (multi ? 'checkbox' : 'radio') + '" data-corr value="' + n + '" style="width:auto">' +
                  '<input type="text" data-choice placeholder="Opción ' + (n + 1) + '"><button type="button" class="iconbtn">' + ZI('x') + '</button>';
                div.querySelector('.iconbtn').onclick = function () { div.remove(); };
                box.appendChild(div);
              };
              var addP = node.querySelector('[data-addpair]');
              if (addP) addP.onclick = function () {
                var box = node.querySelector('[data-pairs]');
                var div = document.createElement('div');
                div.className = 'fila'; div.style.marginBottom = '6px';
                div.innerHTML = '<input type="text" data-pl placeholder="Concepto"><input type="text" data-pr placeholder="Coincide con…"><button type="button" class="iconbtn">' + ZI('x') + '</button>';
                div.querySelector('.iconbtn').onclick = function () { div.remove(); };
                box.appendChild(div);
              };
              node.querySelectorAll('[data-delchoice],[data-delpair]').forEach(function (x) {
                x.onclick = function () { x.closest('.fila').remove(); };
              });
            });
          }
          wireQ();
          main.querySelector('#eq_add').onclick = function () {
            lista.insertAdjacentHTML('beforeend', Z.quiz.editorQ(null));
            wireQ();
          };
          main.querySelector('#eq_save').onclick = function () {
            var nuevas = [];
            lista.querySelectorAll('.qedit').forEach(function (node) { nuevas.push(Z.quiz.collectQ(node, mid)); });
            var idsVivos = nuevas.map(function (q) { return q.id; }).filter(Boolean);
            var borrar = qs.filter(function (q) { return idsVivos.indexOf(q.id) < 0; });
            var ps = borrar.map(function (q) { return api().deleteQuestion(q.id); });
            nuevas.forEach(function (q, i) {
              q.position = i + 1;
              ps.push(api().saveQuestion(q));
            });
            Promise.all(ps).then(function () { Z.toast('Cuestionario guardado', 'ok'); editorQuiz(mid); });
          };
        });
      }
    });
  }

  /* ================= CUESTIONARIO: CORRECCIÓN (docente) ================= */
  function corregirQuiz(mid) {
    Promise.all([api().attemptsOf(mid), api().questions(mid, false)]).then(function (rs) {
      var atts = rs[0], qs = rs[1];
      api().myCourses().then(function (cursos) {
        var cm = null, cc = null, i = 0;
        (function next() {
          if (i >= cursos.length) { Z.shell(topbar('No encontrado')); return; }
          api().course(cursos[i].id).then(function (c) {
            c.modules.forEach(function (m) { if (m.id === mid) { cm = m; cc = c; } });
            i++; if (!cm) next(); else listo();
          });
        })();
        function listo() {
          var h = volver('#/curso/' + cc.id, esc(cc.short_name || cc.name)) +
            topbar('Intentos · ' + cm.title, esc(cc.name) + ' · ' + atts.length + ' intento(s)',
              '<a class="btn sec" href="#/editor-quiz/' + mid + '">' + ZI('edit') + ' Editar preguntas</a>');
          h += '<div class="card"><table class="tabla"><thead><tr><th>Estudiante</th><th>Fecha</th><th>Puntaje</th><th>Estado</th><th></th></tr></thead><tbody>' +
            (atts.length ? atts.map(function (a) {
              return '<tr><td><b>' + esc(a.student_name || a.student_id) + '</b></td><td>' + Z.fmtFecha(a.finished_at, true) + '</td>' +
                '<td><b>' + (a.score == null ? '—' : a.score) + ' / ' + a.max_score + '</b></td>' +
                '<td>' + (a.needs_review ? '<span class="pill azu">revisar abiertas</span>' : '<span class="pill tur">corregido</span>') + '</td>' +
                '<td><button class="btn sec sm" data-rev="' + a.id + '">Revisar</button></td></tr>';
            }).join('') : '<tr><td colspan="5" style="color:var(--neg-300)">Todavía no hay intentos.</td></tr>') +
            '</tbody></table></div><div id="revzone" style="margin-top:16px"></div>';
          var main = Z.shell(h, '#/mis-cursos');
          main.querySelectorAll('[data-rev]').forEach(function (b) {
            b.onclick = function () { revisar(b.getAttribute('data-rev')); };
          });
          function revisar(aid) {
            var a = atts.filter(function (x) { return x.id === aid; })[0];
            var zone = main.querySelector('#revzone');
            var h = '<div class="card"><h2 style="font-size:16px;margin-bottom:12px">Intento de ' + esc(a.student_name || '') + '</h2>';
            var essays = qs.filter(function (q) { return q.type === 'essay'; });
            h += qs.map(function (q) {
              var ans = a.answers ? a.answers[q.id] : null;
              if (q.type === 'essay') {
                return '<div class="preg"><div class="enun">' + esc(q.prompt) + '<span class="pts">' + q.points + ' pts</span></div>' +
                  '<div class="card" style="box-shadow:none;background:var(--azu-50)">' + esc(ans || '—') + '</div>' +
                  '<label>Puntaje (0 a ' + q.points + ')</label><input type="number" data-essay="' + q.id + '" min="0" max="' + q.points + '" step="0.5" style="width:110px"></div>';
              }
              return Z.quiz.renderReview(q, ans);
            }).join('');
            h += '<label>Devolución (opcional)</label><textarea id="rv_fb" style="min-height:60px">' + esc(a.feedback || '') + '</textarea>' +
              '<button class="btn" id="rv_ok" style="margin-top:12px">Guardar corrección</button></div>';
            zone.innerHTML = h;
            zone.scrollIntoView({ behavior: 'smooth' });
            zone.querySelector('#rv_ok').onclick = function () {
              var extra = 0;
              zone.querySelectorAll('[data-essay]').forEach(function (inp) { extra += Number(inp.value) || 0; });
              api().reviewAttempt(aid, extra, zone.querySelector('#rv_fb').value).then(function () {
                Z.toast('Corrección guardada', 'ok'); corregirQuiz(mid);
              });
            };
          }
        }
      });
    });
  }

  /* ================= ENTREGA (alumno) ================= */
  function entrega(mid) {
    var me = api().me();
    Promise.all([api().mySubmission(mid)]).then(function (rs) {
      var sub = rs[0];
      api().myCourses().then(function (cursos) {
        var cm = null, cc = null, i = 0;
        (function next() {
          if (i >= cursos.length) { Z.shell(topbar('No encontrado')); return; }
          api().course(cursos[i].id).then(function (c) {
            c.modules.forEach(function (m) { if (m.id === mid) { cm = m; cc = c; } });
            i++; if (!cm) next(); else listo();
          });
        })();
        function listo() {
          var cfg = cm.content || {};
          var vencida = cm.due_date && new Date(cm.due_date) < new Date();
          var h = volver('#/curso/' + cc.id, esc(cc.short_name || cc.name)) + topbar(cm.title, 'Tarea · ' + esc(cc.name));
          h += '<div class="card" style="max-width:760px"><p>' + (cfg.instructions || '') + '</p>' +
            '<div class="fila wrap" style="margin:10px 0">' +
            (cm.due_date ? '<span class="pill ' + (vencida ? 'mal' : 'azu') + '">' + ZI('clock') + ' ' + Z.fmtFecha(cm.due_date, true) + '</span>' : '') +
            '<span class="pill vio">Nota máx. ' + (cfg.max_grade || 10) + '</span>' +
            (sub && sub.grade != null ? pillNota(sub.grade) : '') + '</div>';
          if (sub && sub.grade != null) {
            h += '<div class="preg" style="background:var(--tur-50);border-color:var(--tur-300)"><b>Devolución:</b> ' + esc(sub.feedback || '—') + '</div>';
          }
          if (sub) {
            h += '<h3 style="font-size:14px;margin:12px 0 6px">Tu entrega · ' + Z.fmtFecha(sub.submitted_at, true) + '</h3>' +
              '<div class="card" style="box-shadow:none;background:var(--papel)">' + esc(sub.body || '') +
              (sub.file_url ? '<p style="margin-top:6px">' + ZI('file') + ' ' + esc(sub.file_url) + '</p>' : '') + '</div>';
          }
          var puede = !vencida || cfg.allow_late;
          h += '<h3 style="font-size:14px;margin:16px 0 6px">' + (sub ? 'Reenviar' : 'Entregar') + '</h3>';
          if (puede) {
            h += '<label>Texto de la entrega</label><textarea id="en_body">' + esc(sub ? sub.body || '' : '') + '</textarea>' +
              '<label>Adjunto (opcional)</label><input type="file" id="en_file">' +
              '<button class="btn" id="en_ok" style="margin-top:12px">' + ZI('send') + ' Enviar</button>';
          } else {
            h += '<div class="pill mal">Plazo vencido — no acepta entregas tardías</div>';
          }
          h += '</div>';
          var main = Z.shell(h, '#/mis-cursos');
          var b = main.querySelector('#en_ok');
          if (b) b.onclick = function () {
            var f = main.querySelector('#en_file').files[0];
            api().submitAssignment(mid, main.querySelector('#en_body').value, f ? f.name : null)
              .then(function () { Z.toast('Entrega enviada', 'ok'); entrega(mid); });
          };
        }
      });
    });
  }

  /* ================= CORREGIR ENTREGAS (docente) ================= */
  function corregirEntregas(mid) {
    Promise.all([api().submissionsOf(mid)]).then(function (rs) {
      var subs = rs[0];
      api().myCourses().then(function (cursos) {
        var cm = null, cc = null, i = 0;
        (function next() {
          if (i >= cursos.length) { Z.shell(topbar('No encontrado')); return; }
          api().course(cursos[i].id).then(function (c) {
            c.modules.forEach(function (m) { if (m.id === mid) { cm = m; cc = c; } });
            i++; if (!cm) next(); else listo();
          });
        })();
        function listo() {
          var sinNota = subs.filter(function (s) { return s.grade == null; }).length;
          var pendientes = cc.students.length - subs.length;
          var h = volver('#/curso/' + cc.id, esc(cc.short_name || cc.name)) +
            topbar('Entregas · ' + cm.title, esc(cc.name) + ' · nota máx. ' + ((cm.content || {}).max_grade || 10));
          h += '<div class="grid gr3" style="margin-bottom:14px">' +
            '<div class="kpi"><div class="n">' + subs.length + '</div><div class="t">Entregaron</div></div>' +
            '<div class="kpi azu"><div class="n">' + pendientes + '</div><div class="t">Sin entregar</div></div>' +
            '<div class="kpi neg"><div class="n">' + sinNota + '</div><div class="t">Por corregir</div></div></div>';
          h += '<div class="card"><table class="tabla"><thead><tr><th>Estudiante</th><th>Entregó</th><th>Respuesta</th><th class="num">Nota</th><th>Devolución</th><th></th></tr></thead><tbody>' +
            (subs.length ? subs.map(function (s) {
              return '<tr><td><b>' + esc(s.student_name || '') + '</b>' + (cm.due_date && s.submitted_at > cm.due_date ? ' <span class="pill mal" style="font-size:10px">tarde</span>' : '') + '</td>' +
                '<td>' + Z.fmtFecha(s.submitted_at, true) + '</td>' +
                '<td style="max-width:260px"><div style="max-height:60px;overflow:auto;font-size:12.5px">' + esc(s.body || '') + (s.file_url ? ' · ' + ZI('file') + ' ' + esc(s.file_url) : '') + '</div></td>' +
                '<td class="num"><input class="nota" type="number" min="0" max="' + ((cm.content || {}).max_grade || 10) + '" step="0.5" data-nota="' + s.id + '" value="' + (s.grade == null ? '' : s.grade) + '"></td>' +
                '<td><input type="text" data-fb="' + s.id + '" value="' + esc(s.feedback || '') + '" placeholder="Devolución…" style="min-width:150px"></td>' +
                '<td><button class="btn sec sm" data-g="' + s.id + '">Guardar</button></td></tr>';
            }).join('') : '<tr><td colspan="6" style="color:var(--neg-300)">Sin entregas todavía.</td></tr>') +
            '</tbody></table></div>';
          var main = Z.shell(h, '#/mis-cursos');
          main.querySelectorAll('[data-g]').forEach(function (b) {
            b.onclick = function () {
              var id2 = b.getAttribute('data-g');
              var n = main.querySelector('[data-nota="' + id2 + '"]').value;
              var fb = main.querySelector('[data-fb="' + id2 + '"]').value;
              if (n === '') return Z.toast('Poné la nota', 'mal');
              api().gradeSubmission(id2, Number(n), fb).then(function () { Z.toast('Nota guardada', 'ok'); corregirEntregas(mid); });
            };
          });
        }
      });
    });
  }

  /* ================= CALIFICACIONES (por curso) ================= */
  function notas(courseId) {
    Promise.all([api().course(courseId), api().gradebook(courseId)]).then(function (rs) {
      var c = rs[0], gb = rs[1];
      var me = api().me();
      var edita = esDocenteDe(c);
      var cols = gb.gradables.map(function (m) { return { key: 'm:' + m.id, label: m.title, tipo: m.type, max: (m.content && m.content.max_grade) || 10 }; });
      gb.manualLabels.forEach(function (l) { cols.push({ key: 'x:' + l, label: l, tipo: 'manual', max: 10 }); });
      var h = volver('#/curso/' + courseId, esc(c.short_name || c.name)) +
        topbar('Calificaciones · ' + esc(c.name), '', edita ? '<button class="btn sec" onclick="window.print()">' + ZI('print') + ' Imprimir</button>' : '');

      function celda(g) {
        return g ? g.grade : null;
      }
      function getNota(sid, col) {
        for (var i = 0; i < gb.rows.length; i++) {
          var g = gb.rows[i];
          if (g.student_id !== sid) continue;
          if (col.key.indexOf('m:') === 0 && g.module_id === col.key.slice(2)) return g;
          if (col.key.indexOf('x:') === 0 && !g.module_id && g.label === col.key.slice(2)) return g;
        }
        return null;
      }

      if (!edita) {
        var sid = me.id;
        h += '<div class="card"><table class="tabla"><thead><tr><th>Actividad</th><th class="num">Nota</th><th class="num">Sobre</th></tr></thead><tbody>' +
          cols.map(function (col) {
            var g = getNota(sid, col);
            return '<tr><td>' + esc(col.label) + ' <span class="pill gris" style="font-size:10px">' + esc(col.tipo) + '</span></td>' +
              '<td class="num">' + pillNota(g ? g.grade : null) + '</td><td class="num">' + col.max + '</td></tr>';
          }).join('') + '</tbody></table></div>';
        Z.shell(h, '#/mis-cursos');
        return;
      }

      h += '<div class="card"><div class="entre"><h2 style="font-size:15px">Planilla</h2>' +
        '<button class="btn sec sm" id="gb_addcol">' + ZI('plus') + ' Columna manual</button></div>' +
        '<div style="overflow-x:auto;margin-top:12px"><table class="tabla"><thead><tr><th>Estudiante</th>' +
        cols.map(function (col) { return '<th class="num" title="' + esc(col.label) + '">' + esc(col.label.length > 16 ? col.label.slice(0, 14) + '…' : col.label) + '<br><small style="font-weight:400;color:var(--neg-150)">/' + col.max + '</small></th>'; }).join('') +
        '<th class="num">Prom.</th></tr></thead><tbody>' +
        gb.students.map(function (s) {
          var suma = 0, n = 0;
          var tds = cols.map(function (col) {
            var g = getNota(s.id, col);
            var val = g ? g.grade : null;
            if (val != null) { suma += val; n++; }
            return '<td class="num"><input class="nota ' + notaCls(val) + '" data-cell="' + s.id + '|' + col.key + '|' + col.label + '|' + col.max + '" value="' + (val == null ? '' : val) + '"></td>';
          }).join('');
          var prom = n ? Math.round(suma / n * 10) / 10 : null;
          return '<tr><td><b>' + esc(s.full_name) + '</b></td>' + tds + '<td class="num"><b class="' + (prom == null ? '' : (prom >= 6 ? 'nota-big buen' : 'nota-big mala')) + '" style="font-size:15px">' + (prom == null ? '—' : prom) + '</b></td></tr>';
        }).join('') + '</tbody></table></div>' +
        '<p style="font-size:12px;color:var(--neg-300);margin-top:8px">Las notas se guardan al salir de cada casillero. En turquesa ≥ 6, en rojo &lt; 6.</p></div>';
      var main = Z.shell(h, '#/mis-cursos');

      main.querySelectorAll('[data-cell]').forEach(function (inp) {
        inp.addEventListener('change', function () {
          var p = inp.getAttribute('data-cell').split('|');
          var sid = p[0], key = p[1], label = p[2], max = Number(p[3]) || 10;
          var moduleId = key.indexOf('m:') === 0 ? key.slice(2) : null;
          var lbl = key.indexOf('x:') === 0 ? key.slice(2) : null;
          api().saveGrade(courseId, sid, moduleId, lbl, inp.value === '' ? null : Number(inp.value), max)
            .then(function () { inp.className = 'nota ' + notaCls(inp.value === '' ? null : Number(inp.value)); });
        });
      });
      main.querySelector('#gb_addcol').onclick = function () {
        var v = Z.modal('<h2>Columna manual</h2><label>Nombre de la actividad</label><input id="gc_l" placeholder="Ej.: Oral, Carpeta, Práctico">' +
          '<div class="fila" style="justify-content:flex-end;margin-top:16px"><button class="btn sec" data-x>Cancelar</button><button class="btn" data-ok>Agregar</button></div>');
        v.querySelector('[data-x]').onclick = function () { v.remove(); };
        v.querySelector('[data-ok]').onclick = function () {
          var l = v.querySelector('#gc_l').value.trim();
          if (!l) return;
          api().saveGrade(courseId, gb.students[0] ? gb.students[0].id : me.id, null, l, null, 10)
            .then(function () { v.remove(); notas(courseId); });
        };
      };
    });
  }

  /* ================= AGENDA ================= */
  function agenda() {
    api().myCourses().then(function (cursos) {
      var items = [];
      var ps = cursos.map(function (c) {
        return api().course(c.id).then(function (cc) {
          cc.modules.forEach(function (m) {
            if (m.due_date && m.visible) items.push({ curso: cc, mod: m });
          });
        });
      });
      Promise.all(ps).then(function () {
        items.sort(function (a, b) { return a.mod.due_date < b.mod.due_date ? -1 : 1; });
        var porDia = {};
        items.forEach(function (it) {
          var d = it.mod.due_date.slice(0, 10);
          (porDia[d] = porDia[d] || []).push(it);
        });
        var h = topbar('Agenda', 'Fechas de entrega de todos tus cursos');
        var dias = Object.keys(porDia).sort();
        h += dias.length ? dias.map(function (d) {
          var vencido = d < new Date().toISOString().slice(0, 10);
          return '<div class="dia' + (vencido ? ' vencido' : '') + '"><div class="fecha">' + Z.fmtFechaLarga(d + 'T12:00:00') + (vencido ? ' · pasada' : '') + '</div>' +
            porDia[d].map(function (it) {
              var me = api().me();
              var dest = it.mod.type === 'quiz' ? (me.role === 'estudiante' ? '#/quiz/' : '#/correccion-quiz/') + it.mod.id
                : it.mod.type === 'assignment' ? (me.role === 'estudiante' ? '#/entrega/' : '#/corregir-entregas/') + it.mod.id
                : '#/modulo/' + it.mod.id;
              return '<div class="item"><a href="' + dest + '">' + ZI(TICON[it.mod.type]) + ' <b>' + esc(it.mod.title) + '</b></a>' +
                ' <span class="pill" style="background:' + esc(it.curso.color || '#7C3AED') + '22;color:' + esc(it.curso.color || '#7C3AED') + '">' + esc(it.curso.short_name || it.curso.name) + '</span></div>';
            }).join('') + '</div>';
        }).join('') : '<div class="card vacio">' + ZI('cal') + '<p>No hay entregas con fecha.</p></div>';
        Z.shell(h, '#/agenda');
      });
    });
  }

  /* ================= COMUNICADOS ================= */
  function comunicados() {
    Promise.all([api().announcements(), api().myCourses()]).then(function (rs) {
      var anns = rs[0], cursos = rs[1];
      var me = api().me();
      var puedePost = me.role !== 'estudiante';
      var h = topbar('Comunicados', '', puedePost ? '<button class="btn" id="cm_new">' + ZI('plus') + ' Nuevo comunicado</button>' : '');
      h += '<div class="grid" style="grid-template-columns:1fr;max-width:860px">' +
        (anns.length ? anns.map(function (a) {
          return '<div class="card"><div class="fila"><span class="pill ' + (a.course_id ? 'vio' : 'neg') + '">' + esc(a.course_name) + '</span>' +
            '<span class="pill gris">' + esc(a.audience) + '</span>' +
            '<small style="margin-left:auto;color:var(--neg-300)">' + esc(a.author_name || '') + ' · ' + Z.fmtFecha(a.created_at, true) + '</small></div>' +
            '<h3 style="margin:8px 0 4px">' + esc(a.title) + '</h3><p style="margin:0">' + esc(a.body) + '</p></div>';
        }).join('') : '<div class="card vacio">' + ZI('mega') + '<p>Sin comunicados.</p></div>') + '</div>';
      var main = Z.shell(h, '#/comunicados');
      var nb = main.querySelector('#cm_new');
      if (nb) nb.onclick = function () {
        var v = Z.modal('<h2>Nuevo comunicado</h2>' +
          '<label>Destino</label><select id="cn_dest"><option value="">General (todo el colegio)</option>' +
          cursos.map(function (c) { return '<option value="' + c.id + '">' + esc(c.name) + '</option>'; }).join('') + '</select>' +
          '<label>Audiencia</label><select id="cn_aud"><option value="todos">Todos</option><option value="estudiantes">Estudiantes</option><option value="docentes">Docentes</option></select>' +
          '<label>Título</label><input id="cn_t"><label>Mensaje</label><textarea id="cn_b"></textarea>' +
          '<div class="fila" style="justify-content:flex-end;margin-top:14px"><button class="btn sec" data-x>Cancelar</button><button class="btn" data-ok>Publicar</button></div>');
        v.querySelector('[data-x]').onclick = function () { v.remove(); };
        v.querySelector('[data-ok]').onclick = function () {
          var t = v.querySelector('#cn_t').value.trim(), b = v.querySelector('#cn_b').value.trim();
          if (!t || !b) return Z.toast('Completá título y mensaje', 'mal');
          api().postAnnouncement({ course_id: v.querySelector('#cn_dest').value || null, audience: v.querySelector('#cn_aud').value, title: t, body: b })
            .then(function () { v.remove(); Z.toast('Publicado', 'ok'); comunicados(); });
        };
      };
    });
  }

  /* ================= MIS NOTAS (estudiante, todos los cursos) ================= */
  function misNotas() {
    api().myCourses().then(function (cursos) {
      var me = api().me();
      var ps = cursos.map(function (c) {
        return api().gradebook(c.id).then(function (gb) { return { c: c, gb: gb }; });
      });
      Promise.all(ps).then(function (datas) {
        var h = topbar('Mis notas', '');
        datas.forEach(function (d) {
          var cols = d.gb.gradables.map(function (m) { return { label: m.title, max: (m.content && m.content.max_grade) || 10, module_id: m.id }; });
          d.gb.manualLabels.forEach(function (l) { cols.push({ label: l, max: 10, module_id: null, manual: true }); });
          var filas = cols.map(function (col) {
            var g = null;
            d.gb.rows.forEach(function (r) {
              if (r.student_id !== me.id) return;
              if (col.module_id && r.module_id === col.module_id) g = r;
              if (col.manual && !r.module_id && r.label === col.label) g = r;
            });
            return { col: col, g: g };
          });
          var suma = 0, n = 0;
          filas.forEach(function (f) { if (f.g && f.g.grade != null) { suma += f.g.grade; n++; } });
          var prom = n ? Math.round(suma / n * 10) / 10 : null;
          h += '<div class="card"><div class="entre"><h2 style="font-size:16px"><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:' + esc(d.c.color || '#7C3AED') + ';margin-right:8px"></span>' + esc(d.c.name) + '</h2>' +
            '<div>Promedio <b class="' + (prom == null ? '' : (prom >= 6 ? 'nota-big buen' : 'nota-big mala')) + '">' + (prom == null ? '—' : prom) + '</b></div></div>' +
            '<table class="tabla" style="margin-top:10px"><thead><tr><th>Actividad</th><th class="num">Nota</th></tr></thead><tbody>' +
            (filas.length ? filas.map(function (f) {
              return '<tr><td>' + esc(f.col.label) + '</td><td class="num">' + pillNota(f.g ? f.g.grade : null) + '</td></tr>';
            }).join('') : '<tr><td colspan="2" style="color:var(--neg-300)">Sin calificaciones aún.</td></tr>') +
            '</tbody></table></div>';
        });
        Z.shell(h, '#/mis-notas');
      });
    });
  }

  /* ================= ADMIN: USUARIOS ================= */
  function adminUsuarios() {
    Promise.all([api().users()]).then(function (rs) {
      var us = rs[0];
      var h = topbar('Usuarios', us.length + ' personas',
        '<button class="btn" id="au_new">' + ZI('plus') + ' Nuevo usuario</button>');
      h += '<div class="card"><table class="tabla"><thead><tr><th>Nombre</th><th>Rol</th><th>Email</th></tr></thead><tbody>' +
        us.map(function (u) {
          return '<tr><td><b>' + esc(u.full_name) + '</b></td><td><span class="pill ' + (u.role === 'admin' ? 'neg' : u.role === 'docente' ? 'vio' : 'tur') + '">' + esc(u.role) + '</span></td><td>' + esc(u.email || '—') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
      var main = Z.shell(h, '#/admin/usuarios');
      main.querySelector('#au_new').onclick = function () {
        var v = Z.modal('<h2>Nuevo usuario</h2><label>Nombre y apellido</label><input id="nu_n">' +
          '<label>Rol</label><select id="nu_r"><option value="estudiante">estudiante</option><option value="docente">docente</option><option value="admin">admin</option></select>' +
          '<label>Email (para login real)</label><input id="nu_e" type="email">' +
          '<div class="fila" style="justify-content:flex-end;margin-top:14px"><button class="btn sec" data-x>Cancelar</button><button class="btn" data-ok>Crear</button></div>');
        v.querySelector('[data-x]').onclick = function () { v.remove(); };
        v.querySelector('[data-ok]').onclick = function () {
          var n = v.querySelector('#nu_n').value.trim();
          if (!n) return;
          api().addUser({ full_name: n, role: v.querySelector('#nu_r').value, email: v.querySelector('#nu_e').value.trim() || null })
            .then(function () { v.remove(); Z.toast('Usuario creado', 'ok'); adminUsuarios(); })
            .catch(function (e) { Z.toast(e.message, 'mal'); });
        };
      };
    });
  }

  /* ================= ADMIN: CURSOS / INSCRIPCIONES ================= */
  function adminCursos() {
    api().myCourses().then(function (cursos) {
      var h = topbar('Gestión de cursos', '', '<button class="btn" id="gc_new">' + ZI('plus') + ' Nuevo curso</button>');
      h += '<div class="card"><table class="tabla"><thead><tr><th>Curso</th><th>Docente</th><th>Alumnos</th><th></th></tr></thead><tbody>' +
        cursos.map(function (c) {
          return '<tr><td><b><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:' + esc(c.color || '#7C3AED') + ';margin-right:7px"></span>' + esc(c.name) + '</b></td>' +
            '<td>' + esc(c.teacher ? c.teacher.full_name : '—') + '</td>' +
            '<td>' + (c.students ? c.students.length : '—') + '</td>' +
            '<td class="fila"><a class="btn sec sm" href="#/curso/' + c.id + '">Abrir</a>' +
            '<button class="btn sec sm" data-ins="' + c.id + '">Inscripciones</button>' +
            '<button class="btn sec sm" data-dup="' + c.id + '" title="Duplicar curso">' + ZI('copy') + '</button></td></tr>';
        }).join('') + '</tbody></table></div>';
      var main = Z.shell(h, '#/admin/cursos');
      main.querySelector('#gc_new').onclick = function () { modalCurso(null, adminCursos); };
      main.querySelectorAll('[data-dup]').forEach(function (b) {
        b.onclick = function () {
          api().duplicateCourse(b.getAttribute('data-dup')).then(function () { Z.toast('Curso duplicado', 'ok'); adminCursos(); });
        };
      });
      main.querySelectorAll('[data-ins]').forEach(function (b) {
        b.onclick = function () { panelInscripciones(b.getAttribute('data-ins')); };
      });
      // necesitamos students por curso para la columna
      cursos.forEach(function (c) {
        api().course(c.id).then(function (cc) {
          var td = main.querySelector('[data-ins="' + c.id + '"]');
          if (td) td.closest('tr').children[2].textContent = cc.students.length;
        });
      });
    });
  }

  function panelInscripciones(courseId) {
    Promise.all([api().course(courseId), api().users('estudiante')]).then(function (rs) {
      var c = rs[0], todos = rs[1];
      var inscriptos = c.students.map(function (s) { return s.id; });
      var v = Z.modal('<h2>Inscripciones · ' + esc(c.name) + '</h2>' +
        '<div style="max-height:380px;overflow-y:auto">' + todos.map(function (s) {
          var en = inscriptos.indexOf(s.id) >= 0;
          return '<div class="fila entre" style="padding:8px 0;border-bottom:1px solid var(--linea)"><span>' + esc(s.full_name) + '</span>' +
            '<button class="btn ' + (en ? 'pel' : 'tur') + ' sm" data-t="' + s.id + '|' + (en ? '0' : '1') + '">' + (en ? 'Quitar' : 'Inscribir') + '</button></div>';
        }).join('') + '</div><div class="fila" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-x>Listo</button></div>', false);
      v.querySelectorAll('[data-t]').forEach(function (b) {
        b.onclick = function () {
          var p = b.getAttribute('data-t').split('|');
          var fn = p[1] === '1' ? api().enroll : api().unenroll;
          fn(courseId, p[0]).then(function () { v.remove(); panelInscripciones(courseId); });
        };
      });
      v.querySelector('[data-x]').onclick = function () { v.remove(); adminCursos(); };
    });
  }

  /* ---------- modal nuevo curso ---------- */
  function modalCurso(c, done) {
    api().users('docente').then(function (docs) {
      var v = Z.modal('<h2>' + (c ? 'Editar curso' : 'Nuevo curso') + '</h2>' +
        '<label>Nombre</label><input id="nc_n" value="' + esc(c ? c.name : '') + '" placeholder="Ej.: Física · 4° 2°">' +
        '<div class="fila"><div style="flex:1"><label>Sigla</label><input id="nc_s" value="' + esc(c ? c.short_name || '' : '') + '" placeholder="FIS 4-2"></div>' +
        '<div style="width:110px"><label>Color</label><input type="color" id="nc_c" value="' + (c ? c.color || '#7C3AED' : '#7C3AED') + '" style="padding:3px;height:40px"></div></div>' +
        '<label>Descripción</label><input id="nc_d" value="' + esc(c ? c.description || '' : '') + '">' +
        '<label>Docente a cargo</label><select id="nc_t">' + docs.map(function (d) {
          return '<option value="' + d.id + '"' + (c && c.teacher_id === d.id ? ' selected' : '') + '>' + esc(d.full_name) + '</option>';
        }).join('') + '</select>' +
        '<label>Ciclo lectivo</label><input id="nc_y" value="' + esc(c ? c.school_year || '2026' : '2026') + '">' +
        '<div class="fila" style="justify-content:flex-end;margin-top:14px"><button class="btn sec" data-x>Cancelar</button><button class="btn" data-ok>Guardar</button></div>');
      v.querySelector('[data-x]').onclick = function () { v.remove(); };
      v.querySelector('[data-ok]').onclick = function () {
        var n = v.querySelector('#nc_n').value.trim();
        if (!n) return Z.toast('Poné un nombre', 'mal');
        api().saveCourse({ id: c ? c.id : null, name: n, short_name: v.querySelector('#nc_s').value.trim(),
          color: v.querySelector('#nc_c').value, description: v.querySelector('#nc_d').value.trim(),
          teacher_id: v.querySelector('#nc_t').value, school_year: v.querySelector('#nc_y').value.trim() })
          .then(function () { v.remove(); Z.toast('Curso guardado', 'ok'); (done || home)(); });
      };
    });
  }

  Z.views = {
    home: home, misCursos: misCursos, curso: curso, modulo: modulo,
    tomarQuiz: tomarQuiz, editorQuiz: editorQuiz, corregirQuiz: corregirQuiz,
    entrega: entrega, corregirEntregas: corregirEntregas, notas: notas,
    agenda: agenda, comunicados: comunicados, misNotas: misNotas,
    adminUsuarios: adminUsuarios, adminCursos: adminCursos
  };
})();

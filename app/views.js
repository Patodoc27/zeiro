/* ZEIRO · Vistas (todas las pantallas por rol). */
(function () {
  var Z = window.Z = window.Z || {};
  var api = function () { return Z.api; };
  var esc = function (s) { return Z.esc(s); };
  var TICON = { page: 'page', libro: 'book', file: 'file', link: 'link', quiz: 'quiz', assignment: 'task', announcement: 'mega', forum: 'forum', html: 'code', poll: 'sparkle' };
  var TNOMBRE = { page: 'Página', libro: 'Libro', file: 'Archivo', link: 'Enlace', quiz: 'Cuestionario', assignment: 'Tarea', announcement: 'Comunicado del curso', forum: 'Foro', html: 'Bloque HTML', poll: 'Encuesta' };
  var TIPO_ES = { page: 'página', libro: 'libro', file: 'archivo', link: 'enlace', quiz: 'cuestionario', assignment: 'tarea', announcement: 'comunicado', forum: 'foro', html: 'html', manual: 'manual', poll: 'encuesta' };

  /* render seguro de HTML incrustado (iframe aislado); si es una URL, reproductor de video */
  function bloqueEmbed(code) {
    if (!code || !code.trim()) return '';
    var t = code.trim();
    if (t.indexOf('<') === 0) return '<iframe class="embed" sandbox="allow-scripts allow-popups" srcdoc="' + esc(t) + '"></iframe>';
    if (/^https?:\/\//i.test(t)) return '<video class="embed vid" controls src="' + esc(t) + '"></video>';
    return '';
  }

  /* ventana de disponibilidad del módulo */
  function ventanaMod(m) {
    var now = new Date();
    if (m.available_from && new Date(m.available_from) > now) return 'futuro';
    if (m.available_until && new Date(m.available_until) < now) return 'vencido';
    return 'ok';
  }

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
      var nombre = esc(me.full_name.indexOf(',') >= 0 ? me.full_name.split(',')[1].trim().split(' ')[0] : me.full_name.split(' ')[0]);
      var h = '<div class="hero">' +
        '<div class="htxt"><div class="hizq"><h1>¡Hola, ' + nombre + '!</h1>' +
        '<p>' + new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }) + '</p>' +
        '<div class="hchips">' +
        '<span class="hchip">' + ZI('book') + ' ' + cursos.length + ' curso' + (cursos.length === 1 ? '' : 's') + '</span>' +
        '<span class="hchip" id="k_entregas_wrap">' + ZI('clock') + ' <b id="k_entregas">…</b> ' + (me.role === 'estudiante' ? 'entregas próximas' : 'evaluaciones activas') + '</span>' +
        '<span class="hchip">' + ZI('mega') + ' ' + anns.length + ' comunicados</span>' +
        '<span class="hchip" id="k_alumnos_wrap">' + ZI('sparkle') + ' <b id="k_alumnos">…</b> ' + (me.role === 'estudiante' ? 'materiales nuevos' : 'estudiantes') + '</span>' +
        '</div></div>' + Z_ZEBRA('saludo') + '</div></div>';
      h += '<div class="grid" style="grid-template-columns:2fr 1fr">';
      h += '<div class="card"><div class="entre"><h2 style="font-size:17px">' + (me.role === 'estudiante' ? 'Mis cursos' : 'Cursos') + '</h2>' +
        (me.role === 'admin' ? '<button class="btn sm" id="h_ncurso">' + ZI('plus') + ' Nuevo curso</button>' : '') + '</div><div id="h_cursos" style="margin-top:14px"></div></div>';
      h += '<div class="card"><h2 style="font-size:17px;margin-bottom:12px">Novedades</h2><div id="h_anns"></div></div>';
      h += '</div>';
      var main = Z.shell(h, '#/home');

      var lista = main.querySelector('#h_cursos');
      lista.innerHTML = cursos.length ? cursos.map(function (c) {
        return '<a class="ctile" href="#/curso/' + c.id + '">' +
          '<div class="banda pat-' + esc(c.pattern || 'liso') + '" style="background:' + esc(c.color || '#7C3AED') + '"><span class="sigla">' + esc((c.sigla || c.short_name || c.name).slice(0, 4).toUpperCase()) + '</span>' + ZI('chev') + '</div>' +
          '<div class="cuerpo"><h3>' + esc(c.name) + '</h3><p>' + esc(c.description || '') + '</p>' +
          '<div class="meta"><span class="pill gris">' + esc(c.school_year || '') + '</span></div>' +
          (me.role === 'estudiante' ? '<div class="prog" data-prog="' + c.id + '"><i></i></div>' : '') + '</div></a>';
      }).join('') : '<div class="vacio">' + Z_ZEBRA('pensar') + '<p>Todavía no hay cursos asignados.</p></div>';

      var aa = main.querySelector('#h_anns');
      aa.innerHTML = anns.length ? anns.slice(0, 6).map(function (a) {
        return '<div style="padding:10px 0;border-bottom:1px solid var(--linea)">' +
          '<div class="fila"><span class="pill ' + (a.course_id ? 'vio' : 'neg') + '" style="font-size:10.5px">' + esc(a.course_name) + '</span>' +
          '<small style="color:var(--neg-300);margin-left:auto">' + Z.fmtFecha(a.created_at) + '</small></div>' +
          '<b style="display:block;margin-top:5px">' + esc(a.title) + '</b>' +
          '<div style="font-size:13px;color:var(--neg-500)">' + esc(a.body).slice(0, 110) + (a.body.length > 110 ? '…' : '') + '</div></div>';
      }).join('') : '<div class="vacio">' + ZI('mega') + '<p>Sin comunicados.</p></div>';

      // KPIs por curso + progreso del estudiante
      var entregas = 0, alumnos = new Set(), nuevos = 0;
      Promise.all([api().myViews ? api().myViews() : Promise.resolve([])].concat(cursos.map(function (c) {
        return api().course(c.id);
      }))).then(function (rs) {
        var vistos = rs[0] || [];
        rs.slice(1).forEach(function (cc, ix) {
          cc.modules.forEach(function (m) {
            if ((m.type === 'quiz' || m.type === 'assignment') && m.visible && ventanaMod(m) === 'ok') {
              if (m.due_date && new Date(m.due_date) >= new Date()) entregas++;
            }
            if (m.visible && ventanaMod(m) === 'ok' && me.role === 'estudiante' && vistos.indexOf(m.id) < 0 && m.type !== 'quiz' && m.type !== 'assignment') nuevos++;
          });
          cc.students.forEach(function (s) { alumnos.add(s.id); });
          if (me.role === 'estudiante') {
            var ver = cc.modules.filter(function (m) { return m.visible && ventanaMod(m) === 'ok'; });
            var hechos = ver.filter(function (m) { return vistos.indexOf(m.id) >= 0; }).length;
            var bar = main.querySelector('[data-prog="' + cc.id + '"] i');
            if (bar && ver.length) bar.style.width = Math.round(hechos / ver.length * 100) + '%';
          }
        });
        var k1 = main.querySelector('#k_entregas'), k2 = main.querySelector('#k_alumnos');
        if (k1) k1.textContent = entregas;
        if (k2) k2.textContent = me.role === 'estudiante' ? nuevos : alumnos.size;
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
        me.role === 'admin' ? '<button class="btn" id="mc_new">' + ZI('plus') + ' Nuevo curso</button>'
          : (me.role === 'estudiante' ? '<button class="btn sec" id="mc_join">' + ZI('plus') + ' Unirme con código</button>' : ''));
      h += '<div id="mc_lista" class="grid gr2"></div>';
      var main = Z.shell(h, '#/mis-cursos');
      var el = main.querySelector('#mc_lista');
      el.innerHTML = cursos.length ? cursos.map(function (c) {
        return '<a class="ctile" href="#/curso/' + c.id + '">' +
          '<div class="banda pat-' + esc(c.pattern || 'liso') + '" style="background:' + esc(c.color || '#7C3AED') + '"><span class="sigla">' + esc((c.sigla || c.short_name || c.name).slice(0, 4).toUpperCase()) + '</span>' + ZI('chev') + '</div>' +
          '<div class="cuerpo"><h3>' + esc(c.name) + '</h3><p>' + esc(c.description || '') + '</p>' +
          '<div class="meta"><span class="pill gris">' + esc(c.school_year || '') + '</span></div></div></a>';
      }).join('') : '<div class="vacio">' + ZI('book') + '<p>Sin cursos.</p></div>';
      var nb = main.querySelector('#mc_new');
      if (nb) nb.onclick = function () { modalCurso(null); };
      var jb = main.querySelector('#mc_join');
      if (jb) jb.onclick = function () {
        var v = Z.modal('<h2>Unirme a un curso</h2><p style="color:var(--neg-500);font-size:14px">Tu docente te da el código del aula (ej.: BIO-2026).</p>' +
          '<label>Código del curso</label><input id="jc_code" placeholder="ABC-1234" style="text-transform:uppercase">' +
          '<div class="fila" style="justify-content:flex-end;margin-top:14px"><button class="btn sec" data-x>Cancelar</button><button class="btn" data-ok>Unirme</button></div>');
        v.querySelector('[data-x]').onclick = function () { v.remove(); };
        v.querySelector('[data-ok]').onclick = function () {
          api().joinByCode(v.querySelector('#jc_code').value).then(function (r) {
            if (r.error) { Z.toast(r.error, 'mal'); if (r.course) { v.remove(); location.hash = '#/curso/' + r.course.id; } return; }
            v.remove(); Z.toast('¡Te uniste a ' + r.course.name + '!', 'ok'); misCursos();
          });
        };
      };
    });
  }

  /* ================= CURSO ================= */
  function curso(id) {
    api().course(id).then(function (c) {
      if (!c) { Z.shell(topbar('Curso no encontrado'), '#/mis-cursos'); return; }
      var me = api().me();
      var edita = esDocenteDe(c);
      var color = c.color || '#7C3AED';
      var heroStyle = 'background:' + esc(color);
      if (c.banner_url) heroStyle = 'background:linear-gradient(90deg,' + esc(color) + 'D9 22%,' + esc(color) + '1A),url(' + esc(c.banner_url) + ') center/cover';
      var h = volver('#/mis-cursos') +
        '<div class="aula-hero" style="' + heroStyle + '"><div class="pat pat-' + esc(c.pattern || 'liso') + '"></div>' +
        '<div class="ah-txt"><span class="sigla">' + esc(c.sigla || (c.short_name || c.name).slice(0, 4).toUpperCase()) + '</span>' +
        '<h1>' + esc(c.name) + '</h1><p>' + (c.teacher ? 'Prof. ' + esc(c.teacher.full_name) + ' · ' : '') + esc(c.description || '') + '</p>' +
        (c.welcome ? '<div class="ah-wel">' + esc(c.welcome) + '</div>' : '') + '</div>' +
        (c.teacher ? '<div class="ah-doc"><span class="foto">' + esc((c.teacher.full_name || '?').charAt(0).toUpperCase()) + '</span>' +
          '<div><b>' + esc(c.teacher.full_name) + '</b><small>Docente del aula</small></div></div>' : '') +
        '<div class="ah-acts">' +
          (edita
            ? '<button class="btn blanco sm" id="c_aula">' + ZI('sparkle') + ' Diseñar aula</button>' +
              '<a class="btn blanco sm" href="#/curso/' + id + '/notas">' + ZI('star') + ' Calificaciones</a>' +
              '<a class="btn blanco sm" href="#/curso/' + id + '/asistencia">' + ZI('asist') + ' Asistencia</a>' +
              '<a class="btn blanco sm" href="#/progreso/' + id + '">' + ZI('cap') + ' Progreso</a>' +
              '<a class="btn blanco sm" href="#/flashcards/' + id + '">' + ZI('book') + ' Flashcards</a>' +
              '<button class="btn sm" id="c_addsec">' + ZI('plus') + ' Sección</button>' +
              (c.enroll_code ? '<span class="pill" style="background:rgba(255,255,255,.22);color:#fff">Código: ' + esc(c.enroll_code) + '</span>' : '')
            : (me.role === 'estudiante' ? '<a class="btn blanco sm" href="#/curso/' + id + '/asistencia">' + ZI('asist') + ' Mi asistencia</a>' +
              '<a class="btn blanco sm" href="#/flashcards/' + id + '">' + ZI('book') + ' Flashcards</a>' +
              '<a class="btn sm" href="#/curso/' + id + '/notas">' + ZI('star') + ' Mis notas</a>' : '')) +
        '</div></div>';
      h += '<div id="c_secs"></div>';
      var main = Z.shell(h, '#/mis-cursos');
      var wrap = main.querySelector('#c_secs');

      function pintar() {
        api().course(id).then(function (cc) { c = cc; dibujar(); });
      }
      var solapaActiva = null;
      function dibujar() {
        var secs = c.sections.slice().sort(function (a, b) { return a.position - b.position; });
        var htmlSeccion = function (s) {
          var mods = c.modules.filter(function (m) { return m.section_id === s.id && (edita || (m.visible && ventanaMod(m) !== 'futuro')); })
            .sort(function (a, b) { return a.position - b.position; });
          var hstyle = (s.color ? 'border-left:5px solid ' + esc(s.color) + ';' : '') +
            (s.img ? "background-image:linear-gradient(90deg,rgba(255,255,255,.92) 30%,rgba(255,255,255,.45)),url('" + esc(s.img) + "');background-size:cover;background-position:center;" : '');
          return '<div class="seccion"' + (s.color ? ' style="border-top:3px solid ' + esc(s.color) + '"' : '') + '><header' + (hstyle ? ' style="' + hstyle + '"' : '') + '><h3>' + esc(s.title) + '</h3>' +
            '<span class="pill gris">' + mods.length + ' ítem' + (mods.length === 1 ? '' : 's') + '</span>' +
            (edita ? '<button class="iconbtn" data-editsec="' + s.id + '" title="Diseñar unidad">' + ZI('edit') + '</button>' +
              '<button class="iconbtn" data-delsec="' + s.id + '" title="Borrar sección">' + ZI('trash') + '</button>' : '') +
            '</header><div class="cuerpo">' +
            mods.map(function (m) { return filaModulo(m, edita); }).join('') +
            (edita ? '<div class="fila wrap" style="margin-top:10px;gap:6px">' +
              Object.keys(TNOMBRE).map(function (t) {
                return '<button class="btn sec sm" data-addmod="' + s.id + '|' + t + '">' + ZI(TICON[t]) + ' ' + TNOMBRE[t] + '</button>';
              }).join('') + '</div>' : '') +
            '</div></div>';
        };
        if (c.layout === 'solapas' && secs.length) {
          if (!solapaActiva || !secs.some(function (x) { return x.id === solapaActiva; })) solapaActiva = secs[0].id;
          wrap.innerHTML = '<div class="solapas">' + secs.map(function (s) {
            return '<button class="solapa' + (s.id === solapaActiva ? ' on' : '') + '" data-solapa="' + s.id + '"' +
              (s.color ? ' style="--sol:' + esc(s.color) + '"' : '') + '>' + esc(s.title) + '</button>';
          }).join('') + '</div>' +
            secs.filter(function (s) { return s.id === solapaActiva; }).map(htmlSeccion).join('');
        } else {
          wrap.innerHTML = secs.map(htmlSeccion).join('') || '<div class="card vacio">' + ZI('book') + '<p>Curso vacío.' + (edita ? ' Agregá la primera sección.' : '') + '</p></div>';
        }

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
        var etiq = (m.content && m.content.etiqueta) ? '<span class="etiq" style="background:' + esc(m.content.etiqueta_color || '#7C3AED') + '">' + esc(m.content.etiqueta) + '</span> ' : '';
        var vent = ventanaMod(m);
        if (vent === 'futuro') extra += '<span class="pill neg chip-estado">' + ZI('lock') + ' desde ' + Z.fmtFecha(m.available_from) + '</span> ';
        if (vent === 'vencido') extra += '<span class="pill gris chip-estado">cerrado ' + Z.fmtFecha(m.available_until) + '</span> ';
        var inner = '<div class="info"><b>' + esc(m.title) + '</b> ' + etiq + '<p>' + extra + descripcionModulo(m) + '</p></div>';
        var acts = '';
        if (edita) {
          acts = '<div class="acts">' +
            (m.type === 'quiz' ? '<a class="iconbtn" href="#/prev-quiz/' + m.id + '" title="Previsualizar">' + ZI('eye') + '</a>' : '') +
            '<button class="iconbtn" data-move="' + m.id + '|-1" title="Subir">' + ZI('up') + '</button>' +
            '<button class="iconbtn" data-move="' + m.id + '|1" title="Bajar">' + ZI('down') + '</button>' +
            '<button class="iconbtn" data-editmod="' + m.id + '" title="Editar">' + ZI('edit') + '</button>' +
            '<button class="iconbtn" data-vismod="' + m.id + '" title="Mostrar/ocultar">' + ZI(m.visible ? 'eye' : 'eyeoff') + '</button>' +
            '<button class="iconbtn" data-delmod="' + m.id + '" title="Borrar">' + ZI('trash') + '</button></div>';
          return '<div class="mod' + (m.visible ? '' : ' oculto') + '"><a href="' + href + '" style="color:var(--vio-500)">' + ZI(TICON[m.type]) + '</a>' +
            '<a href="' + href + '" style="text-decoration:none;color:inherit;flex:1;min-width:0">' + inner + '</a>' + acts + '</div>';
        }
        var bloq = vent === 'vencido' && (m.type === 'quiz' || m.type === 'assignment');
        var tag = bloq ? '<span class="mod inactivo">' : '<a class="mod" href="' + href + '" style="text-decoration:none;color:inherit">';
        if (me2.role === 'estudiante' && m.type === 'assignment' && !bloq) {
          acts = '<div class="acts"><span class="btn sm">Entregar</span></div>';
        } else if (me2.role === 'estudiante' && m.type === 'quiz' && !bloq) {
          acts = '<div class="acts"><span class="btn sm">Rendir</span></div>';
        } else if (bloq) {
          acts = '<div class="acts"><span class="pill gris">' + ZI('lock') + ' cerrado</span></div>';
        }
        return tag + '<span style="color:var(--vio-500);display:flex">' + ZI(TICON[m.type]) + '</span>' + inner + acts + (bloq ? '</span>' : '</a>');
      }
      function destinoModulo(m) {
        var me2 = api().me();
        if (m.type === 'forum') return '#/foro/' + m.id;
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
        if (m.type === 'page') return esc((c.body || '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/<[^>]+>|\*+|#{1,3}\s|>\s?/g, '').replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, 90)) + '…';
        if (m.type === 'quiz') return 'Cuestionario' + (c.pass_grade ? ' · aprueba con ' + c.pass_grade : '');
        if (m.type === 'assignment') return 'Tarea' + (c.max_grade ? ' · nota máx. ' + c.max_grade : '');
        if (m.type === 'announcement') return esc((c.body || '').slice(0, 90));
        if (m.type === 'forum') return esc((c.description || c.topic || 'Espacio de debate').slice(0, 90));
        if (m.type === 'html') return 'Contenido incrustado' + (c.video_url ? ' · video' : '');
        if (m.type === 'libro') return 'Libro · ' + Math.max((c.capitulos || []).length, 1) + ' capítulo' + ((c.capitulos || []).length === 1 ? '' : 's');
        if (m.type === 'poll') return 'Encuesta' + (c.pregunta ? ' · ' + esc(c.pregunta.slice(0, 60)) : '');
        return '';
      }

      function wire() {
        wrap.querySelectorAll('[data-solapa]').forEach(function (b) {
          b.onclick = function () { solapaActiva = b.getAttribute('data-solapa'); dibujar(); };
        });
        wrap.querySelectorAll('[data-addsec], #c_addsec').forEach(function (b) {
          b.onclick = function () { modalSeccion(null); };
        });
        var addSec = main.querySelector('#c_addsec');
        if (addSec) addSec.onclick = function () { modalSeccion(null); };
        var ba = main.querySelector('#c_aula');
        if (ba) ba.onclick = function () { modalAula(c); };
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
        var v = Z.modal('<h2>' + (s ? 'Diseñar unidad' : 'Nueva unidad') + '</h2>' +
          '<label>Título</label><input id="ms_t" value="' + esc(s ? s.title : '') + '" placeholder="Ej.: Unidad 3 · Ecología">' +
          '<div class="fila"><div style="width:130px"><label>Color de la unidad</label>' +
          '<input type="color" id="ms_c" value="' + esc(s && s.color ? s.color : '#7C3AED') + '" style="padding:3px;height:40px"></div>' +
          '<div style="flex:1"><label>Imagen de fondo (opcional)</label><input type="file" id="ms_img" accept="image/*">' +
          (s && s.img ? '<label style="margin-top:6px"><input type="checkbox" id="ms_noimg" style="width:auto"> quitar imagen actual</label>' : '') +
          '<p style="font-size:12px;color:var(--neg-300);margin:4px 0 0">Se ve detrás del título de la unidad.</p></div></div>' +
          '<div class="fila" style="justify-content:flex-end;margin-top:16px"><button class="btn sec" data-x>Cancelar</button>' +
          '<button class="btn" data-ok>Guardar</button></div>');
        var img = s ? s.img : null;
        var fi = v.querySelector('#ms_img');
        fi.onchange = function () {
          var f = fi.files[0];
          if (!f) return;
          if (f.size > 1500000) { Z.toast('La imagen pesa demasiado (máx. 1.5 MB)', 'mal'); fi.value = ''; return; }
          var r = new FileReader();
          r.onload = function () { img = r.result; Z.toast('Imagen lista', 'ok'); };
          r.readAsDataURL(f);
        };
        v.querySelector('[data-x]').onclick = function () { v.remove(); };
        v.querySelector('[data-ok]').onclick = function () {
          var t = v.querySelector('#ms_t').value.trim();
          if (!t) return Z.toast('Poné un título', 'mal');
          var qi = v.querySelector('#ms_noimg');
          api().saveSection(id, { id: s ? s.id : null, title: t, color: v.querySelector('#ms_c').value,
            img: (qi && qi.checked) ? null : img }).then(function () { v.remove(); pintar(); });
        };
      }
      dibujar();
    });
  }

  /* ---------- editor de módulo (una sola pantalla, no 8 como Moodle) ---------- */
  function modalModulo(courseId, sectionId, tipo, m, done) {
    var c = (m && m.content) || {};
    var cuerpo = '';
    if (tipo === 'page') cuerpo = '<label>Contenido (HTML simple permitido)</label>' + Z.voz.wrap('<textarea id="mm_body" style="min-height:160px">' + esc(c.body || '') + '</textarea>');
    else if (tipo === 'link') cuerpo = '<label>URL</label><input id="mm_url" value="' + esc(c.url || '') + '" placeholder="https://…">';
    else if (tipo === 'file') cuerpo = '<label>Archivo (PDF, Word, video… cualquier formato)</label><input type="file" id="mm_file">' + (c.file_name ? '<p style="font-size:12px;color:var(--neg-300)">Actual: ' + esc(c.file_name) + '</p>' : '') +
      '<p style="font-size:12px;color:var(--neg-300)">En demo se guarda el contenido hasta 4 MB; con Supabase se sube a Storage.</p>';
    else if (tipo === 'assignment') cuerpo =
      '<label>Consigna</label>' + Z.voz.wrap('<textarea id="mm_ins">' + esc(c.instructions || '') + '</textarea>') +
      '<div class="fila"><div style="width:130px"><label>Nota máx.</label><input type="number" id="mm_max" value="' + (c.max_grade || 10) + '"></div>' +
      '<div style="flex:1"><label>Fecha de entrega</label><input type="datetime-local" id="mm_due" value="' + (m && m.due_date ? m.due_date.slice(0, 16) : '') + '"></div></div>' +
      '<label style="margin-top:8px"><input type="checkbox" id="mm_late" ' + (c.allow_late ? 'checked' : '') + ' style="width:auto"> aceptar entregas fuera de término</label>';
    else if (tipo === 'quiz') cuerpo =
      '<label>Introducción para el estudiante</label>' + Z.voz.wrap('<textarea id="mm_intro" style="min-height:60px">' + esc(c.intro || '') + '</textarea>') +
      '<div class="grid gr4">' +
      '<div><label>Minutos</label><input type="number" id="mm_time" value="' + (c.time_limit_min || '') + '" placeholder="0 = sin límite"></div>' +
      '<div><label>Intentos</label><input type="number" id="mm_att" value="' + (c.attempts_allowed || 1) + '" min="1"></div>' +
      '<div><label>Nota máx.</label><input type="number" id="mm_max" value="' + (c.max_grade || 10) + '"></div>' +
      '<div><label>Aprueba con</label><input type="number" id="mm_pass" value="' + (c.pass_grade || 6) + '"></div></div>' +
      '<label style="margin-top:8px"><input type="checkbox" id="mm_shuf" ' + (c.shuffle ? 'checked' : '') + ' style="width:auto"> mezclar preguntas por estudiante</label>' +
      '<p style="font-size:12.5px;color:var(--neg-300);margin-top:8px">Las preguntas se editan aparte desde el ítem del curso → botón de edición → "Editar preguntas".</p>';
    else if (tipo === 'announcement') cuerpo = '<label>Mensaje</label>' + Z.voz.wrap('<textarea id="mm_body">' + esc(c.body || '') + '</textarea>');
    else if (tipo === 'forum') cuerpo = '<label>Consigna del foro (qué se debate)</label>' + Z.voz.wrap('<textarea id="mm_desc" style="min-height:90px">' + esc(c.description || '') + '</textarea>');
    else if (tipo === 'poll') cuerpo =
      '<label>Pregunta de la encuesta</label><input id="mm_preg" value="' + esc(c.pregunta || '') + '" placeholder="Ej.: ¿Qué tema repasamos antes del examen?">' +
      '<label style="margin-top:6px">Opciones (una por línea)</label>' + Z.voz.wrap('<textarea id="mm_ops" style="min-height:90px" placeholder="Opción A&#10;Opción B&#10;Opción C">' + esc((c.opciones || []).join('\n')) + '</textarea>') +
      '<p style="font-size:12px;color:var(--neg-300);margin-top:6px">Los estudiantes votan una vez y ven los resultados en barras en vivo.</p>';
    else if (tipo === 'libro') cuerpo =
      '<label>Capítulos del libro</label><div id="mm_caps"></div>' +
      '<button type="button" class="btn sec sm" id="mm_cap_add" style="margin-top:4px">' + ZI('plus') + ' Agregar capítulo</button>' +
      '<p style="font-size:12px;color:var(--neg-300);margin-top:6px">Cada capítulo admite la barra de formato: títulos, imágenes, tablas, citas. El estudiante lo lee con índice lateral, como un libro.</p>';
    else if (tipo === 'html') cuerpo =
      '<label>Código HTML a incrustar (iframes, widgets, simuladores…)</label>' +
      '<textarea id="mm_html" style="min-height:120px;font-family:monospace;font-size:12.5px">' + esc(c.html || '') + '</textarea>' +
      '<div id="mm_prev"></div>' +
      '<label>Video propio (opcional)</label><input type="file" id="mm_vfile" accept="video/*">' +
      '<label style="margin-top:4px">…o URL de video</label><input id="mm_vurl" value="' + esc(c.video_url || '') + '" placeholder="https://…/video.mp4">';
    if (tipo === 'page') cuerpo += '<p style="font-size:12px;color:var(--neg-300);margin-top:6px">Tip: usá **negrita**, *cursiva* y listas con guiones — se ven lindas solas.</p>';

    var v = Z.modal('<h2>' + (m ? 'Editar' : 'Nuevo') + ' · ' + TNOMBRE[tipo] + '</h2>' +
      '<label>Título</label><input id="mm_title" value="' + esc(m ? m.title : '') + '">' + cuerpo +
      '<div class="fila" style="margin-top:12px">' +
      '<div style="flex:1"><label>Etiqueta (opcional)</label><input id="mm_etiq" value="' + esc(c.etiqueta || '') + '" placeholder="Ej.: Evaluación, Repaso…"></div>' +
      '<div style="width:110px"><label>Color</label><input type="color" id="mm_etiqc" value="' + esc(c.etiqueta_color || '#7C3AED') + '" style="padding:3px;height:40px"></div></div>' +
      '<div class="fila" style="margin-top:4px">' +
      '<div style="flex:1"><label>Visible desde (opcional)</label><input type="datetime-local" id="mm_from" value="' + (m && m.available_from ? m.available_from.slice(0, 16) : '') + '"></div>' +
      '<div style="flex:1"><label>Se cierra (opcional)</label><input type="datetime-local" id="mm_until" value="' + (m && m.available_until ? m.available_until.slice(0, 16) : '') + '"></div></div>' +
      '<div class="fila" style="justify-content:flex-end;margin-top:16px;gap:8px">' +
      (m && tipo === 'quiz' ? '<button class="btn tur" data-preg>' + ZI('edit') + ' Editar preguntas</button>' : '') +
      '<button class="btn sec" data-x>Cancelar</button><button class="btn" data-ok>Guardar</button></div>',
      (tipo === 'page' || tipo === 'libro' || tipo === 'assignment' || tipo === 'html' || tipo === 'poll') ? 'xl' : true);
    v.querySelector('[data-x]').onclick = function () { v.remove(); };
    var bp = v.querySelector('[data-preg]');
    if (bp) bp.onclick = function () { v.remove(); location.hash = '#/editor-quiz/' + m.id; };
    if (tipo === 'libro') {
      var capsBox = v.querySelector('#mm_caps');
      var filaCap = function (cap) {
        var d = document.createElement('div');
        d.className = 'caprow';
        d.innerHTML = '<div class="fila" style="gap:6px;margin-bottom:6px"><input class="cap-t" style="flex:1" placeholder="Título del capítulo" value="' + esc(cap.t || '') + '">' +
          '<div class="cap-tools"><button type="button" class="iconbtn cap-up" title="Subir">' + ZI('up') + '</button>' +
          '<button type="button" class="iconbtn cap-down" title="Bajar">' + ZI('down') + '</button>' +
          '<button type="button" class="iconbtn cap-del" title="Quitar">' + ZI('trash') + '</button></div></div>' +
          Z.voz.wrap('<textarea class="cap-b" style="min-height:110px" placeholder="Contenido del capítulo…">' + esc(cap.b || '') + '</textarea>');
        d.querySelector('.cap-del').onclick = function () { d.remove(); };
        d.querySelector('.cap-up').onclick = function () { if (d.previousElementSibling) capsBox.insertBefore(d, d.previousElementSibling); };
        d.querySelector('.cap-down').onclick = function () { if (d.nextElementSibling) capsBox.insertBefore(d.nextElementSibling, d); };
        return d;
      };
      (c.capitulos && c.capitulos.length ? c.capitulos : [{ t: '', b: '' }]).forEach(function (cap) {
        capsBox.appendChild(filaCap(cap));
      });
      v.querySelector('#mm_cap_add').onclick = function () { capsBox.appendChild(filaCap({ t: '', b: '' })); };
    }
    var mh = v.querySelector('#mm_html');
    if (mh) {
      var prev = function () { v.querySelector('#mm_prev').innerHTML = bloqueEmbed(mh.value); };
      mh.oninput = prev; prev();
    }
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
        content = { instructions: v.querySelector('#mm_ins').value, max_grade: Number(v.querySelector('#mm_max').value) || 10, allow_late: v.querySelector('#mm_late').checked,
          rubrica: v.querySelector('#mm_rub').value.split('\n').map(function (x) {
            var p = x.split('|'); return p.length === 2 ? { label: p[0].trim(), pts: Number(p[1]) || 0 } : null;
          }).filter(Boolean) };
        var dd = v.querySelector('#mm_due').value;
        due = dd ? new Date(dd).toISOString() : null;
      } else if (tipo === 'quiz') {
        content = { intro: v.querySelector('#mm_intro').value, time_limit_min: Number(v.querySelector('#mm_time').value) || null,
          attempts_allowed: Number(v.querySelector('#mm_att').value) || 1, max_grade: Number(v.querySelector('#mm_max').value) || 10,
          pass_grade: Number(v.querySelector('#mm_pass').value) || 6, shuffle: v.querySelector('#mm_shuf').checked };
      } else if (tipo === 'forum') {
        content = { description: v.querySelector('#mm_desc').value };
      } else if (tipo === 'poll') {
        var ops = v.querySelector('#mm_ops').value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
        if (!v.querySelector('#mm_preg').value.trim() || ops.length < 2) return Z.toast('La encuesta necesita pregunta y 2+ opciones', 'mal');
        content = { pregunta: v.querySelector('#mm_preg').value.trim(), opciones: ops };
      } else if (tipo === 'libro') {
        var caps = [];
        v.querySelectorAll('#mm_caps .caprow').forEach(function (d, ix) {
          var t = d.querySelector('.cap-t').value.trim();
          var b = d.querySelector('.cap-b').value;
          if (t || b.trim()) caps.push({ t: t || ('Capítulo ' + (ix + 1)), b: b });
        });
        if (!caps.length) return Z.toast('El libro necesita al menos un capítulo', 'mal');
        content = { capitulos: caps };
      } else if (tipo === 'html') {
        content = { html: v.querySelector('#mm_html').value, video_url: v.querySelector('#mm_vurl').value.trim() || c.video_url || null };
      }
      var etq = v.querySelector('#mm_etiq'), etqc = v.querySelector('#mm_etiqc');
      content.etiqueta = etq ? etq.value.trim() : (c.etiqueta || '');
      content.etiqueta_color = etqc ? etqc.value : (c.etiqueta_color || '#7C3AED');
      var dfrom = v.querySelector('#mm_from').value, duntil = v.querySelector('#mm_until').value;
      var guardar = function () {
        api().saveModule(courseId, { id: m ? m.id : null, section_id: sectionId, type: tipo, title: title, content: content, due_date: due, visible: m ? m.visible : true,
          available_from: dfrom ? new Date(dfrom).toISOString() : null, available_until: duntil ? new Date(duntil).toISOString() : null })
          .then(function () { v.remove(); Z.toast('Guardado', 'ok'); done && done(); });
      };
      var vf = v.querySelector('#mm_vfile');
      var mf = v.querySelector('#mm_file');
      if (tipo === 'html' && vf && vf.files[0]) {
        if (vf.files[0].size > 4000000) return Z.toast('El video pesa demasiado (máx. 4 MB en demo)', 'mal');
        var r = new FileReader();
        r.onload = function () { content.video_url = r.result; guardar(); };
        r.readAsDataURL(vf.files[0]);
      } else if (tipo === 'file' && mf && mf.files[0] && mf.files[0].size <= 4000000) {
        var r2 = new FileReader();
        r2.onload = function () { content.file_url = r2.result; guardar(); };
        r2.readAsDataURL(mf.files[0]);
      } else if (tipo === 'file' && mf && mf.files[0]) {
        Z.toast('Archivo grande: se guarda solo el nombre en demo', 'mal'); guardar();
      } else guardar();
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
        var me = api().me();
        var m = found, c = fcourse;
        var h = volver('#/curso/' + c.id, esc(c.short_name || c.name)) + topbar(m.title, esc(c.name));
        if (m.type === 'forum') { location.hash = '#/foro/' + m.id; return; }
        var repasoBtn = (me.role === 'estudiante' && (m.type === 'page' || m.type === 'libro'))
          ? '<button class="btn tur sm" id="mod_repaso" style="margin-bottom:12px">' + ZI('sparkle') + ' Repaso automático</button>' : '';
        if (m.type === 'page') h += repasoBtn + '<div class="card" style="max-width:none"><div class="vozrow">' + Z.voz.readBtn('#mod_txt') + '<span>Escuchar</span></div><div id="mod_txt">' + Z.md(m.content.body || '') + '</div></div>';
        else if (m.type === 'link') h += '<div class="card"><p>' + ZI('link') + ' <a href="' + esc(m.content.url) + '" target="_blank" rel="noopener">' + esc(m.content.url) + '</a></p>' +
          '<a class="btn" href="' + esc(m.content.url) + '" target="_blank" rel="noopener" style="margin-top:8px">Abrir enlace</a></div>';
        else if (m.type === 'file') h += '<div class="card"><div class="fila">' + ZI('file') + '<b>' + esc(m.content.file_name || 'Archivo') + '</b>' +
          (m.content.file_url ? '<a class="btn sm" href="' + esc(m.content.file_url) + '" target="_blank">Descargar</a>' : '<span class="pill gris">demo</span>') + '</div></div>';
        else if (m.type === 'announcement') h += '<div class="card"><div class="vozrow">' + Z.voz.readBtn('#mod_txt') + '<span>Escuchar</span></div><div id="mod_txt">' + Z.md(m.content.body || '') + '</div><small style="color:var(--neg-300)">' + Z.fmtFecha(m.created_at, true) + '</small></div>';
        else if (m.type === 'html') h += '<div class="card">' + bloqueEmbed(m.content.video_url || '') + bloqueEmbed(m.content.html || '') +
          ((!m.content.video_url && !m.content.html) ? '<p style="color:var(--neg-300)">Bloque vacío.</p>' : '') + '</div>';
        else if (m.type === 'poll') {
          var ops = (m.content.opciones || []);
          h += '<div class="card" style="max-width:none"><h2 class="md-h" style="margin-top:0">' + esc(m.content.pregunta || 'Encuesta') + '</h2><div id="poll_box"></div></div>';
        }
        else if (m.type === 'libro') {
          var caps = (m.content.capitulos && m.content.capitulos.length) ? m.content.capitulos : [{ t: 'Capítulo 1', b: '' }];
          h += repasoBtn + '<div class="libro"><nav class="libro-nav"><h4>Índice</h4>' +
            caps.map(function (cap, ix) {
              return '<button class="lcap' + (ix === 0 ? ' on' : '') + '" data-cap="' + ix + '"><span class="n">' + (ix + 1) + '</span>' + esc(cap.t) + '</button>';
            }).join('') + '</nav>' +
            '<div class="card" style="min-width:0"><div class="vozrow">' + Z.voz.readBtn('#libro_txt') + '<span>Escuchar</span></div>' +
            '<h2 class="md-h" id="libro_tit"></h2><div id="libro_txt"></div>' +
            '<div class="libro-pie"><button class="btn sec sm" id="libro_prev">' + ZI('back') + ' Anterior</button>' +
            '<span class="pill gris" id="libro_pos"></span>' +
            '<button class="btn sm" id="libro_next">Siguiente ' + ZI('chev') + '</button></div></div></div>';
        }
        var main = Z.shell(h, '#/mis-cursos');
        var rb2 = main.querySelector('#mod_repaso');
        if (rb2) rb2.onclick = function () {
          var fuente = m.type === 'libro'
            ? (m.content.capitulos || []).map(function (x) { return '## ' + x.t + '\n' + x.b; }).join('\n')
            : (m.content.body || '');
          var puntos = [];
          fuente.split('\n').forEach(function (l) {
            l = l.trim();
            if (/^#{2,3}\s/.test(l)) puntos.push('**' + l.replace(/^#+\s*/, '') + '**');
            else if (l.startsWith('> ')) puntos.push(l.slice(2));
            else if (/^- /.test(l)) puntos.push(l.slice(2));
          });
          var bolds = (fuente.match(/\*\*[^*]{4,80}\*\*/g) || []);
          puntos = puntos.slice(0, 14);
          var v = Z.modal('<h2>Repaso automático · ' + esc(m.title) + '</h2>' +
            '<p style="color:var(--neg-500);font-size:13.5px;margin-top:0">Puntos clave extraídos del material:</p>' +
            '<div class="card" style="box-shadow:none;border:1.5px solid var(--neg-150)">' +
            (puntos.length ? '<ul class="md-ul">' + puntos.map(function (p) { return '<li>' + Z.md(p) + '</li>'; }).join('') + '</ul>' : '<p>Sin puntos marcados.</p>') +
            '</div>' +
            '<div class="fila" style="justify-content:flex-end;margin-top:14px"><button class="btn sec" data-x>Cerrar</button>' +
            '<button class="btn tur" id="rp_fc">' + ZI('book') + ' Guardar como flashcards</button></div>');
          v.querySelector('[data-x]').onclick = function () { v.remove(); };
          v.querySelector('#rp_fc').onclick = function () {
            var creadas = 0;
            var secu = bolds.slice(0, 6).map(function (t) { return t.replace(/\*/g, ''); });
            var todo = function (i) {
              if (i >= secu.length) { v.remove(); Z.toast(creadas + ' flashcards agregadas al mazo del curso', 'ok'); return; }
              api().flashSave(m.course_id, { front: '¿Qué es/para qué sirve: ' + secu[i] + '?', back: secu[i] + ' — repasá su definición en "' + m.title + '".' })
                .then(function () { creadas++; todo(i + 1); });
            };
            todo(0);
          };
        };
        if (m.type === 'poll') {
          var opsP = (m.content.opciones || []);
          var pintarPoll = function () {
            api().pollResults(m.id).then(function (r) {
              var box = main.querySelector('#poll_box');
              var total = Math.max(r.total, 1);
              box.innerHTML = opsP.map(function (op, ix) {
                var n = r.votes[ix] || 0, pct = Math.round(n / total * 100);
                return '<button class="pollop' + (r.mine === ix ? ' votada' : '') + '" data-voto="' + ix + '">' +
                  '<span class="pop-txt"><b>' + esc(op) + '</b>' + (r.mine === ix ? ' ' + ZI('check') : '') + '</span>' +
                  '<span class="pop-bar"><i style="width:' + pct + '%"></i></span>' +
                  '<span class="pop-n">' + n + ' (' + pct + '%)</span></button>';
              }).join('') + '<p style="color:var(--neg-300);font-size:13px;margin-top:8px">' + r.total + ' voto' + (r.total === 1 ? '' : 's') +
                (r.mine != null ? ' · podés cambiar tu voto' : '') + '</p>';
              box.querySelectorAll('[data-voto]').forEach(function (b) {
                b.onclick = function () { api().pollVote(m.id, Number(b.getAttribute('data-voto'))).then(pintarPoll); };
              });
            });
          };
          pintarPoll();
        }
        if (m.type === 'libro') {
          var caps2 = (m.content.capitulos && m.content.capitulos.length) ? m.content.capitulos : [{ t: 'Capítulo 1', b: '' }];
          var ixCap = 0;
          var pintar = function () {
            main.querySelector('#libro_tit').textContent = caps2[ixCap].t;
            main.querySelector('#libro_txt').innerHTML = Z.md(caps2[ixCap].b || '');
            main.querySelector('#libro_pos').textContent = (ixCap + 1) + ' de ' + caps2.length;
            main.querySelectorAll('.lcap').forEach(function (b, i) { b.classList.toggle('on', i === ixCap); });
            var bp2 = main.querySelector('#libro_prev'), bn2 = main.querySelector('#libro_next');
            bp2.disabled = ixCap === 0; bn2.disabled = ixCap === caps2.length - 1;
            bp2.style.opacity = bp2.disabled ? '.45' : '1'; bn2.style.opacity = bn2.disabled ? '.45' : '1';
          };
          main.querySelectorAll('.lcap').forEach(function (b) {
            b.onclick = function () { ixCap = Number(b.getAttribute('data-cap')); pintar(); };
          });
          main.querySelector('#libro_prev').onclick = function () { if (ixCap > 0) { ixCap--; pintar(); } };
          main.querySelector('#libro_next').onclick = function () { if (ixCap < caps2.length - 1) { ixCap++; pintar(); } };
          pintar();
        }
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
          h += '<div class="card" style="max-width:none">';
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
      var draftKey = 'zeiro_draft_' + m.id;
      var draft = {};
      try { draft = JSON.parse(localStorage.getItem(draftKey) || '{}'); } catch (e) {}
      var hayDraft = Object.keys(draft).length > 0;
      var h = '<div class="card" style="margin-top:16px">' +
        (hayDraft ? '<div class="draft-banner">' + ZI('sparkle') + ' Recuperamos tu intento anterior — seguí donde quedaste.</div>' : '') +
        '<div class="entre"><h2 style="font-size:16px">Respondé las ' + lista.length + ' preguntas</h2>' +
        '<span class="qprog" id="q_prog"></span>' +
        (cfg.time_limit_min ? '<span class="timer" id="q_timer"></span>' : '') + '</div><form id="q_form" style="margin-top:14px">';
      h += lista.map(function (q, i) { return Z.quiz.renderQ(q, i); }).join('');
      h += '<button type="submit" class="btn" id="q_send" style="font-size:15px;padding:12px 26px;margin-top:6px">Entregar cuestionario</button></form></div>';
      zona.innerHTML = h;
      zona.scrollIntoView({ behavior: 'smooth' });

      /* recuperar borrador */
      if (hayDraft) {
        lista.forEach(function (q) {
          var ans = draft[q.id];
          if (ans === undefined || ans === null) return;
          var box = zona.querySelector('[data-qid="' + q.id + '"]');
          if (!box) return;
          if (q.type === 'mcq') {
            var arr = Array.isArray(ans) ? ans : [ans];
            box.querySelectorAll('input').forEach(function (inp) { if (arr.indexOf(Number(inp.value)) >= 0) inp.checked = true; });
          } else if (q.type === 'tf') {
            box.querySelectorAll('input').forEach(function (inp) { if ((inp.value === 'true') === ans) inp.checked = true; });
          } else if (q.type === 'short' || q.type === 'essay') {
            var ta = box.querySelector('input,textarea'); if (ta) ta.value = ans;
          } else if (q.type === 'match') {
            box.querySelectorAll('select').forEach(function (sel) { if (ans[sel.getAttribute('data-l')]) sel.value = ans[sel.getAttribute('data-l')]; });
          }
        });
        /* re-marcar visualmente lo restaurado */
        zona.querySelectorAll('.preg').forEach(function (p) {
          var marcada = !!p.querySelector('input:checked') || (p.querySelector('input[type=text]') && p.querySelector('input[type=text]').value) || (p.querySelector('textarea') && p.querySelector('textarea').value) || Array.prototype.some.call(p.querySelectorAll('select'), function (s) { return s.value; });
          p.classList.toggle('respondida', !!marcada);
          p.querySelectorAll('.opc').forEach(function (o) {
            var inp = o.querySelector('input');
            if (inp) o.classList.toggle('sel', inp.checked);
          });
        });
      }
      function guardarDraft() {
        try { localStorage.setItem(draftKey, JSON.stringify(Z.quiz.collect(zona, lista))); } catch (e) {}
        var resp = zona.querySelectorAll('.preg').length, hechas = 0;
        zona.querySelectorAll('.preg').forEach(function (p) {
          if (p.querySelector('input:checked, textarea:not(:placeholder-shown), select option:checked:not([value=""])')) hechas++;
        });
        var pe = zona.querySelector('#q_prog');
        if (pe) pe.textContent = Object.keys(Z.quiz.collect(zona, lista)).length + '/' + lista.length + ' respondidas';
      }
      zona.addEventListener('change', function (e) {
        var op = e.target.closest ? e.target.closest('.opc') : null;
        if (op && e.target.matches('input')) {
          if (e.target.type === 'radio') op.parentNode.querySelectorAll('.opc').forEach(function (o) { o.classList.remove('sel'); });
          op.classList.toggle('sel', e.target.checked);
        }
        var preg = e.target.closest ? e.target.closest('.preg') : null;
        if (preg) preg.classList.toggle('respondida', !!preg.querySelector('input:checked') || !!preg.querySelector('textarea:not(:placeholder-shown)') || (preg.querySelector('input[type=text]') && preg.querySelector('input[type=text]').value));
        guardarDraft();
      });
      zona.addEventListener('input', function () { guardarDraft(); });
      guardarDraft();

      if (cfg.time_limit_min) {
        var resta = cfg.time_limit_min * 60;
        var tEl = zona.querySelector('#q_timer');
        var iv = Z.regTimer(setInterval(function () {
          resta--;
          if (!tEl.isConnected) { clearInterval(iv); return; }
          var mm = Math.floor(resta / 60), ss = resta % 60;
          tEl.textContent = mm + ':' + (ss < 10 ? '0' : '') + ss;
          if (resta <= 60) tEl.classList.add('urgente');
          if (resta <= 0) { clearInterval(iv); entregar(true); }
        }, 1000));
      }
      var enviando = false;
      function entregar(auto) {
        if (enviando) return;
        enviando = true;
        var btn = zona.querySelector('#q_send');
        if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }
        var answers = Z.quiz.collect(zona, lista);
        api().submitAttempt(m.id, answers).then(function (a) {
          try { localStorage.removeItem(draftKey); } catch (e) {}
          Z.toast(auto ? 'Tiempo agotado: se entregó solo' : '¡Entregado!', 'ok');
          tomarQuiz(m.id);
        }).catch(function () {
          enviando = false;
          if (btn) { btn.disabled = false; btn.textContent = 'Entregar cuestionario'; }
          Z.toast('No se pudo entregar — probá de nuevo', 'mal');
        });
      }
      zona.querySelector('#q_form').addEventListener('submit', function (e) {
        e.preventDefault();
        var sin = lista.length - Object.keys(Z.quiz.collect(zona, lista)).length;
        if (sin > 0 && !window.confirm('Te quedan ' + sin + ' pregunta(s) sin responder. ¿Entregar igual?')) return;
        entregar(false);
      });
    }

    function verCorreccion(c, m, a) {
      api().questions(m.id, false).then(function (qs) {
        var h = volver('#/quiz/' + m.id, 'Cuestionario') + topbar(m.title, 'Tu corrección · ' + Z.fmtFecha(a.finished_at, true)) +
          '<div class="card" style="max-width:none"><div class="entre"><h2 style="font-size:17px">Puntaje: ' + a.score + ' / ' + a.max_score + '</h2>' +
          (a.needs_review ? '<span class="pill azu">Preguntas abiertas en revisión</span>' : '<span class="pill tur">Corregido</span>') + '</div></div>' +
          '<div style="max-width:none;margin-top:14px">' +
          qs.map(function (q) { return Z.quiz.renderReview(q, a.answers ? a.answers[q.id] : null, a.essay_scores ? a.essay_scores[q.id] : null); }).join('') + '</div>';
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
            '<div class="fila"><button class="btn sec sm" id="eq_bank">' + ZI('download') + ' Del banco</button>' +
            '<button class="btn sec sm" id="eq_add">' + ZI('plus') + ' Agregar pregunta</button></div></div>' +
            '<div id="eq_list" style="margin-top:12px">' +
            qs.map(function (q, ix) { return '<div class="qwrap" data-ix="' + ix + '">' + Z.quiz.editorQ(q) + '</div>'; }).join('') + '</div></div>';
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
              var multi = node.querySelector('[data-multiple]');
              if (multi) multi.onchange = function () {
                node.querySelectorAll('[data-corr]').forEach(function (inp) {
                  inp.type = multi.checked ? 'checkbox' : 'radio';
                });
              };
            });
          }
          wireQ();
          /* ordenar preguntas */
          function mover(btn) {
            var wrap = btn.closest('.qwrap'), dir = btn.hasAttribute('data-up') ? -1 : 1;
            if (dir < 0 && wrap.previousElementSibling) wrap.parentNode.insertBefore(wrap, wrap.previousElementSibling);
            if (dir > 0 && wrap.nextElementSibling) wrap.parentNode.insertBefore(wrap.nextElementSibling, wrap);
          }
          lista.querySelectorAll('.qwrap').forEach(function (w, ix) {
            var barra = document.createElement('div');
            barra.className = 'qord';
            barra.innerHTML = '<button type="button" class="iconbtn" data-up title="Subir">' + ZI('up') + '</button>' +
              '<button type="button" class="iconbtn" data-down title="Bajar">' + ZI('down') + '</button>';
            barra.querySelectorAll('button').forEach(function (b) { b.onclick = function () { mover(b); }; });
            w.querySelector('.qedit').insertBefore(barra, w.querySelector('.qedit').firstChild);
          });
          main.querySelector('#eq_add').onclick = function () {
            var w = document.createElement('div');
            w.className = 'qwrap';
            w.innerHTML = Z.quiz.editorQ(null);
            lista.appendChild(w);
            wireQ();
          };
          /* banco de preguntas */
          var bk = main.querySelector('#eq_bank');
          if (bk) bk.onclick = function () {
            api().bankList(cc.id).then(function (items) {
              var v = Z.modal('<h2>Banco de preguntas · ' + esc(cc.name) + '</h2>' +
                '<div style="max-height:340px;overflow-y:auto">' +
                (items.length ? items.map(function (it) {
                  return '<div class="bank-item"><div style="flex:1;min-width:0"><b>' + esc(it.prompt) + '</b>' +
                    '<small>' + esc(it.type) + ' · ' + it.points + ' pts</small></div>' +
                    '<button class="btn sec sm" data-addb="' + it.id + '">Usar</button>' +
                    '<button class="iconbtn" data-delb="' + it.id + '" title="Borrar del banco">' + ZI('trash') + '</button></div>';
                }).join('') : '<p style="color:var(--neg-300)">Banco vacío — guardá preguntas acá para reutilizarlas en otros cuestionarios.</p>') +
                '</div><div class="fila" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-x>Listo</button></div>');
              v.querySelectorAll('[data-addb]').forEach(function (b) {
                b.onclick = function () {
                  var it = items.filter(function (x) { return x.id === b.getAttribute('data-addb'); })[0];
                  var w = document.createElement('div');
                  w.className = 'qwrap';
                  w.innerHTML = Z.quiz.editorQ({ type: it.type, prompt: it.prompt, points: it.points, payload: it.payload });
                  lista.appendChild(w);
                  wireQ();
                  Z.toast('Pregunta agregada', 'ok');
                };
              });
              v.querySelectorAll('[data-delb]').forEach(function (b) {
                b.onclick = function () { api().bankDelete(b.getAttribute('data-delb')).then(function () { v.remove(); bk.onclick(); }); };
              });
              v.querySelector('[data-x]').onclick = function () { v.remove(); };
            });
          };
          main.querySelector('#eq_save').onclick = function () {
            var nuevas = [];
            lista.querySelectorAll('.qedit').forEach(function (node) { nuevas.push(Z.quiz.collectQ(node, mid)); });
            nuevas.forEach(function (q) {
              if (!q.prompt || !q.prompt.trim()) { /* se valida abajo */ }
            });
            if (nuevas.some(function (q) { return !q.prompt || !q.prompt.trim(); })) return Z.toast('Hay preguntas sin enunciado', 'mal');
            /* ofrecer guardar al banco */
            nuevas.forEach(function (q) {
              if (!q.id) api().bankSave(cc.id, { type: q.type, prompt: q.prompt, points: q.points, payload: q.payload });
            });
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
                var previo = a.essay_scores && a.essay_scores[q.id] != null ? a.essay_scores[q.id] : '';
                return '<div class="preg"><div class="enun">' + esc(q.prompt) + '<span class="pts">' + q.points + ' pts</span></div>' +
                  '<div class="card" style="box-shadow:none;background:var(--azu-50)">' + esc(ans || '—') + '</div>' +
                  '<label>Puntaje (0 a ' + q.points + ')</label><input type="number" data-essay="' + q.id + '" min="0" max="' + q.points + '" step="0.5" value="' + previo + '" style="width:110px"></div>';
              }
              return Z.quiz.renderReview(q, ans);
            }).join('');
            h += '<label>Devolución (opcional)</label>' + Z.voz.wrap('<textarea id="rv_fb" style="min-height:60px">' + esc(a.feedback || '') + '</textarea>') +
              '<button class="btn" id="rv_ok" style="margin-top:12px">Guardar corrección</button></div>';
            zone.innerHTML = h;
            zone.scrollIntoView({ behavior: 'smooth' });
            zone.querySelector('#rv_ok').onclick = function () {
              var mapa = {};
              var mal = false;
              zone.querySelectorAll('[data-essay]').forEach(function (inp) {
                var q = qs.filter(function (x) { return x.id === inp.getAttribute('data-essay'); })[0];
                var val = Number(inp.value);
                if (inp.value === '' || isNaN(val) || val < 0 || val > q.points) mal = true;
                mapa[inp.getAttribute('data-essay')] = val;
              });
              if (mal) return Z.toast('Revisá los puntajes: tienen que ir de 0 al máximo de cada pregunta', 'mal');
              api().reviewAttempt(aid, mapa, zone.querySelector('#rv_fb').value).then(function () {
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
          h += '<div class="card" style="max-width:none"><div class="vozrow">' + Z.voz.readBtn('#en_cons') + '<span>Escuchar consigna</span></div><div id="en_cons">' + Z.md(cfg.instructions || '') + '</div>' +
            '<div class="fila wrap" style="margin:10px 0">' +
            (cm.due_date ? '<span class="pill ' + (vencida ? 'mal' : 'azu') + '">' + ZI('clock') + ' ' + Z.fmtFecha(cm.due_date, true) + '</span>' : '') +
            '<span class="pill vio">Nota máx. ' + (cfg.max_grade || 10) + '</span>' +
            (sub && sub.grade != null ? pillNota(sub.grade) : '') + '</div>';
          if (sub && sub.grade != null) {
            h += '<div class="preg" style="background:var(--tur-50);border-color:var(--tur-300)"><b>Devolución:</b> ' + esc(sub.feedback || '—') + '</div>';
          }
          if (sub) {
            var archivos = (sub.files && sub.files.length ? sub.files : (sub.file_url ? [{ name: sub.file_url }] : []));
            h += '<h3 style="font-size:14px;margin:12px 0 6px">Tu entrega · ' + Z.fmtFecha(sub.submitted_at, true) + '</h3>' +
              '<div class="card" style="box-shadow:none;background:var(--papel)">' + esc(sub.body || '') +
              archivos.map(function (f) {
                return '<p style="margin-top:6px">' + (f.url ? '<a href="' + esc(f.url) + '" download="' + esc(f.name) + '">' : '<span>') +
                  ZI('file') + ' ' + esc(f.name) + (f.url ? '</a>' : '</span>') + '</p>';
              }).join('') +
              (sub.link ? '<p style="margin-top:6px">' + ZI('link') + ' <a href="' + esc(sub.link) + '" target="_blank" rel="noopener">' + esc(sub.link) + '</a></p>' : '') +
              bloqueEmbed(sub.embed || '') + '</div>';
          }
          var puede = (!vencida || cfg.allow_late) && !(sub && sub.grade != null);
          h += '<h3 style="font-size:14px;margin:16px 0 6px">' + (sub && sub.grade != null ? 'Entrega cerrada' : (sub ? 'Reenviar' : 'Entregar')) + '</h3>';
          if (sub && sub.grade != null) {
            h += '<div class="pill tur">Ya está corregida — no se puede reenviar</div>';
          } else if (puede) {
            h += '<label>Texto de la entrega</label>' + Z.voz.wrap('<textarea id="en_body" placeholder="Escribí tu respuesta o describí lo que entregás… (podés dictarlo con el micrófono)">' + esc(sub ? sub.body || '' : '') + '</textarea>') +
              '<label>Archivos (Word, PDF, video, imágenes… cualquier formato, hasta 5)</label>' +
              '<input type="file" id="en_files" multiple>' +
              '<div id="en_flist" class="flist"></div>' +
              '<label>Enlace (opcional): Drive, YouTube, Canva…</label><input id="en_link" placeholder="https://…" value="' + esc(sub ? sub.link || '' : '') + '">' +
              '<label>Incrustar contenido (opcional): código HTML o enlace de video</label>' +
              '<textarea id="en_embed" style="min-height:70px;font-family:monospace;font-size:12.5px" placeholder="<iframe …></iframe>  o  https://…/video.mp4">' + esc(sub ? sub.embed || '' : '') + '</textarea>' +
              '<button class="btn" id="en_ok" style="margin-top:12px">' + ZI('send') + ' Enviar</button>';
          } else {
            h += '<div class="pill mal">Plazo vencido — no acepta entregas tardías</div>';
          }
          h += '</div>';
          var main = Z.shell(h, '#/mis-cursos');
          var finput = main.querySelector('#en_files'), flist = main.querySelector('#en_flist');
          if (finput) finput.onchange = function () {
            flist.innerHTML = Array.prototype.map.call(finput.files, function (f) {
              return '<span class="pill vio" style="margin:4px 6px 0 0">' + ZI('file') + ' ' + esc(f.name) + ' <small>(' + Math.ceil(f.size / 1024) + ' KB)</small></span>';
            }).join('');
          };
          var b = main.querySelector('#en_ok');
          if (b) b.onclick = function () {
            var txt = main.querySelector('#en_body').value;
            var fs = finput ? Array.prototype.slice.call(finput.files) : [];
            var emb = main.querySelector('#en_embed').value;
            var lnk = main.querySelector('#en_link').value.trim();
            if (!txt.trim() && !fs.length && !emb.trim() && !lnk) return Z.toast('Escribí algo, adjuntá un archivo o pegá un enlace', 'mal');
            if (fs.length > 5) return Z.toast('Máximo 5 archivos', 'mal');
            for (var i = 0; i < fs.length; i++) if (fs[i].size > 4000000) return Z.toast('"' + fs[i].name + '" pesa más de 4 MB', 'mal');
            b.disabled = true; b.textContent = 'Enviando…';
            var files = [], leidos = 0;
            var enviar = function () {
              api().submitAssignment(mid, { body: txt, link: lnk || null, embed: emb.trim() || null, files: files })
                .then(function () { Z.toast('Entrega enviada', 'ok'); entrega(mid); })
                .catch(function () { b.disabled = false; b.textContent = 'Enviar'; Z.toast('No se pudo enviar', 'mal'); });
            };
            if (!fs.length) return enviar();
            fs.forEach(function (f) {
              var r = new FileReader();
              r.onload = function () {
                files.push({ name: f.name, url: r.result, size: f.size });
                if (++leidos === fs.length) enviar();
              };
              r.readAsDataURL(f);
            });
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
                '<td style="max-width:260px"><div style="max-height:60px;overflow:auto;font-size:12.5px">' + esc(s.body || '') + (s.file_url ? ' · ' + ZI('file') + ' ' + esc(s.file_url) : '') + '</div>' +
                ((s.files || []).map(function (f) {
                  return f.url ? '<div><a href="' + esc(f.url) + '" download="' + esc(f.name) + '" style="font-size:12px">' + ZI('file') + ' ' + esc(f.name) + '</a></div>' : '';
                }).join('')) +
                (s.link ? '<div><a href="' + esc(s.link) + '" target="_blank" rel="noopener" style="font-size:12px">' + ZI('link') + ' ' + esc(s.link.slice(0, 40)) + '</a></div>' : '') +
                (s.embed ? '<details class="embver"><summary>' + ZI('code') + ' Ver incrustado</summary>' + bloqueEmbed(s.embed) + '</details>' : '') + '</td>' +
                '<td class="num"><input class="nota" type="number" min="0" max="' + ((cm.content || {}).max_grade || 10) + '" step="0.5" data-nota="' + s.id + '" value="' + (s.grade == null ? '' : s.grade) + '">' +
                ((cm.content && cm.content.rubrica && cm.content.rubrica.length)
                  ? '<button class="btn sec sm" style="margin-top:4px" data-rub="' + s.id + '">Rúbrica</button>' : '') + '</td>' +
                '<td><input type="text" data-fb="' + s.id + '" value="' + esc(s.feedback || '') + '" placeholder="Devolución…" style="min-width:150px"></td>' +
                '<td><button class="btn sec sm" data-g="' + s.id + '">Guardar</button></td></tr>';
            }).join('') : '<tr><td colspan="6" style="color:var(--neg-300)">Sin entregas todavía.</td></tr>') +
            '</tbody></table></div>';
          var main = Z.shell(h, '#/mis-cursos');
          main.querySelectorAll('[data-rub]').forEach(function (b) {
            b.onclick = function () {
              var sid2 = b.getAttribute('data-rub');
              var rub = cm.content.rubrica;
              var v = Z.modal('<h2>Rúbrica de corrección</h2>' + rub.map(function (r) {
                return '<label class="rubopt"><input type="checkbox" data-rpts="' + r.pts + '" style="width:auto;margin-right:8px">' +
                  '<span style="flex:1">' + esc(r.label) + '</span><b>' + r.pts + ' pts</b></label>';
              }).join('') + '<div class="entre" style="margin-top:12px"><b>Total: <span id="rub_tot">0</span> pts</b>' +
                '<button class="btn" id="rub_ap">Aplicar a la nota</button></div>');
              var tot = v.querySelector('#rub_tot');
              v.querySelectorAll('[data-rpts]').forEach(function (cb) {
                cb.onchange = function () {
                  var t = 0;
                  v.querySelectorAll('[data-rpts]:checked').forEach(function (x) { t += Number(x.getAttribute('data-rpts')); });
                  tot.textContent = t;
                };
              });
              v.querySelector('#rub_ap').onclick = function () {
                var t = Number(tot.textContent);
                var mx = (cm.content.max_grade || 10);
                main.querySelector('[data-nota="' + sid2 + '"]').value = Math.min(mx, Math.round(t * 10) / 10);
                v.remove(); Z.toast('Nota ' + Math.min(mx, t) + ' desde rúbrica', 'ok');
              };
            };
          });
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
        topbar('Calificaciones · ' + esc(c.name), '', edita ? '<button class="btn sec" id="gb_csv">' + ZI('download') + ' CSV</button><button class="btn sec" onclick="window.print()">' + ZI('print') + ' Imprimir</button>' : '');

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
            return '<tr><td>' + esc(col.label) + ' <span class="pill gris" style="font-size:10px">' + esc(TIPO_ES[col.tipo] || col.tipo) + '</span></td>' +
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
            return '<td class="num"><input class="nota ' + notaCls(val) + '" type="number" min="0" max="' + col.max + '" step="0.5" data-cell="' + s.id + '|' + col.key + '|' + col.label + '|' + col.max + '" value="' + (val == null ? '' : val) + '"></td>';
          }).join('');
          var prom = n ? Math.round(suma / n * 10) / 10 : null;
          return '<tr><td><b>' + esc(s.full_name) + '</b></td>' + tds + '<td class="num" data-prom><b class="' + (prom == null ? '' : (prom >= 6 ? 'nota-big buen' : 'nota-big mala')) + '" style="font-size:15px">' + (prom == null ? '—' : prom) + '</b></td></tr>';
        }).join('') + '</tbody></table></div>' +
        '<p style="font-size:12px;color:var(--neg-300);margin-top:8px">Las notas se guardan al salir de cada casillero. En turquesa ≥ 6, en rojo &lt; 6.</p></div>';
      var main = Z.shell(h, '#/mis-cursos');

      function recalcProm(tr) {
        var vals = [];
        tr.querySelectorAll('.nota').forEach(function (i2) { if (i2.value !== '') vals.push(Number(i2.value)); });
        var cell = tr.querySelector('[data-prom] b');
        if (!cell) return;
        var p2 = vals.length ? Math.round(vals.reduce(function (a, b2) { return a + b2; }, 0) / vals.length * 10) / 10 : null;
        cell.textContent = p2 == null ? '—' : p2;
        cell.className = p2 == null ? '' : (p2 >= 6 ? 'nota-big buen' : 'nota-big mala');
      }
      main.querySelectorAll('[data-cell]').forEach(function (inp) {
        inp.addEventListener('change', function () {
          var p = inp.getAttribute('data-cell').split('|');
          var sid = p[0], key = p[1], label = p[2], max = Number(p[3]) || 10;
          if (inp.value !== '' && (Number(inp.value) < 0 || Number(inp.value) > max)) {
            Z.toast('La nota va de 0 a ' + max, 'mal'); inp.value = '';
          }
          var moduleId = key.indexOf('m:') === 0 ? key.slice(2) : null;
          var lbl = key.indexOf('x:') === 0 ? key.slice(2) : null;
          api().saveGrade(courseId, sid, moduleId, lbl, inp.value === '' ? null : Number(inp.value), max)
            .then(function () {
              inp.className = 'nota ' + notaCls(inp.value === '' ? null : Number(inp.value));
              recalcProm(inp.closest('tr'));
            });
        });
      });
      var bcsv = main.querySelector('#gb_csv');
      if (bcsv) bcsv.onclick = function () {
        var lineas = [['Estudiante'].concat(cols.map(function (c2) { return c2.label; }), ['Promedio']).join(';')];
        gb.students.forEach(function (s) {
          var vals = cols.map(function (col) { var g = getNota(s.id, col); return g && g.grade != null ? g.grade : ''; });
          var conNota = vals.filter(function (x) { return x !== ''; }).map(Number);
          var pr = conNota.length ? (conNota.reduce(function (a, b2) { return a + b2; }, 0) / conNota.length).toFixed(1) : '';
          lineas.push(['"' + s.full_name + '"'].concat(vals, [pr]).join(';'));
        });
        var blob = new Blob(['﻿' + lineas.join('\n')], { type: 'text/csv;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'notas-' + (c.short_name || c.name).replace(/\s+/g, '_') + '.csv';
        a.click(); URL.revokeObjectURL(a.href);
      };
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
        var h = topbar('Agenda', 'Fechas de entrega de todos tus cursos',
          '<button class="btn sec sm" id="ag_ics">' + ZI('download') + ' Exportar (.ics)</button>');
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
        var main = Z.shell(h, '#/agenda');
        var eb = main.querySelector('#ag_ics');
        if (eb) eb.onclick = function () { Z.views.exportIcs(); };
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
      h += '<div class="grid gr2">' +
        (anns.length ? anns.map(function (a) {
          return '<div class="card"><div class="fila"><span class="pill ' + (a.course_id ? 'vio' : 'neg') + '">' + esc(a.course_name) + '</span>' +
            '<span class="pill gris">' + esc(a.audience) + '</span>' +
            '<small style="margin-left:auto;color:var(--neg-300)">' + esc(a.author_name || '') + ' · ' + Z.fmtFecha(a.created_at, true) + '</small></div>' +
            '<div id="av-' + a.id + '"><h3 style="margin:8px 0 4px">' + esc(a.title) + '</h3><p style="margin:0">' + esc(a.body) + '</p></div>' +
            '<div class="vozrow" style="margin-top:6px">' + Z.voz.readBtn('#av-' + a.id) + '<span>Escuchar</span></div></div>';
        }).join('') : '<div class="card vacio">' + ZI('mega') + '<p>Sin comunicados.</p></div>') + '</div>';
      var main = Z.shell(h, '#/comunicados');
      var nb = main.querySelector('#cm_new');
      if (nb) nb.onclick = function () {
        var v = Z.modal('<h2>Nuevo comunicado</h2>' +
          '<label>Destino</label><select id="cn_dest"><option value="">General (todo el colegio)</option>' +
          cursos.map(function (c) { return '<option value="' + c.id + '">' + esc(c.name) + '</option>'; }).join('') + '</select>' +
          '<label>Audiencia</label><select id="cn_aud"><option value="todos">Todos</option><option value="estudiantes">Estudiantes</option><option value="docentes">Docentes</option></select>' +
          '<label>Título</label><input id="cn_t"><label>Mensaje</label>' + Z.voz.wrap('<textarea id="cn_b"></textarea>') +
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
          var yid = me.hijo_id || me.id;
          var filas = cols.map(function (col) {
            var g = null;
            d.gb.rows.forEach(function (r) {
              if (r.student_id !== yid) return;
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
      h += '<div class="fila" style="margin-bottom:12px"><input id="au_buscar" placeholder="Buscar por nombre…" style="max-width:280px">' +
        '<select id="au_rol" style="max-width:180px"><option value="">Todos los roles</option><option>estudiante</option><option>docente</option><option>admin</option></select></div>' +
        '<div class="card"><table class="tabla" id="au_tabla"><thead><tr><th>Nombre</th><th>Rol</th><th>Email</th><th></th></tr></thead><tbody></tbody></table></div>';
      var main = Z.shell(h, '#/admin/usuarios');
      var me = api().me();
      function dibujarTabla() {
        var q = main.querySelector('#au_buscar').value.toLowerCase();
        var rol = main.querySelector('#au_rol').value;
        var filas = us.filter(function (u) {
          return u.full_name.toLowerCase().indexOf(q) >= 0 && (!rol || u.role === rol);
        });
        main.querySelector('#au_tabla tbody').innerHTML = filas.length ? filas.map(function (u) {
          return '<tr><td><b>' + esc(u.full_name) + '</b></td><td><span class="pill ' + (u.role === 'admin' ? 'neg' : u.role === 'docente' ? 'vio' : 'tur') + '">' + esc(u.role) + '</span></td><td>' + esc(u.email || '—') + '</td>' +
            '<td>' + (u.id !== me.id ? '<button class="iconbtn" data-deluser="' + u.id + '" title="Eliminar usuario">' + ZI('trash') + '</button>' : '') + '</td></tr>';
        }).join('') : '<tr><td colspan="4" style="color:var(--neg-300)">Sin resultados.</td></tr>';
        main.querySelectorAll('[data-deluser]').forEach(function (b) {
          b.onclick = function () {
            var u = us.filter(function (x) { return x.id === b.getAttribute('data-deluser'); })[0];
            Z.confirm('Se elimina a ' + u.full_name + ' con sus inscripciones.', function () {
              api().deleteUser(u.id).then(function () {
                us = us.filter(function (x) { return x.id !== u.id; });
                dibujarTabla(); Z.toast('Usuario eliminado', 'ok');
              });
            });
          };
        });
      }
      dibujarTabla();
      main.querySelector('#au_buscar').oninput = dibujarTabla;
      main.querySelector('#au_rol').onchange = dibujarTabla;
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
        '<input id="ins_buscar" placeholder="Buscar estudiante…" style="margin-bottom:8px">' +
        '<div style="max-height:340px;overflow-y:auto" id="ins_lista">' + todos.map(function (s) {
          var en = inscriptos.indexOf(s.id) >= 0;
          return '<div class="fila entre" data-nom="' + esc(s.full_name.toLowerCase()) + '" style="padding:8px 0;border-bottom:1px solid var(--linea)"><span>' + esc(s.full_name) + '</span>' +
            '<button class="btn ' + (en ? 'pel' : 'tur') + ' sm" data-t="' + s.id + '|' + (en ? '0' : '1') + '">' + (en ? 'Quitar' : 'Inscribir') + '</button></div>';
        }).join('') + '</div><div class="fila" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-x>Listo</button></div>', false);
      v.querySelector('#ins_buscar').oninput = function (e) {
        var q = e.target.value.toLowerCase();
        v.querySelectorAll('#ins_lista [data-nom]').forEach(function (row) {
          row.style.display = row.getAttribute('data-nom').indexOf(q) >= 0 ? '' : 'none';
        });
      };
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

  /* ---------- diseñar mi aula (docente) ---------- */
  function modalAula(c) {
    var pats = [['liso', 'Liso'], ['rayas', 'Rayas'], ['puntos', 'Puntos'], ['ondas', 'Ondas']];
    var v = Z.modal('<h2>Diseñar mi aula</h2>' +
      '<div class="aula-prev" id="ap_prev"><div class="pat" id="ap_pat"></div>' +
      '<div class="ah-txt"><span class="sigla" id="ap_sig"></span><h1>' + esc(c.name) + '</h1><p id="ap_welt"></p></div></div>' +
      '<div class="fila" style="margin-top:14px"><div style="width:130px"><label>Color del aula</label>' +
      '<input type="color" id="ap_color" value="' + esc(c.color || '#7C3AED') + '" style="padding:3px;height:40px"></div>' +
      '<div style="flex:1"><label>Sigla en la banda</label><input id="ap_sigla" maxlength="4" value="' + esc(c.sigla || c.short_name || '') + '" placeholder="BIO"></div></div>' +
      '<div class="fila"><div style="flex:1"><label>Imagen de portada (opcional)</label><input type="file" id="ap_banner" accept="image/*">' +
      (c.banner_url ? '<label style="margin-top:4px"><input type="checkbox" id="ap_nobanner" style="width:auto"> quitar imagen actual</label>' : '') + '</div>' +
      '<div style="width:170px"><label>Organización del aula</label><div class="fila" id="ap_lays">' +
      [['lista', 'Lista'], ['solapas', 'Solapas']].map(function (l) {
        return '<button type="button" class="patopt' + ((c.layout || 'lista') === l[0] ? ' on' : '') + '" data-lay="' + l[0] + '" style="flex:1">' + l[1] + '</button>';
      }).join('') + '</div><p style="font-size:11.5px;color:var(--neg-300);margin:3px 0 0">Solapas: cada unidad es una pestaña.</p></div></div>' +
      '<label>Patrón de la portada</label><div class="fila wrap" id="ap_pats">' +
      pats.map(function (p) { return '<button type="button" class="patopt' + ((c.pattern || 'liso') === p[0] ? ' on' : '') + '" data-pat="' + p[0] + '">' + p[1] + '</button>'; }).join('') + '</div>' +
      '<label>Mensaje de bienvenida para el aula</label>' + Z.voz.wrap('<textarea id="ap_welcome" style="min-height:70px" placeholder="Ej.: ¡Bienvenides! Acá van a encontrar todo lo de la materia.">' + esc(c.welcome || '') + '</textarea>') +
      '<div class="fila" style="justify-content:flex-end;margin-top:14px"><button class="btn sec" data-x>Cancelar</button><button class="btn" data-ok>Guardar diseño</button></div>', true);
    var sel = c.pattern || 'liso';
    var lay = c.layout || 'lista';
    var banner = c.banner_url || null;
    function pintar() {
      var pv = v.querySelector('#ap_prev');
      var col = v.querySelector('#ap_color').value;
      pv.style.background = banner
        ? 'linear-gradient(90deg,' + col + 'D9 22%,' + col + '1A),url(' + banner + ') center/cover'
        : col;
      v.querySelector('#ap_pat').className = 'pat pat-' + sel;
      v.querySelector('#ap_sig').textContent = (v.querySelector('#ap_sigla').value || 'ZEI').toUpperCase();
      v.querySelector('#ap_welt').textContent = v.querySelector('#ap_welcome').value;
    }
    pintar();
    v.querySelector('#ap_color').oninput = pintar;
    v.querySelector('#ap_sigla').oninput = pintar;
    v.querySelector('#ap_welcome').oninput = pintar;
    var bf = v.querySelector('#ap_banner');
    bf.onchange = function () {
      var f = bf.files[0];
      if (!f) return;
      if (f.size > 1500000) { Z.toast('La imagen pesa demasiado (máx. 1.5 MB)', 'mal'); bf.value = ''; return; }
      var r = new FileReader();
      r.onload = function () { banner = r.result; pintar(); };
      r.readAsDataURL(f);
    };
    v.querySelectorAll('[data-pat]').forEach(function (b) {
      b.onclick = function () {
        sel = b.getAttribute('data-pat');
        v.querySelectorAll('#ap_pats .patopt').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on'); pintar();
      };
    });
    v.querySelectorAll('[data-lay]').forEach(function (b) {
      b.onclick = function () {
        lay = b.getAttribute('data-lay');
        v.querySelectorAll('#ap_lays .patopt').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
      };
    });
    v.querySelector('[data-x]').onclick = function () { v.remove(); };
    v.querySelector('[data-ok]').onclick = function () {
      var nb = v.querySelector('#ap_nobanner');
      api().saveCourse({ id: c.id, color: v.querySelector('#ap_color').value,
        sigla: v.querySelector('#ap_sigla').value.trim().toUpperCase(),
        pattern: sel, welcome: v.querySelector('#ap_welcome').value.trim(),
        banner_url: (nb && nb.checked) ? null : banner, layout: lay })
        .then(function () { v.remove(); Z.toast('Aula rediseñada', 'ok'); curso(c.id); });
    };
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
        '<label style="margin-top:6px">Código de inscripción (opcional)</label><input id="nc_c" value="' + esc(c && c.enroll_code || '') + '" placeholder="BIO-2026 — los estudiantes se unen solos">' +
        '<div class="fila" style="justify-content:flex-end;margin-top:14px"><button class="btn sec" data-x>Cancelar</button><button class="btn" data-ok>Guardar</button></div>');
      v.querySelector('[data-x]').onclick = function () { v.remove(); };
      v.querySelector('[data-ok]').onclick = function () {
        var n = v.querySelector('#nc_n').value.trim();
        if (!n) return Z.toast('Poné un nombre', 'mal');
        api().saveCourse({ id: c ? c.id : null, name: n, short_name: v.querySelector('#nc_s').value.trim(),
          color: v.querySelector('#nc_c').value, description: v.querySelector('#nc_d').value.trim(),
          teacher_id: v.querySelector('#nc_t').value, school_year: v.querySelector('#nc_y').value.trim(),
          enroll_code: v.querySelector('#nc_c').value.trim().toUpperCase() })
          .then(function () { v.remove(); Z.toast('Curso guardado', 'ok'); (done || home)(); });
      };
    });
  }

  /* ================= FORO ================= */
  function foro(mid) {
    api().myCourses().then(function (cursos) {
      var cm = null, cc = null, i = 0;
      (function next() {
        if (i >= cursos.length) { Z.shell(topbar('Foro no encontrado'), '#/mis-cursos'); return; }
        api().course(cursos[i].id).then(function (c) {
          c.modules.forEach(function (m) { if (m.id === mid) { cm = m; cc = c; } });
          i++; if (!cm) next(); else listo();
        });
      })();
      function listo() {
        var me = api().me();
        var edita = esDocenteDe(cc);
        api().forumPosts(mid).then(function (posts) {
          var hilos = posts.filter(function (p) { return !p.parent_id; });
          var resps = {};
          posts.forEach(function (p) { if (p.parent_id) (resps[p.parent_id] = resps[p.parent_id] || []).push(p); });
          var puedeBorrar = function (p) { return edita || p.author_id === me.id; };
          var h = volver('#/curso/' + cc.id, esc(cc.short_name || cc.name)) +
            topbar(cm.title, esc(cc.name) + ' · ' + hilos.length + ' tema' + (hilos.length === 1 ? '' : 's'),
              '<button class="btn" id="f_new">' + ZI('plus') + ' Nuevo tema</button>');
          if (cm.content && (cm.content.description || cm.content.topic)) h += '<div class="card" style="margin-bottom:14px"><div class="vozrow">' + Z.voz.readBtn('#foro_desc') + '<span>Escuchar</span></div><div id="foro_desc">' + Z.md(cm.content.description || cm.content.topic) + '</div></div>';
          h += hilos.length ? hilos.map(function (p) {
            return '<div class="hilo"><div class="fila"><div class="avatar" style="width:34px;height:34px;font-size:13px">' + esc((p.author_name || '?').slice(0, 2).toUpperCase()) + '</div>' +
              '<div style="flex:1;min-width:0"><b>' + esc(p.title || 'Tema') + '</b><br><small style="color:var(--neg-300)">' + esc(p.author_name) + ' · ' + Z.fmtFecha(p.created_at, true) + '</small></div>' +
              (puedeBorrar(p) ? '<button class="iconbtn" data-del="' + p.id + '">' + ZI('trash') + '</button>' : '') + '</div>' +
              '<p style="margin:8px 0">' + esc(p.body) + '</p>' +
              (resps[p.id] || []).map(function (r) {
                return '<div class="resp"><b>' + esc(r.author_name) + '</b> <small style="color:var(--neg-300)">' + Z.fmtFecha(r.created_at, true) + '</small>' +
                  '<p style="margin:4px 0 0">' + esc(r.body) + '</p>' +
                  (puedeBorrar(r) ? '<button class="iconbtn" data-del="' + r.id + '" style="position:absolute;top:6px;right:6px">' + ZI('trash') + '</button>' : '') + '</div>';
              }).join('') +
              '<div class="fila" style="margin-top:8px">' + Z.voz.wrap('<input type="text" data-resp="' + p.id + '" placeholder="Respondé acá…" style="flex:1">') +
              '<button class="btn tur sm" data-go="' + p.id + '">' + ZI('send') + '</button></div></div>';
          }).join('') : '<div class="card vacio">' + Z_ZEBRA('pensar') + '<p>Nadie abrió un tema todavía. ¡Sé la primera persona!</p></div>';
          var main = Z.shell(h, '#/mis-cursos');
          if (me.role === 'estudiante') api().markViewed(mid);
          main.querySelectorAll('[data-del]').forEach(function (b) {
            b.onclick = function () {
              Z.confirm('Se borra el mensaje y sus respuestas.', function () {
                api().deleteForumPost(b.getAttribute('data-del')).then(function () { foro(mid); });
              });
            };
          });
          function enviarRespuesta(hiloId) {
            var inp = main.querySelector('[data-resp="' + hiloId + '"]');
            var txt = inp.value.trim();
            if (!txt) return Z.toast('Escribí algo primero', 'mal');
            api().postForum(mid, { parent_id: hiloId, body: txt }).then(function () { foro(mid); });
          }
          main.querySelectorAll('[data-go]').forEach(function (b) {
            b.onclick = function () { enviarRespuesta(b.getAttribute('data-go')); };
          });
          main.querySelectorAll('[data-resp]').forEach(function (inp) {
            inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') enviarRespuesta(inp.getAttribute('data-resp')); });
          });
          main.querySelector('#f_new').onclick = function () {
            var v = Z.modal('<h2>Nuevo tema</h2><label>Título</label><input id="ft_t" placeholder="¿De qué querés hablar?">' +
              '<label>Mensaje</label>' + Z.voz.wrap('<textarea id="ft_b" style="min-height:100px"></textarea>') +
              '<div class="fila" style="justify-content:flex-end;margin-top:14px"><button class="btn sec" data-x>Cancelar</button><button class="btn" data-ok>Publicar</button></div>');
            v.querySelector('[data-x]').onclick = function () { v.remove(); };
            v.querySelector('[data-ok]').onclick = function () {
              var t = v.querySelector('#ft_t').value.trim(), b = v.querySelector('#ft_b').value.trim();
              if (!t || !b) return Z.toast('Completá título y mensaje', 'mal');
              api().postForum(mid, { title: t, body: b }).then(function () { v.remove(); foro(mid); });
            };
          };
        });
      }
    });
  }

  /* ================= ASISTENCIA ================= */
  function asistencia(courseId) {
    api().course(courseId).then(function (c) {
      if (!c) { Z.shell(topbar('Curso no encontrado'), '#/mis-cursos'); return; }
      var me = api().me();
      var edita = esDocenteDe(c);
      var h = volver('#/curso/' + c.id, esc(c.short_name || c.name)) + topbar('Asistencia · ' + esc(c.name), '');

      if (!edita) {
        /* vista estudiante */
        Promise.all([api().myAttendancePct(courseId), api().attendance(courseId)]).then(function (rs) {
          var pct = rs[0];
          var mias = rs[1].filter(function (a) { return a.student_id === me.id; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
          h += '<div class="card" style="text-align:center;padding:30px">' + Z_ZEBRA(pct == null ? 'pensar' : (pct >= 80 ? 'fest' : 'saludo')) +
            '<div style="font-size:52px;font-weight:900;color:' + (pct == null ? 'var(--neg-300)' : pct >= 80 ? 'var(--tur-600)' : pct >= 60 ? 'var(--azu-600)' : 'var(--malo)') + '">' +
            (pct == null ? '—' : pct + '%') + '</div><p style="color:var(--neg-500)">' + (pct == null ? 'Todavía no hay registros de asistencia.' : 'de asistencia en ' + mias.length + ' clases registradas') + '</p></div>';
          if (mias.length) {
            h += '<div class="card" style="margin-top:14px"><h2 style="font-size:15px;margin-bottom:10px">Últimas clases</h2>' +
              mias.slice(0, 12).map(function (a) {
                return '<div class="fila entre" style="padding:7px 0;border-bottom:1px solid var(--linea)"><span>' + Z.fmtFecha(a.date + 'T12:00:00') + '</span>' +
                  '<span class="pill ' + (a.status === 'P' ? 'tur' : a.status === 'T' ? 'azu' : 'mal') + '">' + (a.status === 'P' ? 'Presente' : a.status === 'T' ? 'Tarde' : 'Ausente') + '</span></div>';
              }).join('') + '</div>';
          }
          Z.shell(h, '#/mis-cursos');
        });
        return;
      }

      /* vista docente */
      var hoy = new Date().toISOString().slice(0, 10);
      h += '<div class="card"><div class="fila" style="margin-bottom:12px"><label style="margin:0">Fecha:</label>' +
        '<input type="date" id="as_fecha" value="' + hoy + '" style="max-width:170px"></div><div id="as_grid"></div></div>';
      var main = Z.shell(h, '#/mis-cursos');
      function dibujar() {
        var fecha = main.querySelector('#as_fecha').value;
        api().attendance(courseId, fecha).then(function (rows) {
          var mapa = {};
          rows.forEach(function (r) { mapa[r.student_id] = r.status; });
          var grid = main.querySelector('#as_grid');
          grid.innerHTML = '<table class="tabla"><thead><tr><th>Estudiante</th><th>Estado</th><th class="num">% curso</th></tr></thead><tbody>' +
            c.students.map(function (s) {
              var st = mapa[s.id] || '';
              return '<tr><td><b>' + esc(s.full_name) + '</b></td><td><div class="ast3" data-sid="' + s.id + '">' +
                ['P', 'T', 'A'].map(function (t) {
                  return '<button class="' + (st === t ? 'on ' + t.toLowerCase() : '') + '" data-st="' + t + '">' + t + '</button>';
                }).join('') + '</div></td><td class="num" data-pct="' + s.id + '">…</td></tr>';
            }).join('') + '</tbody></table>';
          c.students.forEach(function (s) {
            api().myAttendancePct ? api().attendance(courseId).then(function (all) {
              var deEl = all.filter(function (a) { return a.student_id === s.id; });
              if (!deEl.length) { var td = main.querySelector('[data-pct="' + s.id + '"]'); if (td) td.textContent = '—'; return; }
              var ok = deEl.filter(function (a) { return a.status === 'P' || a.status === 'T'; }).length;
              var td = main.querySelector('[data-pct="' + s.id + '"]');
              if (td) td.innerHTML = '<span class="ast-pct">' + Math.round(ok / deEl.length * 100) + '%</span>';
            }) : null;
          });
          grid.querySelectorAll('.ast3 button').forEach(function (b) {
            b.onclick = function () {
              var sid = b.closest('.ast3').getAttribute('data-sid');
              var st = b.getAttribute('data-st');
              api().setAttendance(courseId, sid, main.querySelector('#as_fecha').value, st).then(function () {
                b.closest('.ast3').querySelectorAll('button').forEach(function (x) { x.className = ''; });
                b.className = 'on ' + st.toLowerCase();
                Z.toast('Asistencia guardada', 'ok');
              });
            };
          });
        });
      }
      main.querySelector('#as_fecha').onchange = dibujar;
      dibujar();
    });
  }

  /* ================= MIS LOGROS ================= */
  function misLogros() {
    Promise.all([api().badges(), api().myXp ? api().myXp() : Promise.resolve(null),
                 api().leaderboard ? api().leaderboard() : Promise.resolve([]),
                 api().myCerts ? api().myCerts() : Promise.resolve([])]).then(function (rr) {
      var defs = rr[0], xp = rr[1], tabla = rr[2], certs = rr[3];
      var ganadas = defs.filter(function (b) { return b.ok; }).length;
      var h = topbar('Mis logros', ganadas + ' de ' + defs.length + ' insignias ganadas');
      if (xp) {
        var pctN = Math.min(100, Math.round((xp.total - xp.acum) / Math.max(1, xp.next - xp.acum) * 100));
        h += '<div class="xpcard"><div class="xp-niv"><b>Nivel ' + xp.level + '</b><span>' + xp.total + ' XP</span></div>' +
          '<div class="xp-bar"><i style="width:' + pctN + '%"></i></div>' +
          '<div class="xp-info"><span>' + ZI('flame') + ' Racha: ' + xp.streak + ' día' + (xp.streak === 1 ? '' : 's') + '</span>' +
          '<span>' + (xp.next - xp.total) + ' XP para nivel ' + (xp.level + 1) + '</span></div></div>';
      }
      if (certs && certs.length) {
        h += '<div class="card" style="max-width:none"><h3 style="margin:0 0 10px;font-size:15px">Certificados</h3>' + certs.map(function (ct) {
          return '<a class="hilo" href="#/cert/' + ct.code + '"><span class="nico" style="color:var(--vio-500)">' + ZI('award') + '</span>' +
            '<span class="h-txt"><b>' + esc(ct.course_name) + '</b><small>' + Z.fmtFecha(ct.issued_at) + '</small></span>' +
            '<span class="pill vio">' + ct.code + '</span></a>';
        }).join('') + '</div>';
      }
      h += '<div class="grid gr3">' + defs.map(function (b) {
        return '<div class="insignia ' + (b.ok ? 'ganada' : 'locked') + '">' +
          '<div class="stick">' + ZI(b.icon) + '</div>' +
          '<b>' + esc(b.nombre) + '</b><small>' + esc(b.desc) + '</small>' +
          (b.ok ? '<div class="med">' + ZI('award') + ' ¡Ganada!</div>' : '<small style="color:var(--neg-150)">Todavía no</small>') + '</div>';
      }).join('') + '</div>';
      if (tabla && tabla.length) {
        h += '<div class="card" style="max-width:none"><h3 style="margin:0 0 10px;font-size:15px">Tabla de posiciones</h3>' +
          tabla.slice(0, 10).map(function (t, ix) {
            return '<div class="hilo"><span class="pos-n">' + (ix + 1) + '°</span>' +
              '<span class="h-txt"><b>' + esc(t.name) + '</b></span><span class="pill ' + (ix === 0 ? 'vio' : 'gris') + '">' + t.pts + ' XP</span></div>';
          }).join('') + '</div>';
      }
      Z.shell(h, '#/mis-logros');
    });
  }

  /* ================= PREVISUALIZAR CUESTIONARIO (docente) ================= */
  function previsualizarQuiz(mid) {
    api().questions(mid, false).then(function (qs) {
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
          var h = volver('#/correccion-quiz/' + mid, 'Intentos') +
            topbar('Vista previa · ' + cm.title, 'Así lo ve el estudiante · ' + esc(cc.name),
              '<button class="btn sec" id="pv_sol">' + ZI('check') + ' Ver respuestas</button>');
          h += '<div class="card" style="max-width:none">' + (cfg.intro ? Z.md(cfg.intro) : '') +
            '<div class="fila wrap" style="margin-top:8px"><span class="pill azu">' + qs.length + ' preguntas</span>' +
            (cfg.time_limit_min ? '<span class="pill azu">' + ZI('clock') + ' ' + cfg.time_limit_min + ' min</span>' : '') +
            '<span class="pill vio">' + (cfg.attempts_allowed || 1) + ' intento' + ((cfg.attempts_allowed || 1) > 1 ? 's' : '') + '</span></div></div>' +
            '<div id="pv_list" style="max-width:none;margin-top:14px"></div>';
          var main = Z.shell(h, '#/mis-cursos');
          var verSol = false;
          function dibujar() {
            main.querySelector('#pv_list').innerHTML = qs.map(function (q, ix) {
              if (verSol) {
                var correcta = q.type === 'mcq' ? (q.payload.correct || []) : q.type === 'tf' ? q.payload.correct : null;
                return Z.quiz.renderReview(q, q.type === 'mcq' ? (q.payload.correct || []) : q.type === 'tf' ? q.payload.correct : (q.type === 'match' ? (q.payload.left || []).reduce(function (o, l, i2) { o[l] = q.payload.right[i2]; return o; }, {}) : 'respuesta abierta'));
              }
              return Z.quiz.renderQ(q, ix);
            }).join('') || '<div class="card vacio">' + Z_ZEBRA('pensar') + '<p>Sin preguntas todavía.</p></div>';
            main.querySelectorAll('#pv_list input, #pv_list select, #pv_list textarea').forEach(function (el) { el.disabled = true; });
          }
          dibujar();
          main.querySelector('#pv_sol').onclick = function () {
            verSol = !verSol;
            this.textContent = verSol ? 'Ocultar respuestas' : 'Ver respuestas';
            dibujar();
          };
        }
      });
    });
  }

  Z.views = {
    home: home, misCursos: misCursos, curso: curso, modulo: modulo,
    tomarQuiz: tomarQuiz, editorQuiz: editorQuiz, corregirQuiz: corregirQuiz,
    entrega: entrega, corregirEntregas: corregirEntregas, notas: notas,
    agenda: agenda, comunicados: comunicados, misNotas: misNotas,
    adminUsuarios: adminUsuarios, adminCursos: adminCursos,
    foro: foro, asistencia: asistencia, misLogros: misLogros, previsualizarQuiz: previsualizarQuiz
  };
})();

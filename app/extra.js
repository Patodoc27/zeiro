/* ZEIRO · Vistas extra v3: mensajería, pendientes, progreso, flashcards,
   estadísticas, certificados, export iCal. */
(function () {
  var Z = window.Z = window.Z || {};
  var api = function () { return Z.api; };
  var esc = function (s) { return Z.esc(s); };
  var V = Z.views = Z.views || {};

  function topbar(titulo, sub, extra) {
    return '<div class="topbar"><div><h1>' + esc(titulo) + '</h1>' +
      (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div><div class="esp"></div>' + (extra || '') + '</div>';
  }
  function volver(hash, txt) {
    return '<a class="btn sec sm" href="' + hash + '" style="margin-bottom:12px">' + ZI('back') + ' ' + (txt || 'Volver') + '</a>';
  }

  /* ================= MENSAJES ================= */
  V.mensajes = function () {
    var me = api().me();
    Promise.all([api().threads(), api().users()]).then(function (rs) {
      var hilos = rs[0], gente = rs[1].filter(function (u) { return u.id !== me.id; });
      var h = topbar('Mensajes', 'Conversación directa con docentes y estudiantes',
        '<button class="btn sm" id="ms_new">' + ZI('plus') + ' Nuevo mensaje</button>');
      h += '<div class="card">' + (hilos.length ? hilos.map(function (t) {
        return '<a class="hilo" href="#/chat/' + t.uid + '"><span class="avatar sm">' +
          esc(t.name.split(/[\s,]+/).filter(Boolean).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase()) +
          '</span><span class="h-txt"><b>' + esc(t.name) + ' <small class="pill gris">' + esc(t.role) + '</small></b>' +
          '<small>' + (t.mio ? 'Vos: ' : '') + esc(t.last_body.slice(0, 60)) + '</small></span>' +
          '<span class="h-der"><small>' + Z.fmtFecha(t.last_at) + '</small>' +
          (t.unread ? '<span class="nbadge">' + t.unread + '</span>' : '') + '</span></a>';
      }).join('') : '<div class="vacio">' + Z_ZEBRA('pensar') + '<p>No tenés conversaciones todavía.</p></div>') + '</div>';
      var main = Z.shell(h, '#/mensajes');
      main.querySelector('#ms_new').onclick = function () {
        var v = Z.modal('<h2>Nuevo mensaje</h2>' +
          '<label>Para</label><select id="nm_to">' + gente.map(function (u) {
            return '<option value="' + u.id + '">' + esc(u.full_name) + ' (' + esc(u.role) + ')</option>';
          }).join('') + '</select>' +
          '<div class="fila" style="justify-content:flex-end;margin-top:14px"><button class="btn sec" data-x>Cancelar</button>' +
          '<button class="btn" data-ok>Abrir chat</button></div>');
        v.querySelector('[data-x]').onclick = function () { v.remove(); };
        v.querySelector('[data-ok]').onclick = function () {
          location.hash = '#/chat/' + v.querySelector('#nm_to').value; v.remove();
        };
      };
    });
  };

  V.chat = function (uid) {
    var me = api().me();
    api().users().then(function (us) {
      var otro = us.filter(function (u) { return u.id === uid; })[0];
      var h = volver('#/mensajes', 'Mensajes') +
        topbar(otro ? otro.full_name : 'Chat', otro ? otro.role : '');
      h += '<div class="card" style="max-width:none"><div id="chat_box" class="chatbox"></div>' +
        '<div class="chatbar"><input id="chat_in" placeholder="Escribí un mensaje…" autocomplete="off">' +
        '<button class="btn" id="chat_send">' + ZI('send') + '</button></div></div>';
      var main = Z.shell(h, '#/mensajes');
      var pintar = function () {
        api().threadWith(uid).then(function (ms) {
          var box = main.querySelector('#chat_box');
          box.innerHTML = ms.length ? ms.map(function (m) {
            var mio = m.from_id === me.id;
            return '<div class="burbuja ' + (mio ? 'mia' : 'suya') + '">' + esc(m.body) +
              '<small>' + Z.fmtFecha(m.created_at, true) + '</small></div>';
          }).join('') : '<p style="color:var(--neg-300);text-align:center;padding:20px">Todavía no hay mensajes. ¡Escribí el primero!</p>';
          box.scrollTop = box.scrollHeight;
        });
      };
      var enviar = function () {
        var inp = main.querySelector('#chat_in');
        var t = inp.value.trim();
        if (!t) return;
        inp.value = '';
        api().sendMessage(uid, t).then(pintar);
      };
      main.querySelector('#chat_send').onclick = enviar;
      main.querySelector('#chat_in').onkeydown = function (e) { if (e.key === 'Enter') enviar(); };
      pintar();
    });
  };

  /* ================= PENDIENTES (estudiante) ================= */
  V.pendientes = function () {
    api().pendientes().then(function (ps) {
      var pend = ps.filter(function (p) { return !p.hecha; });
      var hechos = ps.filter(function (p) { return p.hecha; });
      var h = topbar('Pendientes', 'Tus entregas y cuestionarios por fecha');
      h += '<div class="card" style="max-width:none">' + (pend.length ? pend.map(function (p) {
        var dest = p.mod.type === 'quiz' ? '#/quiz/' + p.mod.id : '#/entrega/' + p.mod.id;
        return '<a class="hilo" href="' + dest + '" style="' + (p.vencida ? 'opacity:.6' : '') + '">' +
          '<span class="nico" style="color:var(--vio-500)">' + ZI(p.mod.type === 'quiz' ? 'quiz' : 'task') + '</span>' +
          '<span class="h-txt"><b>' + esc(p.mod.title) + '</b><small>' + esc(p.course ? p.course.short_name || p.course.name : '') + '</small></span>' +
          '<span class="h-der"><span class="pill ' + (p.vencida ? 'mal' : 'azu') + '">' + ZI('clock') + ' ' + Z.fmtFecha(p.mod.due_date) + '</span></span></a>';
      }).join('') : '<div class="vacio">' + Z_ZEBRA('fest') + '<p>¡Estás al día! Nada pendiente.</p></div>') + '</div>';
      if (hechos.length) {
        h += '<div class="card" style="max-width:none"><h3 style="margin:0 0 8px;font-size:15px;color:var(--neg-500)">Ya entregaste</h3>' +
          hechos.map(function (p) {
            return '<div class="hilo" style="opacity:.7"><span class="nico" style="color:var(--tur-500)">' + ZI('check') + '</span>' +
              '<span class="h-txt"><b>' + esc(p.mod.title) + '</b><small>' + esc(p.course ? p.course.short_name || p.course.name : '') + '</small></span>' +
              '<span class="pill gris">entregado</span></div>';
          }).join('') + '</div>';
      }
      Z.shell(h, '#/pendientes');
    });
  };

  /* ================= PROGRESO (docente) ================= */
  V.progreso = function (courseId) {
    Promise.all([api().course(courseId), api().courseProgress(courseId)]).then(function (rs) {
      var c = rs[0], rows = rs[1];
      var h = volver('#/curso/' + courseId, esc(c.short_name || c.name)) +
        topbar('Progreso del curso', esc(c.name) + ' · ' + rows.length + ' estudiantes');
      h += '<div class="card" style="max-width:none;overflow-x:auto"><table class="md-tab"><tbody>' +
        '<tr><th>Estudiante</th><th>Materiales vistos</th><th>Evaluaciones</th><th>Promedio</th><th>Certificado</th></tr>' +
        rows.map(function (r) {
          var pct = r.total ? Math.round(r.vistos / r.total * 100) : 0;
          return '<tr><td><b>' + esc(r.student ? r.student.full_name : '?') + '</b></td>' +
            '<td><div class="minibar"><i style="width:' + pct + '%"></i><span>' + r.vistos + '/' + r.total + ' · ' + pct + '%</span></div></td>' +
            '<td>' + r.hechos + '/' + r.gradables + '</td>' +
            '<td>' + (r.prom != null ? '<span class="pill ' + (r.prom >= 6 ? 'tur' : 'mal') + '">' + r.prom + '</span>' : '<span class="pill gris">—</span>') + '</td>' +
            '<td>' + (r.cert ? '<a class="btn sec sm" href="#/cert/' + r.cert.code + '" target="_blank">' + ZI('award') + ' ' + r.cert.code + '</a>'
                             : '<button class="btn sm" data-cert="' + r.student.id + '">' + ZI('award') + ' Emitir</button>') + '</td></tr>';
        }).join('') + '</tbody></table>' +
        (rows.length ? '' : '<div class="vacio"><p>Sin estudiantes inscriptos.</p></div>') + '</div>';
      var main = Z.shell(h, '#/mis-cursos');
      main.querySelectorAll('[data-cert]').forEach(function (b) {
        b.onclick = function () {
          api().issueCert(courseId, b.getAttribute('data-cert')).then(function (cert) {
            Z.toast('Certificado ' + cert.code + ' emitido', 'ok'); V.progreso(courseId);
          });
        };
      });
    });
  };

  /* ================= FLASHCARDS ================= */
  V.flashcards = function (courseId) {
    var me = api().me();
    Promise.all([api().course(courseId), api().flashCards(courseId), api().myDueFlash(courseId)]).then(function (rs) {
      var c = rs[0], cards = rs[1], mias = rs[2];
      var edita = me.role !== 'estudiante' || (c.teacher_id === me.id);
      var h = volver('#/curso/' + courseId, esc(c.short_name || c.name)) +
        topbar('Flashcards', esc(c.name),
          edita ? '<button class="btn sm" id="fc_new">' + ZI('plus') + ' Nueva carta</button>' : '');
      if (edita) {
        h += '<div class="card" style="max-width:none">' + (cards.length ? cards.map(function (fc) {
          return '<div class="fila" style="border-bottom:1px solid var(--neg-150);padding:9px 0;align-items:flex-start">' +
            '<div style="flex:1"><b>' + esc(fc.front) + '</b><br><small style="color:var(--neg-500)">' + esc(fc.back) + '</small></div>' +
            '<button class="iconbtn" data-fdel="' + fc.id + '">' + ZI('trash') + '</button></div>';
        }).join('') : '<div class="vacio"><p>Sin cartas todavía. Crean repasos cortos frente/dorso.</p></div>') + '</div>';
      } else {
        var debidas = mias.filter(function (x) { return x.pendiente; });
        h += '<div class="card" style="max-width:760px;margin:0 auto;text-align:center" id="fc_stage"></div>' +
          '<div class="card" style="max-width:760px;margin:14px auto 0"><div class="fila wrap" style="justify-content:center;gap:8px">' +
          '<span class="pill vio">' + cards.length + ' cartas</span><span class="pill azu">' + debidas.length + ' por repasar</span>' +
          '<span class="pill tur">' + mias.filter(function (x) { return x.box >= 3; }).length + ' aprendidas</span></div></div>';
      }
      var main = Z.shell(h, '#/mis-cursos');
      if (edita) {
        main.querySelectorAll('[data-fdel]').forEach(function (b) {
          b.onclick = function () { api().flashDelete(b.getAttribute('data-fdel')).then(function () { V.flashcards(courseId); }); };
        });
        main.querySelector('#fc_new').onclick = function () {
          var v = Z.modal('<h2>Nueva flashcard</h2><label>Frente (pregunta)</label><input id="fc_f">' +
            '<label style="margin-top:6px">Dorso (respuesta)</label>' + Z.voz.wrap('<textarea id="fc_b" style="min-height:70px"></textarea>') +
            '<div class="fila" style="justify-content:flex-end;margin-top:14px"><button class="btn sec" data-x>Cancelar</button><button class="btn" data-ok>Guardar</button></div>');
          v.querySelector('[data-x]').onclick = function () { v.remove(); };
          v.querySelector('[data-ok]').onclick = function () {
            var f = v.querySelector('#fc_f').value.trim(), b = v.querySelector('#fc_b').value.trim();
            if (!f || !b) return Z.toast('Completá frente y dorso', 'mal');
            api().flashSave(courseId, { front: f, back: b }).then(function () { v.remove(); V.flashcards(courseId); });
          };
        };
      } else {
        var cola = mias.filter(function (x) { return x.pendiente; });
        var vuelta = false;
        var pintarCarta = function () {
          var st = main.querySelector('#fc_stage');
          if (!cola.length) {
            st.innerHTML = Z_ZEBRA('fest') + '<h3>¡Repaso completo!</h3><p style="color:var(--neg-500)">Repasaste todas las cartas debidas de hoy.</p>';
            return;
          }
          var it = cola[0];
          st.innerHTML = '<div class="fcard' + (vuelta ? ' flip' : '') + '" id="fc_c">' +
            '<div class="fcara"><small>FRENTE</small><b>' + esc(it.card.front) + '</b></div>' +
            '<div class="fcara back"><small>DORSO</small><b>' + esc(it.card.back) + '</b></div></div>' +
            (!vuelta
              ? '<button class="btn" id="fc_ver" style="margin-top:16px">Mostrar respuesta</button>'
              : '<div class="fila" style="justify-content:center;gap:10px;margin-top:16px">' +
                '<button class="btn pel" id="fc_no">No la sabía</button><button class="btn tur" id="fc_si">La sabía ' + ZI('check') + '</button></div>') +
            '<p style="color:var(--neg-300);font-size:12.5px;margin-top:10px">' + cola.length + ' por repasar</p>';
          st.querySelector('#fc_c').onclick = function () { if (!vuelta) { vuelta = true; pintarCarta(); } };
          var bv = st.querySelector('#fc_ver');
          if (bv) bv.onclick = function () { vuelta = true; pintarCarta(); };
          var bn = st.querySelector('#fc_no'), bs = st.querySelector('#fc_si');
          if (bn) bn.onclick = function () { api().flashReview(it.card.id, false).then(function () { cola.push(cola.shift()); vuelta = false; pintarCarta(); }); };
          if (bs) bs.onclick = function () { api().flashReview(it.card.id, true).then(function () { cola.shift(); vuelta = false; pintarCarta(); }); };
        };
        pintarCarta();
      }
    });
  };

  /* ================= ESTADÍSTICAS (dirección) ================= */
  V.panel = function () {
    api().stats().then(function (st) {
      if (!st) { Z.shell('<div class="card vacio"><p>Sin datos.</p></div>', '#/panel'); return; }
      var maxN = Math.max.apply(null, st.serie.map(function (x) { return x.n; }).concat([1]));
      var h = topbar('Estadísticas', 'Actividad de la plataforma · últimos 30 días');
      h += '<div class="statgrid">' +
        '<div class="stat"><b>' + st.usuarios.estudiante + '</b><span>Estudiantes</span></div>' +
        '<div class="stat"><b>' + st.usuarios.docente + '</b><span>Docentes</span></div>' +
        '<div class="stat"><b>' + st.cursos + '</b><span>Cursos</span></div>' +
        '<div class="stat"><b>' + st.modulos + '</b><span>Ítems de contenido</span></div>' +
        '<div class="stat"><b>' + st.intentos + '</b><span>Intentos de quiz</span></div>' +
        '<div class="stat"><b>' + st.entregas + '</b><span>Entregas</span></div>' +
        '<div class="stat"><b>' + st.mensajes + '</b><span>Mensajes</span></div>' +
        '<div class="stat"><b>' + (st.aprob_pct != null ? st.aprob_pct + '%' : '—') + '</b><span>Aprobación</span></div></div>';
      h += '<div class="card"><h3 style="margin:0 0 12px;font-size:15px">Actividad diaria (intentos + entregas + foros + mensajes)</h3>' +
        '<div class="barchart">' + st.serie.map(function (x) {
          return '<div class="bcol" title="' + x.dia + ': ' + x.n + '"><i style="height:' + Math.max(3, Math.round(x.n / maxN * 100)) + '%"></i><span>' + x.dia.split('-')[1] + '</span></div>';
        }).join('') + '</div></div>';
      Z.shell(h, '#/panel');
    });
  };

  /* ================= CERTIFICADO (imprimible) ================= */
  V.cert = function (code) {
    api().certByCode(code).then(function (c) {
      var root = document.getElementById('root');
      if (!c) { Z.shell('<div class="card vacio"><p>Certificado no encontrado.</p></div>', '#/home'); return; }
      root.innerHTML = '<div class="certwrap"><div class="cert" style="--cc:' + esc(c.course_color || '#7C3AED') + '">' +
        '<img src="assets/logo-zeiro.png" alt="Zeiro" class="cert-logo">' +
        '<h1>Certificado de aprobación</h1>' +
        '<p class="cert-sub">Se certifica que</p>' +
        '<h2>' + esc(c.student_name) + '</h2>' +
        '<p class="cert-sub">completó y aprobó el curso</p>' +
        '<h3 style="color:var(--cc)">' + esc(c.course_name) + '</h3>' +
        (c.teacher_name ? '<p class="cert-sub">a cargo de ' + esc(c.teacher_name) + '</p>' : '') +
        '<div class="cert-pie"><span>' + Z.fmtFecha(c.issued_at) + '</span><span class="cert-code">' + esc(c.code) + '</span></div>' +
        '<p class="cert-ver">Verificable en Zeiro con el código ' + esc(c.code) + '</p></div>' +
        '<div class="noprint" style="margin-top:14px;display:flex;gap:8px;justify-content:center">' +
        '<button class="btn" onclick="window.print()">' + ZI('print') + ' Imprimir</button>' +
        '<a class="btn sec" href="#/mis-logros">Volver</a></div></div>';
    });
  };

  /* ================= exportar agenda a .ics ================= */
  V.exportIcs = function () {
    api().myCourses().then(function (cursos) {
      var faltan = cursos.length, evs = [];
      if (!faltan) { Z.toast('Sin cursos', 'mal'); return; }
      cursos.forEach(function (c) {
        api().course(c.id).then(function (cc) {
          cc.modules.forEach(function (m) {
            if (m.due_date && m.visible) {
              var dt = m.due_date.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
              evs.push('BEGIN:VEVENT\nUID:' + m.id + '@zeiro\nDTSTART:' + dt + '\nDTEND:' + dt +
                '\nSUMMARY:[' + (cc.short_name || cc.name) + '] ' + m.title.replace(/\n/g, ' ') +
                '\nDESCRIPTION:Entrega en Zeiro\nEND:VEVENT');
            }
          });
          if (--faltan === 0) {
            var ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Zeiro//ES\n' + evs.join('\n') + '\nEND:VCALENDAR';
            var a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
            a.download = 'zeiro-agenda.ics'; a.click();
            Z.toast(evs.length + ' eventos exportados — importalo en Google Calendar', 'ok');
          }
        });
      });
    });
  };
})();

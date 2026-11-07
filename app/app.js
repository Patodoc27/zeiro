/* ZEIRO · Núcleo: shell, router y login. */
(function () {
  var Z = window.Z = window.Z || {};
  var esc = function (s) { return Z.esc ? Z.esc(s) : String(s == null ? '' : s); };

  Z.fmtFecha = function (iso, conHora) {
    if (!iso) return '—';
    var d = new Date(iso);
    var s = d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
    if (conHora) s += ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    return s;
  };
  Z.fmtFechaLarga = function (iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  Z.toast = function (msg, tipo) {
    var t = document.createElement('div');
    t.className = 'toast ' + (tipo || '');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  };

  Z.modal = function (html, grande) {
    var veil = document.createElement('div');
    veil.className = 'veil';
    veil.innerHTML = '<div class="modal' + (grande ? ' grande' : '') + '">' + html + '</div>';
    veil.addEventListener('click', function (e) { if (e.target === veil) veil.remove(); });
    document.body.appendChild(veil);
    return veil;
  };
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var veils = document.querySelectorAll('.veil');
      if (veils.length) veils[veils.length - 1].remove();
      var zp = document.querySelector('.zpanel');
      if (zp) zp.remove();
    }
  });

  /* timers globales: se cancelan al cambiar de pantalla */
  Z._timers = [];
  Z.regTimer = function (iv) { Z._timers.push(iv); return iv; };
  Z.clearTimers = function () { Z._timers.forEach(clearInterval); Z._timers = []; };

  /* markdown lite: **negrita**, *cursiva*, saltos de línea, listas con - */
  Z.md = function (txt) {
    /* markdown ligero: **b** *i* # h ## h ### h - lista > cita --- línea !img[]() [txt](url) */
    var t = esc(txt || '');
    t = t.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
         .replace(/\*([^*\n]+)\*/g, '<i>$1</i>')
         .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img class="md-img" src="$2" alt="$1" loading="lazy">')
         .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    var lineas = t.split('\n'), out = [], par = [];
    function flush() { if (par.length) { out.push('<p>' + par.join('<br>') + '</p>'); par = []; } }
    var i = 0;
    while (i < lineas.length) {
      var l = lineas[i];
      if (!l.trim()) { flush(); i++; continue; }
      if (/^#{1,3}\s/.test(l)) {
        flush();
        var n = l.match(/^#+/)[0].length;
        out.push('<h' + (n + 1) + ' class="md-h">' + l.replace(/^#+\s*/, '') + '</h' + (n + 1) + '>');
        i++; continue;
      }
      if (/^---+$/.test(l.trim())) { flush(); out.push('<hr class="md-hr">'); i++; continue; }
      if (/^\s*-\s+/.test(l)) {
        flush();
        var ul = [];
        while (i < lineas.length && /^\s*-\s+/.test(lineas[i])) { ul.push('<li>' + lineas[i].replace(/^\s*-\s+/, '') + '</li>'); i++; }
        out.push('<ul>' + ul.join('') + '</ul>');
        continue;
      }
      if (/^\s*(&gt;|>)\s?/.test(l)) {
        flush();
        var bq = [];
        while (i < lineas.length && /^\s*(&gt;|>)\s?/.test(lineas[i])) { bq.push(lineas[i].replace(/^\s*(&gt;|>)\s?/, '')); i++; }
        out.push('<blockquote>' + bq.join('<br>') + '</blockquote>');
        continue;
      }
      if (/^\s*\|.*\|\s*$/.test(l)) {
        flush();
        var filas = [];
        while (i < lineas.length && /^\s*\|.*\|\s*$/.test(lineas[i])) { filas.push(lineas[i]); i++; }
        var tab = '<table class="md-tab"><tbody>';
        filas.forEach(function (f, ix) {
          var celdas = f.replace(/^\s*\||\|\s*$/g, '').split('|');
          if (/^[\s\-:]+$/.test(celdas.join(''))) return;
          var tag = ix === 0 ? 'th' : 'td';
          tab += '<tr>' + celdas.map(function (c) { return '<' + tag + '>' + c.trim() + '</' + tag + '>'; }).join('') + '</tr>';
        });
        out.push(tab + '</tbody></table>');
        continue;
      }
      par.push(l); i++;
    }
    flush();
    return '<div class="md">' + out.join('') + '</div>';
  };
  Z.confirm = function (msg, onOk) {
    var v = Z.modal('<h2>¿Confirmar?</h2><p>' + esc(msg) + '</p>' +
      '<div class="fila" style="justify-content:flex-end;margin-top:16px">' +
      '<button class="btn sec" data-no>Cancelar</button><button class="btn pel" data-si>Eliminar</button></div>');
    v.querySelector('[data-no]').onclick = function () { v.remove(); };
    v.querySelector('[data-si]').onclick = function () { v.remove(); onOk(); };
  };

  /* ---------------- LOGIN ---------------- */
  function renderLogin() {
    var root = document.getElementById('root');
    var demo = Z.api.isDemo();
    root.innerHTML =
      '<div class="loginwrap"><div class="logincard">' +
      '<div class="loginlat"><img src="assets/logo-zeiro.png" alt="Zeiro" style="width:200px;display:block;margin-bottom:10px">' +
      '<h1 style="display:none">Zeiro</h1><p>' + esc(CONFIG.TAGLINE) + '. Materiales, tareas, cuestionarios y notas — simple para docentes y estudiantes.</p>' +
      '<div class="rayas"></div>' + Z_ZEBRA('saludo') + '</div>' +
      '<div class="loginform"><h2 style="margin-bottom:4px">Ingresar</h2>' +
      (demo
        ? '<p style="color:var(--neg-300);font-size:13px;margin-top:4px">Modo demostración — elegí un rol para recorrer la plataforma:</p>' +
          '<div style="margin-top:14px">' +
          '<button class="rolbtn" data-rol="u-admin">' + ZI('gear') + '<span>Dirección<small>Patricia Inés Castro — administra todo</small></span></button>' +
          '<button class="rolbtn" data-rol="u-bio">' + ZI('book') + '<span>Docente<small>Lucía Fernández — Biología 5°1°</small></span></button>' +
          '<button class="rolbtn" data-rol="u-e1">' + ZI('cap') + '<span>Estudiante<small>Martina Aguirre — ve materiales y rinde</small></span></button>' +
          '</div>' +
          '<p style="color:var(--neg-150);font-size:11.5px;margin-top:14px">Con Supabase configurado en app/config.js, acá aparece el login con email y contraseña.</p>'
        : '<label>Email</label><input type="email" id="l_email" autocomplete="username">' +
          '<label>Contraseña</label><input type="password" id="l_pass" autocomplete="current-password">' +
          '<button class="btn" id="l_go" style="width:100%;justify-content:center;margin-top:16px">Entrar</button>') +
      '</div></div></div>';
    if (demo) {
      root.querySelectorAll('.rolbtn').forEach(function (b) {
        b.onclick = function () {
          Z.api.loginDemo(b.getAttribute('data-rol')).then(function () { location.hash = '#/home'; render(); });
        };
      });
    } else {
      root.querySelector('#l_go').onclick = function () {
        Z.api.login(root.querySelector('#l_email').value.trim(), root.querySelector('#l_pass').value)
          .then(function () { location.hash = '#/home'; render(); })
          .catch(function () { Z.toast('Email o contraseña incorrectos', 'mal'); });
      };
    }
  }

  /* ---------------- SHELL ---------------- */
  var NAV = {
    estudiante: [['#/home', 'home', 'Inicio'], ['#/mis-cursos', 'book', 'Mis cursos'], ['#/pendientes', 'clock', 'Pendientes'], ['#/agenda', 'cal', 'Agenda'], ['#/comunicados', 'mega', 'Comunicados'], ['#/mensajes', 'send', 'Mensajes'], ['#/mis-notas', 'star', 'Mis notas'], ['#/mis-logros', 'award', 'Mis logros']],
    docente:    [['#/home', 'home', 'Inicio'], ['#/mis-cursos', 'book', 'Mis cursos'], ['#/agenda', 'cal', 'Agenda'], ['#/comunicados', 'mega', 'Comunicados'], ['#/mensajes', 'send', 'Mensajes']],
    admin:      [['#/home', 'home', 'Inicio'], ['#/mis-cursos', 'book', 'Cursos'], ['#/agenda', 'cal', 'Agenda'], ['#/comunicados', 'mega', 'Comunicados'], ['#/mensajes', 'send', 'Mensajes'], ['#/panel', 'cap', 'Estadísticas'], ['#/admin/usuarios', 'users', 'Usuarios'], ['#/admin/cursos', 'gear', 'Gestión']]
  };

  function shell(content, ruta) {
    var me = Z.api.me();
    var nav = NAV[me.role] || [];
    var root = document.getElementById('root');
    var iniciales = me.full_name.split(/[\s,]+/).filter(Boolean).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
    root.innerHTML =
      '<div class="shell"><aside class="side">' +
      '<div class="marca"><img src="assets/logo-mark.png" alt="" class="logo" style="object-fit:contain"><div><b>Zeiro</b><small>' + esc(CONFIG.TAGLINE) + '</small></div></div>' +
      '<nav>' + nav.map(function (n) {
        return '<a href="' + n[0] + '" class="' + (ruta === n[0] ? 'on' : '') + '">' + ZI(n[1]) + '<span>' + n[2] + '</span></a>';
      }).join('') + '</nav>' +
      '<div class="pie"><div class="quien"><div class="avatar">' + iniciales + '</div>' +
      '<div style="flex:1;min-width:0"><b>' + esc(me.full_name) + '</b><small>' + esc(me.role) + '</small></div>' +
      '<button class="iconbtn" id="z_salir" title="Salir" style="color:#B9B3DA">' + ZI('out') + '</button></div></div>' +
      '</aside><main class="main" id="z_main"></main>' +
      '<button class="zbell" id="z_bell" title="Notificaciones">' + ZI('bell') + '</button></div>';
    root.querySelector('#z_salir').onclick = function () {
      Z.api.logout().then(function () { location.hash = ''; render(); });
    };
    var bell = root.querySelector('#z_bell');
    Z.api.notifications().then(function (items) {
      if (items.length) bell.insertAdjacentHTML('beforeend', '<span class="nuevo">' + items.length + '</span>');
    });
    bell.onclick = function () {
      var viejo = document.querySelector('.zpanel');
      if (viejo) { viejo.remove(); return; }
      Z.api.notifications().then(function (items) {
        var p = document.createElement('div');
        p.className = 'zpanel';
        p.innerHTML = '<h4>Notificaciones</h4>' + (items.length ? items.map(function (n) {
          return '<a class="notif" href="' + n.hash + '"><span class="nico">' + ZI(n.icon) + '</span>' +
            '<span style="flex:1;min-width:0"><b>' + esc(n.titulo) + '</b><small>' + esc(n.extra || '') + '</small></span>' +
            '<span class="cuando">' + Z.fmtFecha(n.fecha) + '</span></a>';
        }).join('') : '<div class="vacio" style="padding:20px">' + Z_ZEBRA('pensar') + '<p>Nada nuevo por ahora.</p></div>');
        document.body.appendChild(p);
        p.querySelectorAll('a.notif').forEach(function (a) {
          a.addEventListener('click', function () { p.remove(); });
        });
        Z.api.markNotifsSeen();
        var dot = bell.querySelector('.nuevo');
        if (dot) dot.remove();
        setTimeout(function () {
          document.addEventListener('click', function cerrar(ev) {
            if (!p.contains(ev.target) && ev.target !== bell && !bell.contains(ev.target)) { p.remove(); document.removeEventListener('click', cerrar); }
          });
        }, 10);
      });
    };
    document.getElementById('z_main').innerHTML = content;
    return document.getElementById('z_main');
  }
  Z.shell = shell;

  /* ---------------- ROUTER ---------------- */
  function render() {
    var me = Z.api.me();
    var h = location.hash || '#/home';
    if (!me) { renderLogin(); return; }
    if (!Z.views) { setTimeout(render, 60); return; }
    Z.clearTimers();
    var viejo = document.querySelector('.zpanel');
    if (viejo) viejo.remove();

    var partes = h.replace(/^#\//, '').split('/');
    var v = Z.views;
    try {
      if (partes[0] === 'curso' && partes[2] === 'notas') v.notas(partes[1]);
      else if (partes[0] === 'curso' && partes[2] === 'asistencia') v.asistencia(partes[1]);
      else if (partes[0] === 'curso') v.curso(partes[1]);
      else if (partes[0] === 'modulo') v.modulo(partes[1]);
      else if (partes[0] === 'quiz') v.tomarQuiz(partes[1]);
      else if (partes[0] === 'prev-quiz') v.previsualizarQuiz(partes[1]);
      else if (partes[0] === 'correccion-quiz') v.corregirQuiz(partes[1]);
      else if (partes[0] === 'entrega') v.entrega(partes[1]);
      else if (partes[0] === 'corregir-entregas') v.corregirEntregas(partes[1]);
      else if (partes[0] === 'editor-quiz') v.editorQuiz(partes[1]);
      else if (partes[0] === 'foro') v.foro(partes[1]);
      else if (partes[0] === 'agenda') v.agenda();
      else if (partes[0] === 'comunicados') v.comunicados();
      else if (partes[0] === 'mis-cursos') v.misCursos();
      else if (partes[0] === 'mis-notas') v.misNotas();
      else if (partes[0] === 'mis-logros') v.misLogros();
      else if (partes[0] === 'mensajes') v.mensajes();
      else if (partes[0] === 'chat') v.chat(partes[1]);
      else if (partes[0] === 'pendientes') v.pendientes();
      else if (partes[0] === 'progreso') v.progreso(partes[1]);
      else if (partes[0] === 'flashcards') v.flashcards(partes[1]);
      else if (partes[0] === 'panel') v.panel();
      else if (partes[0] === 'cert') v.cert(partes[1]);
      else if (partes[0] === 'admin' && partes[1] === 'usuarios') v.adminUsuarios();
      else if (partes[0] === 'admin' && partes[1] === 'cursos') v.adminCursos();
      else v.home();
    } catch (err) {
      Z.shell('<div class="card vacio">' + Z_ZEBRA('pensar') +
        '<p>Ups, algo se trabó en esta pantalla.</p><a class="btn" href="#/home">Volver al inicio</a></div>', '#/home');
    }
  }

  window.addEventListener('hashchange', render);

  document.addEventListener('DOMContentLoaded', function () {
    Z.api.fetchMe().then(function (me) {
      if (!me) renderLogin();
      else if (!location.hash) { location.hash = '#/home'; render(); }
      else render();
    });
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () {});
  });
})();

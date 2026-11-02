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
      '<div class="loginlat">' + Z_LOGO +
      '<h1>Zeiro</h1><p>' + esc(CONFIG.TAGLINE) + '. Materiales, tareas, cuestionarios y notas — simple para docentes y estudiantes.</p>' +
      '<div class="rayas"></div></div>' +
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
    estudiante: [['#/home', 'home', 'Inicio'], ['#/mis-cursos', 'book', 'Mis cursos'], ['#/agenda', 'cal', 'Agenda'], ['#/comunicados', 'mega', 'Comunicados'], ['#/mis-notas', 'star', 'Mis notas']],
    docente:    [['#/home', 'home', 'Inicio'], ['#/mis-cursos', 'book', 'Mis cursos'], ['#/agenda', 'cal', 'Agenda'], ['#/comunicados', 'mega', 'Comunicados']],
    admin:      [['#/home', 'home', 'Inicio'], ['#/mis-cursos', 'book', 'Cursos'], ['#/agenda', 'cal', 'Agenda'], ['#/comunicados', 'mega', 'Comunicados'], ['#/admin/usuarios', 'users', 'Usuarios'], ['#/admin/cursos', 'gear', 'Gestión']]
  };

  function shell(content, ruta) {
    var me = Z.api.me();
    var nav = NAV[me.role] || [];
    var root = document.getElementById('root');
    var iniciales = me.full_name.split(/[\s,]+/).filter(Boolean).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
    root.innerHTML =
      '<div class="shell"><aside class="side">' +
      '<div class="marca">' + Z_LOGO + '<div><b>Zeiro</b><small>' + esc(CONFIG.TAGLINE) + '</small></div></div>' +
      '<nav>' + nav.map(function (n) {
        return '<a href="' + n[0] + '" class="' + (ruta === n[0] ? 'on' : '') + '">' + ZI(n[1]) + '<span>' + n[2] + '</span></a>';
      }).join('') + '</nav>' +
      '<div class="pie"><div class="quien"><div class="avatar">' + iniciales + '</div>' +
      '<div style="flex:1;min-width:0"><b>' + esc(me.full_name) + '</b><small>' + esc(me.role) + '</small></div>' +
      '<button class="iconbtn" id="z_salir" title="Salir" style="color:#B9B3DA">' + ZI('out') + '</button></div></div>' +
      '</aside><main class="main" id="z_main"></main></div>';
    root.querySelector('#z_salir').onclick = function () {
      Z.api.logout().then(function () { location.hash = ''; render(); });
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

    var partes = h.replace(/^#\//, '').split('/');
    var v = Z.views;
    if (partes[0] === 'curso' && partes[2] === 'notas') v.notas(partes[1]);
    else if (partes[0] === 'curso' && partes[2] === 'asistencia') v.curso(partes[1]);
    else if (partes[0] === 'curso') v.curso(partes[1]);
    else if (partes[0] === 'modulo') v.modulo(partes[1]);
    else if (partes[0] === 'quiz') v.tomarQuiz(partes[1]);
    else if (partes[0] === 'correccion-quiz') v.corregirQuiz(partes[1]);
    else if (partes[0] === 'entrega') v.entrega(partes[1]);
    else if (partes[0] === 'corregir-entregas') v.corregirEntregas(partes[1]);
    else if (partes[0] === 'editor-quiz') v.editorQuiz(partes[1]);
    else if (partes[0] === 'agenda') v.agenda();
    else if (partes[0] === 'comunicados') v.comunicados();
    else if (partes[0] === 'mis-cursos') v.misCursos();
    else if (partes[0] === 'mis-notas') v.misNotas();
    else if (partes[0] === 'admin' && partes[1] === 'usuarios') v.adminUsuarios();
    else if (partes[0] === 'admin' && partes[1] === 'cursos') v.adminCursos();
    else v.home();
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

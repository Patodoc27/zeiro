/* ================= Zeiro · voz (lectura en voz alta + dictado) ================= */
(function () {
  var synthOK = 'speechSynthesis' in window;
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var rec = null;
  var recBtn = null;

  function vozEs() {
    var vs = speechSynthesis.getVoices();
    var i;
    for (i = 0; i < vs.length; i++) if (/^es[-_]/i.test(vs[i].lang)) return vs[i];
    return vs[0];
  }
  if (synthOK) speechSynthesis.getVoices(); /* precargar lista */

  function pararLectura() {
    if (synthOK) speechSynthesis.cancel();
    document.querySelectorAll('.vozread.on').forEach(function (b) { b.classList.remove('on'); });
  }

  function hablar(texto, btn) {
    if (!synthOK) { if (window.Z && Z.toast) Z.toast('Tu navegador no lee en voz alta', 'mal'); return; }
    var estaba = btn && btn.classList.contains('on');
    pararLectura();
    if (estaba || !texto || !texto.trim()) return;
    var u = new SpeechSynthesisUtterance(texto);
    u.lang = 'es-AR';
    var v = vozEs();
    if (v) { u.voice = v; u.lang = v.lang; }
    u.rate = 1;
    if (btn) {
      btn.classList.add('on');
      u.onend = u.onerror = function () { btn.classList.remove('on'); };
    }
    speechSynthesis.speak(u);
  }

  function pararDictado() {
    if (rec) { try { rec.stop(); } catch (e) {} }
  }

  function dictar(ta, btn) {
    if (!SR) { if (window.Z && Z.toast) Z.toast('El dictado por voz funciona en Chrome/Edge', 'mal'); return; }
    if (rec) {
      if (recBtn === btn) { pararDictado(); return; }
      pararDictado();
    }
    rec = new SR();
    rec.lang = 'es-AR';
    rec.continuous = true;
    rec.interimResults = false;
    recBtn = btn;
    btn.classList.add('on');
    rec.onresult = function (e) {
      var t = '';
      for (var i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
      if (!t) return;
      var base = ta.value;
      ta.value = (base && !/\s$/.test(base) ? base + ' ' : base) + t.trim() + ' ';
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.dispatchEvent(new Event('change', { bubbles: true }));
    };
    rec.onend = rec.onerror = function () {
      if (recBtn) recBtn.classList.remove('on');
      rec = null; recBtn = null;
    };
    try { rec.start(); } catch (e) { rec = null; recBtn = null; btn.classList.remove('on'); }
  }

  /* ---- editor enriquecido: barra de formato que inserta markdown ---- */
  function insEnCursor(ta, antes, despues, relleno) {
    var s = ta.selectionStart != null ? ta.selectionStart : ta.value.length;
    var e = ta.selectionEnd != null ? ta.selectionEnd : s;
    var sel = ta.value.slice(s, e) || relleno || '';
    ta.value = ta.value.slice(0, s) + antes + sel + despues + ta.value.slice(e);
    var pos = s + antes.length + sel.length + despues.length;
    ta.focus();
    try { ta.setSelectionRange(pos, pos); } catch (err) {}
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function insLinea(ta, marca) {
    var s = ta.selectionStart != null ? ta.selectionStart : 0;
    var ini = ta.value.lastIndexOf('\n', s - 1) + 1;
    var tiene = ta.value.slice(ini, ini + marca.length) === marca;
    if (tiene) { ta.value = ta.value.slice(0, ini) + ta.value.slice(ini + marca.length); }
    else { ta.value = ta.value.slice(0, ini) + marca + ta.value.slice(ini); }
    ta.focus();
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function edAccion(ta, fmt, btn) {
    if (fmt === 'b') insEnCursor(ta, '**', '**', 'negrita');
    else if (fmt === 'i') insEnCursor(ta, '*', '*', 'cursiva');
    else if (fmt === 'h2') insLinea(ta, '## ');
    else if (fmt === 'h3') insLinea(ta, '### ');
    else if (fmt === 'ul') insLinea(ta, '- ');
    else if (fmt === 'quote') insLinea(ta, '> ');
    else if (fmt === 'hr') insEnCursor(ta, '\n---\n', '', '');
    else if (fmt === 'link') insEnCursor(ta, '[', '](https://)', 'texto del enlace');
    else if (fmt === 'table') insEnCursor(ta, '\n| Columna 1 | Columna 2 | Columna 3 |\n|---|---|---|\n|  |  |  |\n', '', '');
    else if (fmt === 'img') {
      var inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*';
      inp.onchange = function () {
        var f = inp.files[0];
        if (!f) return;
        if (f.size > 1500000) {
          if (window.Z && Z.toast) Z.toast('Imagen grande: pegá la URL como ![nombre](https://…)', 'mal');
          insEnCursor(ta, '![descripción](', ')', 'https://…');
          return;
        }
        var r = new FileReader();
        r.onload = function () { insEnCursor(ta, '![' + f.name.replace(/\.[a-z0-9]+$/i, '') + '](', ')', r.result); };
        r.readAsDataURL(f);
      };
      inp.click();
    }
  }
  var EDBAR = '<div class="edbar" role="toolbar">' +
    '<button type="button" class="edbtn" data-fmt="b" title="Negrita"><b>B</b></button>' +
    '<button type="button" class="edbtn" data-fmt="i" title="Cursiva"><i>I</i></button>' +
    '<span class="edsep"></span>' +
    '<button type="button" class="edbtn" data-fmt="h2" title="Título">H2</button>' +
    '<button type="button" class="edbtn" data-fmt="h3" title="Subtítulo">H3</button>' +
    '<span class="edsep"></span>' +
    '<button type="button" class="edbtn" data-fmt="ul" title="Lista con viñetas">• ≡</button>' +
    '<button type="button" class="edbtn" data-fmt="quote" title="Cita">❝</button>' +
    '<button type="button" class="edbtn" data-fmt="table" title="Tabla">▦</button>' +
    '<button type="button" class="edbtn" data-fmt="hr" title="Separador">—</button>' +
    '<span class="edsep"></span>' +
    '<button type="button" class="edbtn" data-fmt="img" title="Imagen">IMG</button>' +
    '<button type="button" class="edbtn" data-fmt="link" title="Enlace">' + ZI('link') + '</button>' +
    '</div>';

  /* API: Z.voz.readBtn(selector) · Z.voz.wrap(htmlDelTextarea) */
  window.Z = window.Z || {};
  Z.voz = {
    readBtn: function (sel) {
      if (!synthOK) return '';
      return '<button type="button" class="vozread" data-read="' + sel + '" title="Escuchar en voz alta">' + ZI('speaker') + '</button>';
    },
    wrap: function (html) {
      return '<div class="vozwrap">' + EDBAR + html +
        (SR ? '<button type="button" class="vozmic" title="Dictar por voz">' + ZI('mic') + '</button>' : '') +
        '</div>';
    }
  };

  document.addEventListener('click', function (e) {
    var rb = e.target.closest ? e.target.closest('.vozread') : null;
    if (rb) {
      var sel = rb.getAttribute('data-read');
      var nodo = sel ? document.querySelector(sel) : null;
      var texto = nodo ? (nodo.innerText || nodo.textContent || '') : (rb.getAttribute('data-text') || '');
      hablar(texto, rb);
      return;
    }
    var mb = e.target.closest ? e.target.closest('.vozmic') : null;
    if (mb) {
      var w = mb.parentNode;
      var ta = w ? w.querySelector('textarea,input[type=text]') : null;
      if (ta) dictar(ta, mb);
      return;
    }
    var eb = e.target.closest ? e.target.closest('.edbtn') : null;
    if (eb) {
      var wr = eb.closest('.vozwrap');
      var ta2 = wr ? wr.querySelector('textarea,input[type=text]') : null;
      if (ta2) edAccion(ta2, eb.getAttribute('data-fmt'), eb);
    }
  });
})();

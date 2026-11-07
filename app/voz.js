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

  /* API: Z.voz.readBtn(selector) · Z.voz.wrap(htmlDelTextarea) */
  window.Z = window.Z || {};
  Z.voz = {
    readBtn: function (sel) {
      if (!synthOK) return '';
      return '<button type="button" class="vozread" data-read="' + sel + '" title="Escuchar en voz alta">' + ZI('speaker') + '</button>';
    },
    wrap: function (html) {
      if (!SR) return html;
      return '<div class="vozwrap">' + html +
        '<button type="button" class="vozmic" title="Dictar por voz">' + ZI('mic') + '</button></div>';
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
    }
  });
})();

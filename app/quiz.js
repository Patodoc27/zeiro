/* ZEIRO · Cuestionarios: render de preguntas (alumno), revisión y editor (docente).
   Tipos: mcq (single/multi), tf, short, match, essay. */
(function () {
  window.Z = window.Z || {};
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };
  Z.esc = esc;

  var TIPOS = [
    ['mcq', 'Opción múltiple'], ['tf', 'Verdadero / Falso'], ['short', 'Respuesta corta'],
    ['match', 'Emparejar'], ['essay', 'Desarrollo (manual)']
  ];

  /* ---------- render para responder ---------- */
  function renderQ(q, idx) {
    var h = '<div class="preg" data-qid="' + q.id + '" data-type="' + q.type + '">';
    h += '<div class="enun">' + (idx + 1) + '. ' + esc(q.prompt) + '<span class="pts">' + q.points + ' pts</span></div>';
    var p = q.payload || {};
    if (q.type === 'mcq') {
      var multi = !!p.multiple;
      (p.choices || []).forEach(function (c, i) {
        h += '<label class="opc" data-i="' + i + '"><input type="' + (multi ? 'checkbox' : 'radio') +
          '" name="q_' + q.id + '" value="' + i + '" style="width:auto"> <span>' + esc(c) + '</span></label>';
      });
      if (multi) h += '<div style="font-size:12px;color:var(--neg-300)">Podés marcar varias.</div>';
    } else if (q.type === 'tf') {
      h += '<label class="opc" data-i="1"><input type="radio" name="q_' + q.id + '" value="true" style="width:auto"> <span>Verdadero</span></label>';
      h += '<label class="opc" data-i="0"><input type="radio" name="q_' + q.id + '" value="false" style="width:auto"> <span>Falso</span></label>';
    } else if (q.type === 'short') {
      h += '<input type="text" data-short="1" placeholder="Tu respuesta…" autocomplete="off">';
    } else if (q.type === 'match') {
      var R = (p.right || []).slice();
      (p.left || []).forEach(function (l, i) {
        h += '<div class="par-match"><div style="font-weight:600">' + esc(l) + '</div>' +
          '<select data-left="' + esc(l) + '"><option value="">— elegí —</option>' +
          R.map(function (r) { return '<option>' + esc(r) + '</option>'; }).join('') + '</select></div>';
      });
    } else if (q.type === 'essay') {
      h += '<textarea data-essay="1" placeholder="Escribí tu desarrollo…"></textarea>';
    }
    return h + '</div>';
  }

  function collect(container, questions) {
    var answers = {};
    questions.forEach(function (q) {
      var node = container.querySelector('[data-qid="' + q.id + '"]');
      if (!node) return;
      if (q.type === 'mcq') {
        var vals = [];
        node.querySelectorAll('input:checked').forEach(function (i) { vals.push(Number(i.value)); });
        if (vals.length) answers[q.id] = vals;
      } else if (q.type === 'tf') {
        var c = node.querySelector('input:checked');
        if (c) answers[q.id] = c.value === 'true';
      } else if (q.type === 'short') {
        var t = node.querySelector('[data-short]');
        if (t && t.value.trim()) answers[q.id] = t.value.trim();
      } else if (q.type === 'match') {
        var m = {};
        node.querySelectorAll('select[data-left]').forEach(function (s) {
          if (s.value) m[s.getAttribute('data-left')] = s.value;
        });
        if (Object.keys(m).length) answers[q.id] = m;
      } else if (q.type === 'essay') {
        var tx = node.querySelector('[data-essay]');
        if (tx && tx.value.trim()) answers[q.id] = tx.value.trim();
      }
    });
    return answers;
  }

  /* ---------- revisión (alumno ve su corrección) ---------- */
  function renderReview(q, ans, pts) {
    var p = q.payload || {};
    var h = '<div class="preg"><div class="enun">' + esc(q.prompt) + '<span class="pts">' + q.points + ' pts</span></div>';
    if (q.type === 'mcq') {
      var got = Array.isArray(ans) ? ans : (ans === undefined ? [] : [ans]);
      (p.choices || []).forEach(function (c, i) {
        var isC = (p.correct || []).indexOf(i) >= 0;
        var isG = got.indexOf(i) >= 0;
        var cls = isC ? ' bien' : (isG ? ' mal' : '');
        h += '<div class="opc' + cls + '" style="cursor:default"><span>' + esc(c) + '</span>' +
          (isC ? ' <b style="margin-left:auto;color:var(--tur-700)">✓</b>' : (isG ? ' <b style="margin-left:auto;color:var(--malo)">✗</b>' : '')) + '</div>';
      });
    } else if (q.type === 'tf') {
      ['true', 'false'].forEach(function (v) {
        var val = v === 'true';
        var isC = p.correct === val, isG = ans === val;
        h += '<div class="opc' + (isC ? ' bien' : (isG ? ' mal' : '')) + '" style="cursor:default"><span>' + (val ? 'Verdadero' : 'Falso') + '</span></div>';
      });
    } else if (q.type === 'short') {
      h += '<p><b>Tu respuesta:</b> ' + esc(ans || '—') + '</p><p><b>Aceptadas:</b> ' + esc((p.accepted || []).join(' · ')) + '</p>';
    } else if (q.type === 'match') {
      (p.left || []).forEach(function (l, i) {
        var ok = ans && ans[l] === p.right[i];
        h += '<div class="par-match"><div><b>' + esc(l) + '</b> → ' + esc(ans && ans[l] ? ans[l] : '—') + '</div>' +
          '<div style="color:' + (ok ? 'var(--tur-700)' : 'var(--malo)') + ';font-weight:700">' + (ok ? '✓' : 'era: ' + esc(p.right[i])) + '</div></div>';
      });
    } else {
      h += '<p><b>Tu respuesta:</b></p><div class="card" style="box-shadow:none">' + esc(ans || '—') + '</div>' +
        (pts != null
          ? '<p style="font-weight:700;color:var(--tur-700);font-size:13px;margin-top:8px">Puntaje: ' + pts + ' / ' + q.points + ' pts</p>'
          : '<p style="color:var(--neg-300);font-size:12.5px">La corrige la docente.</p>');
    }
    return h + '</div>';
  }

  /* ---------- editor de una pregunta ---------- */
  var QN = 0; // ids únicos para radio groups de preguntas nuevas
  function editorQ(q) {
    q = q || { type: 'mcq', prompt: '', points: 1, payload: { choices: ['', ''], correct: [0] } };
    var p = q.payload || {};
    var radioname = 'corr_' + (q.id || ('n' + (++QN)));
    var h = '<div class="qedit" data-qid="' + (q.id || '') + '">';
    h += '<div class="entre"><div class="tipo-sel" style="margin:0">' + TIPOS.map(function (t) {
      return '<button type="button" data-tipo="' + t[0] + '" class="' + (q.type === t[0] ? 'on' : '') + '">' + t[1] + '</button>';
    }).join('') + '</div>' +
      '<button type="button" class="iconbtn" data-delq title="Borrar pregunta">' + ZI('trash') + '</button></div>';
    h += '<label>Enunciado</label><input type="text" data-prompt value="' + esc(q.prompt) + '" placeholder="Escribí la pregunta">';
    h += '<div class="fila" style="margin-top:8px"><div style="width:110px"><label style="margin-top:0">Puntos</label>' +
      '<input type="number" data-points min="0.5" step="0.5" value="' + (q.points || 1) + '"></div>';

    if (q.type === 'mcq') {
      h += '<div style="flex:1"><label style="margin-top:0"><input type="checkbox" data-multiple ' + (p.multiple ? 'checked' : '') + ' style="width:auto"> varias correctas</label></div></div>';
      h += '<label>Opciones (marcá la/s correcta/s)</label><div data-choices>';
      (p.choices || []).forEach(function (c, i) {
        h += '<div class="fila" style="margin-bottom:6px"><input type="' + (p.multiple ? 'checkbox' : 'radio') + '" name="' + radioname + '" data-corr value="' + i + '" ' +
          ((p.correct || []).indexOf(i) >= 0 ? 'checked' : '') + ' style="width:auto">' +
          '<input type="text" data-choice value="' + esc(c) + '" placeholder="Opción ' + (i + 1) + '">' +
          '<button type="button" class="iconbtn" data-delchoice>' + ZI('x') + '</button></div>';
      });
      h += '</div><button type="button" class="btn sec sm" data-addchoice>' + ZI('plus') + ' Opción</button>';
    } else if (q.type === 'tf') {
      h += '</div><label>Respuesta correcta</label><select data-tfcorr><option value="true"' + (p.correct === true ? ' selected' : '') + '>Verdadero</option><option value="false"' + (p.correct === false ? ' selected' : '') + '>Falso</option></select>';
    } else if (q.type === 'short') {
      h += '<div style="flex:1"><label style="margin-top:0"><input type="checkbox" data-casesens ' + (p.case_sensitive ? 'checked' : '') + ' style="width:auto"> distinguir mayúsculas</label></div></div>';
      h += '<label>Respuestas aceptadas (una por línea)</label><textarea data-accepted style="min-height:60px">' + esc((p.accepted || []).join('\n')) + '</textarea>';
    } else if (q.type === 'match') {
      h += '</div><label>Pares (izquierda → derecha correcta)</label><div data-pairs>';
      var L = p.left || [], R = p.right || [];
      var n = Math.max(L.length, 2);
      for (var i = 0; i < n; i++) {
        h += '<div class="fila" style="margin-bottom:6px"><input type="text" data-pl value="' + esc(L[i] || '') + '" placeholder="Concepto">' +
          '<input type="text" data-pr value="' + esc(R[i] || '') + '" placeholder="Coincide con…">' +
          '<button type="button" class="iconbtn" data-delpair>' + ZI('x') + '</button></div>';
      }
      h += '</div><button type="button" class="btn sec sm" data-addpair>' + ZI('plus') + ' Par</button>';
    } else {
      h += '<div style="flex:1;color:var(--neg-300);font-size:12.5px;align-self:end">Se corrige a mano desde la planilla de intentos.</div></div>';
    }
    return h + '</div>';
  }

  function collectQ(node, moduleId) {
    var tipo = node.querySelector('.tipo-sel button.on').getAttribute('data-tipo');
    var q = {
      id: node.getAttribute('data-qid') || null,
      module_id: moduleId,
      type: tipo,
      prompt: node.querySelector('[data-prompt]').value.trim(),
      points: Number(node.querySelector('[data-points]').value) || 1,
      payload: {}
    };
    if (tipo === 'mcq') {
      var choices = [], correct = [];
      node.querySelectorAll('[data-choices] .fila').forEach(function (f, i) {
        choices.push(f.querySelector('[data-choice]').value);
        if (f.querySelector('[data-corr]').checked) correct.push(i);
      });
      q.payload = { choices: choices, correct: correct, multiple: !!node.querySelector('[data-multiple]').checked };
    } else if (tipo === 'tf') {
      q.payload = { correct: node.querySelector('[data-tfcorr]').value === 'true' };
    } else if (tipo === 'short') {
      q.payload = {
        accepted: node.querySelector('[data-accepted]').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean),
        case_sensitive: !!node.querySelector('[data-casesens]').checked
      };
    } else if (tipo === 'match') {
      var L = [], R = [];
      node.querySelectorAll('[data-pairs] .fila').forEach(function (f) {
        var l = f.querySelector('[data-pl]').value.trim(), r = f.querySelector('[data-pr]').value.trim();
        if (l && r) { L.push(l); R.push(r); }
      });
      q.payload = { left: L, right: R };
    }
    return q;
  }

  Z.quiz = { renderQ: renderQ, collect: collect, renderReview: renderReview, editorQ: editorQ, collectQ: collectQ, TIPOS: TIPOS };
})();

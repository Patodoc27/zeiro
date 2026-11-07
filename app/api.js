/* ZEIRO · Capa de datos.
   Una sola interfaz (Z.api) con dos backends:
   - DEMO: JSON en localStorage (sin servidor; ideal para probar).
   - SUPABASE: Postgres + Auth vía supabase-js cuando CONFIG está completo.
   Todos los métodos devuelven Promesas. */
(function () {
  var LS = 'zeiro_demo_v1';
  var sb = null;
  var me = null; // perfil actual

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function now() { return new Date().toISOString(); }

  /* ---------------- DEMO STORE ---------------- */
  function load() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(LS)); } catch (e) { d = null; }
    if (!d || !d.meta) { d = clone(window.Z_DEMO_SEED); save(d); }
    // tablas agregadas en v2: garantizar que existan en stores viejos
    ['forum_posts', 'bank', 'attendance', 'messages', 'poll_votes', 'xp_log', 'flashcards', 'flash_reviews', 'certificates'].forEach(function (t) {
      if (!d[t]) { d[t] = clone(window.Z_DEMO_SEED[t] || []); save(d); }
    });
    return d;
  }
  function save(d) { localStorage.setItem(LS, JSON.stringify(d)); }
  function uid(d, p) { d.meta.seq++; return (p || 'x') + '-' + d.meta.seq; }
  function find(d, t, id) {
    var arr = d[t] || [];
    for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i];
    return null;
  }
  function stripAnswers(questions) {
    return questions.map(function (q) {
      var p = {};
      if (q.type === 'mcq') p = { choices: q.payload.choices, multiple: !!q.payload.multiple };
      else if (q.type === 'match') p = { left: q.payload.left, right: q.payload.right };
      else if (q.type === 'short') p = { case_sensitive: !!q.payload.case_sensitive };
      return { id: q.id, type: q.type, prompt: q.prompt, points: q.points, payload: p, position: q.position };
    });
  }

  /* XP: puntos por acción del estudiante (demo) */
  function addXp(d, studentId, pts, motivo) {
    d.xp_log.push({ id: 'xp' + Date.now() + Math.floor(Math.random() * 999), student_id: studentId, pts: pts, motivo: motivo, created_at: now() });
  }
  /* Corrección automática de un intento (compartida por demo y supabase). */
  function gradeAnswers(questions, answers) {
    var score = 0, max = 0, review = false;
    questions.forEach(function (q) {
      max += q.points;
      var a = answers[q.id];
      if (a === undefined || a === null || a === '') return;
      var p = q.payload || {};
      if (q.type === 'mcq') {
        var corr = (p.correct || []).slice().sort().join(',');
        var got = (Array.isArray(a) ? a : [a]).slice().sort().join(',');
        if (corr === got) score += q.points;
        else {
          // puntaje parcial en múltiples correctas: aciertos - errores
          var ok = 0, bad = 0;
          (Array.isArray(a) ? a : [a]).forEach(function (x) {
            if ((p.correct || []).indexOf(x) >= 0) ok++; else bad++;
          });
          var part = (ok - bad) / Math.max(1, (p.correct || []).length);
          if (part > 0) score += Math.round(q.points * part * 10) / 10;
        }
      } else if (q.type === 'tf') {
        if (a === p.correct) score += q.points;
      } else if (q.type === 'short') {
        var acc = p.accepted || [];
        var norm = function (s) {
          s = String(s).trim().toLowerCase();
          return p.case_sensitive ? String(s).trim() : s;
        };
        for (var i = 0; i < acc.length; i++) if (norm(acc[i]) === norm(a)) { score += q.points; break; }
      } else if (q.type === 'match') {
        var L = p.left || [], R = p.right || [];
        var good = 0;
        L.forEach(function (l, i) { if (a && a[l] === R[i]) good++; });
        if (L.length) score += Math.round(q.points * (good / L.length) * 10) / 10;
      } else if (q.type === 'essay') {
        review = true; // la corrige la docente
      }
    });
    return { score: Math.round(score * 10) / 10, max: max, needs_review: review };
  }
  window.Z_grade = gradeAnswers; // la reutiliza el revisor docente

  /* ---------------- SUPABASE ---------------- */
  function supa() {
    if (!sb && window.supabase && CONFIG.SUPABASE_URL) {
      sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    }
    return sb;
  }

  var useDemo = !CONFIG.SUPABASE_URL;

  var api = {
    isDemo: function () { return useDemo; },
    me: function () { return me; },

    /* ---------- sesión ---------- */
    /* estudiante efectivo: el hijo cuando entra la familia */
    sid: function () { return me && me.hijo_id ? me.hijo_id : (me ? me.id : null); },

    loginDemo: function (roleOrId) {
      var d = load();
      var p = find(d, 'profiles', roleOrId);
      if (!p) {
        var role = roleOrId;
        for (var i = 0; i < d.profiles.length; i++) {
          if (d.profiles[i].role === role) { p = d.profiles[i]; break; }
        }
      }
      me = clone(p);
      localStorage.setItem('zeiro_me', JSON.stringify(me));
      return Promise.resolve(me);
    },
    login: function (email, pass) {
      if (useDemo) return api.loginDemo(email);
      return supa().auth.signInWithPassword({ email: email, password: pass }).then(function (r) {
        if (r.error) throw r.error;
        return api.fetchMe();
      });
    },
    fetchMe: function () {
      var cached = null;
      try { cached = JSON.parse(localStorage.getItem('zeiro_me')); } catch (e) {}
      if (useDemo) { me = cached; return Promise.resolve(me); }
      return supa().auth.getUser().then(function (r) {
        if (!r.data.user) { me = null; return null; }
        return supa().from('profiles').select('*').eq('id', r.data.user.id).single()
          .then(function (pr) { me = pr.data; return me; });
      });
    },
    logout: function () {
      me = null; localStorage.removeItem('zeiro_me');
      if (!useDemo) return supa().auth.signOut();
      return Promise.resolve();
    },

    /* ---------- lecturas base ---------- */
    users: function (role) {
      if (useDemo) {
        var d = load();
        return Promise.resolve(d.profiles.filter(function (p) { return !role || p.role === role; }));
      }
      var q = supa().from('profiles').select('*').order('full_name');
      if (role) q = q.eq('role', role);
      return q.then(function (r) { return r.data || []; });
    },
    myCourses: function () {
      if (useDemo) {
        var d = load();
        var list = d.courses.filter(function (c) {
          if (me.role === 'admin') return true;
          if (me.role === 'docente') return c.teacher_id === me.id;
          return d.enrollments.some(function (e) { return e.course_id === c.id && e.student_id === api.sid(); });
        });
        return Promise.resolve(clone(list));
      }
      return supa().from('courses').select('*').order('name')
        .then(function (r) { return r.data || []; }); // RLS ya filtra por rol
    },
    course: function (id) {
      if (useDemo) {
        var d = load();
        var c = find(d, 'courses', id);
        if (!c) return Promise.resolve(null);
        var secs = d.sections.filter(function (s) { return s.course_id === id; }).sort(function (a, b) { return a.position - b.position; });
        var mods = d.modules.filter(function (m) { return m.course_id === id; }).sort(function (a, b) { return a.position - b.position; });
        var roster = d.enrollments.filter(function (e) { return e.course_id === id; }).map(function (e) {
          return find(d, 'profiles', e.student_id);
        });
        var out = clone(c);
        out.sections = secs; out.modules = mods; out.students = roster;
        out.teacher = find(d, 'profiles', c.teacher_id);
        return Promise.resolve(out);
      }
      return Promise.all([
        supa().from('courses').select('*, teacher:teacher_id(full_name)').eq('id', id).single(),
        supa().from('sections').select('*').eq('course_id', id).order('position'),
        supa().from('modules').select('*').eq('course_id', id).order('position'),
        supa().from('enrollments').select('student:student_id(id,full_name,email)').eq('course_id', id)
      ]).then(function (rs) {
        var c = rs[0].data; if (!c) return null;
        c.sections = rs[1].data || [];
        c.modules = rs[2].data || [];
        c.students = (rs[3].data || []).map(function (e) { return e.student; });
        return c;
      });
    },

    /* ---------- estructura (docente) ---------- */
    saveSection: function (courseId, sec) {
      if (useDemo) {
        var d = load();
        var s = sec.id ? find(d, 'sections', sec.id) : null;
        if (!s) { s = { id: uid(d, 's'), course_id: courseId, position: d.sections.filter(function (x) { return x.course_id === courseId; }).length + 1 }; d.sections.push(s); }
        ['title', 'color', 'img'].forEach(function (k) { if (sec[k] !== undefined) s[k] = sec[k]; });
        save(d); return Promise.resolve(clone(s));
      }
      var row = { course_id: courseId, title: sec.title };
      if (sec.id) row.id = sec.id;
      ['color', 'img'].forEach(function (k) { if (sec[k] !== undefined) row[k] = sec[k]; });
      return supa().from('sections').upsert(row).select().single().then(function (r) { return r.data; });
    },
    deleteSection: function (id) {
      if (useDemo) {
        var d = load();
        d.sections = d.sections.filter(function (s) { return s.id !== id; });
        d.modules = d.modules.filter(function (m) { return m.section_id !== id; });
        save(d); return Promise.resolve();
      }
      return supa().from('sections').delete().eq('id', id);
    },
    saveModule: function (courseId, m) {
      if (useDemo) {
        var d = load();
        var row = m.id ? find(d, 'modules', m.id) : null;
        if (!row) {
          row = { id: uid(d, 'm'), course_id: courseId, created_at: now(),
                  position: d.modules.filter(function (x) { return x.course_id === courseId; }).length + 1 };
          d.modules.push(row);
        }
        ['section_id', 'type', 'title', 'content', 'visible', 'due_date', 'available_from', 'available_until'].forEach(function (k) {
          if (m[k] !== undefined) row[k] = m[k];
        });
        save(d); return Promise.resolve(clone(row));
      }
      var row2 = { course_id: courseId };
      ['id', 'section_id', 'type', 'title', 'content', 'visible', 'due_date', 'available_from', 'available_until'].forEach(function (k) {
        if (m[k] !== undefined) row2[k] = m[k];
      });
      return supa().from('modules').upsert(row2).select().single().then(function (r) { return r.data; });
    },
    /* aviso por email a los estudiantes inscriptos cuando se publica material.
       En demo queda registrado en email_log (ver "Emails enviados" en Gestionar);
       con Supabase se conecta un proveedor real (EmailJS/Resend, gratis). */
    notifyMaterial: function (courseId, titulo, tipoNombre, hash) {
      var enviar = function (d) {
        var cc = find(d, 'courses', courseId);
        var alumnos = (d.enrollments || []).filter(function (e) { return e.course_id === courseId; });
        var n = 0;
        alumnos.forEach(function (e) {
          var st = find(d, 'profiles', e.student_id);
          if (!st) return;
          n++;
          d.email_log = d.email_log || [];
          d.email_log.push({
            id: uid(d, 'mail'), course_id: courseId, to_email: st.email || (st.id + '@zeiro.demo'),
            to_name: st.full_name, subject: 'Nuevo material en ' + (cc ? (cc.short_name || cc.name) : 'tu aula'),
            body: 'Hola ' + st.full_name + ': el docente publicó "' + titulo + '" (' + tipoNombre + ') en ' + (cc ? cc.name : 'el aula') + '. Ingresá a Zeiro para verlo.',
            at: now()
          });
          d.notifs = d.notifs || [];
          d.notifs.push({ user_id: e.student_id, icon: 'mail', titulo: 'Nuevo ' + tipoNombre + ': ' + titulo,
            extra: cc ? (cc.short_name || cc.name) : '', hash: hash || '#/mis-cursos', fecha: now() });
        });
        save(d);
        return n;
      };
      if (useDemo) { var d = load(); return Promise.resolve(enviar(d)); }
      /* Supabase: insert en tabla email_log + notifs; el envío real lo hace
         una Edge Function o EmailJS con las mismas filas. */
      return Promise.resolve(0);
    },
    emailLog: function (courseId) {
      if (useDemo) {
        var d = load();
        return Promise.resolve((d.email_log || []).filter(function (x) { return !courseId || x.course_id === courseId; })
          .sort(function (a, b) { return a.at < b.at ? 1 : -1; }).slice(0, 30));
      }
      return Promise.resolve([]);
    },
    deleteModule: function (id) {
      if (useDemo) {
        var d = load();
        d.modules = d.modules.filter(function (m) { return m.id !== id; });
        d.questions = d.questions.filter(function (q) { return q.module_id !== id; });
        d.forum_posts = d.forum_posts.filter(function (p) { return p.module_id !== id; });
        save(d); return Promise.resolve();
      }
      return supa().from('modules').delete().eq('id', id);
    },
    moveModule: function (id, dir) { // dir: -1 sube, +1 baja dentro de su sección
      if (useDemo) {
        var d = load();
        var m = find(d, 'modules', id);
        var sibs = d.modules.filter(function (x) { return x.section_id === m.section_id; })
          .sort(function (a, b) { return a.position - b.position; });
        var i = sibs.indexOf(m), j = i + dir;
        if (j < 0 || j >= sibs.length) return Promise.resolve();
        var tmp = sibs[i].position; sibs[i].position = sibs[j].position; sibs[j].position = tmp;
        save(d); return Promise.resolve();
      }
      return supa().from('modules').select('id,section_id,position').eq('id', id).single().then(function (r) {
        var m = r.data; if (!m) return;
        return supa().from('modules').select('id,position').eq('section_id', m.section_id).order('position')
          .then(function (rs) {
            var sibs = rs.data || [];
            var i = -1;
            sibs.forEach(function (x, ix) { if (x.id === id) i = ix; });
            var j = i + dir;
            if (i < 0 || j < 0 || j >= sibs.length) return;
            return Promise.all([
              supa().from('modules').update({ position: sibs[j].position }).eq('id', sibs[i].id),
              supa().from('modules').update({ position: sibs[i].position }).eq('id', sibs[j].id)
            ]);
          });
      });
    },
    duplicateCourse: function (courseId, newName) {
      if (useDemo) {
        var d = load();
        var src = find(d, 'courses', courseId);
        var nc = clone(src);
        nc.id = uid(d, 'c'); nc.name = newName || (src.name + ' (copia)');
        nc.created_at = now(); d.courses.push(nc);
        var secMap = {};
        d.sections.filter(function (s) { return s.course_id === courseId; }).forEach(function (s) {
          var ns = clone(s); ns.id = uid(d, 's'); ns.course_id = nc.id;
          secMap[s.id] = ns.id; d.sections.push(ns);
        });
        var modMap = {};
        d.modules.filter(function (m) { return m.course_id === courseId; }).forEach(function (m) {
          var nm = clone(m); var oldId = nm.id;
          nm.id = uid(d, 'm'); nm.course_id = nc.id; nm.section_id = secMap[m.section_id] || null;
          modMap[oldId] = nm.id; d.modules.push(nm);
        });
        d.questions.filter(function (q) { return modMap[q.module_id]; }).forEach(function (q) {
          var nq = clone(q); nq.id = uid(d, 'q'); nq.module_id = modMap[q.module_id];
          d.questions.push(nq);
        });
        d.forum_posts.filter(function (p) { return modMap[p.module_id]; }).forEach(function (p) {
          var np = clone(p); np.id = uid(d, 'fp'); np.module_id = modMap[p.module_id];
          d.forum_posts.push(np);
        });
        d.bank.filter(function (q) { return q.course_id === courseId; }).forEach(function (q) {
          var nq = clone(q); nq.id = uid(d, 'bk'); nq.course_id = nc.id; d.bank.push(nq);
        });
        d.enrollments.filter(function (e) { return e.course_id === courseId; }).forEach(function (e) {
          var ne = clone(e); ne.id = uid(d, 'en'); ne.course_id = nc.id; d.enrollments.push(ne);
        });
        save(d); return Promise.resolve(nc);
      }
      return Promise.reject(new Error('Duplicar desde la app web (TODO backend)'));
    },

    /* ---------- preguntas ---------- */
    questions: function (moduleId, forStudent) {
      if (useDemo) {
        var d = load();
        var qs = d.questions.filter(function (q) { return q.module_id === moduleId; })
          .sort(function (a, b) { return a.position - b.position; });
        return Promise.resolve(forStudent ? stripAnswers(clone(qs)) : clone(qs));
      }
      if (forStudent) {
        return supa().rpc('quiz_questions', { mid: moduleId }).then(function (r) { return r.data || []; });
      }
      return supa().from('questions').select('*').eq('module_id', moduleId).order('position')
        .then(function (r) { return r.data || []; });
    },
    saveQuestion: function (q) {
      if (useDemo) {
        var d = load();
        var row = q.id ? find(d, 'questions', q.id) : null;
        if (!row) {
          row = { id: uid(d, 'q'), position: d.questions.filter(function (x) { return x.module_id === q.module_id; }).length + 1 };
          d.questions.push(row);
        }
        ['module_id', 'type', 'prompt', 'points', 'payload'].forEach(function (k) {
          if (q[k] !== undefined) row[k] = q[k];
        });
        save(d); return Promise.resolve(clone(row));
      }
      var row2 = {};
      ['id', 'module_id', 'type', 'prompt', 'points', 'payload'].forEach(function (k) {
        if (q[k] !== undefined) row2[k] = q[k];
      });
      return supa().from('questions').upsert(row2).select().single().then(function (r) { return r.data; });
    },
    deleteQuestion: function (id) {
      if (useDemo) {
        var d = load();
        d.questions = d.questions.filter(function (q) { return q.id !== id; });
        save(d); return Promise.resolve();
      }
      return supa().from('questions').delete().eq('id', id);
    },

    /* ---------- intentos ---------- */
    myAttempts: function (moduleId) {
      if (useDemo) {
        var d = load();
        return Promise.resolve(d.quiz_attempts.filter(function (a) {
          return a.module_id === moduleId && a.student_id === me.id;
        }).sort(function (a, b) { return a.started_at < b.started_at ? 1 : -1; }));
      }
      return supa().from('quiz_attempts').select('*').eq('module_id', moduleId)
        .eq('student_id', me.id).order('started_at', { ascending: false })
        .then(function (r) { return r.data || []; });
    },
    attemptsOf: function (moduleId) { // docente
      if (useDemo) {
        var d = load();
        return Promise.resolve(d.quiz_attempts.filter(function (a) { return a.module_id === moduleId; }).map(function (a) {
          a = clone(a); var s = find(d, 'profiles', a.student_id);
          a.student_name = s ? s.full_name : '?'; return a;
        }));
      }
      return supa().from('quiz_attempts').select('*, student:student_id(full_name)')
        .eq('module_id', moduleId).then(function (r) {
          return (r.data || []).map(function (a) { a.student_name = a.student && a.student.full_name; return a; });
        });
    },
    submitAttempt: function (moduleId, answers) {
      if (useDemo) {
        var d = load();
        var qs = d.questions.filter(function (q) { return q.module_id === moduleId; });
        var g = gradeAnswers(qs, answers);
        var m = find(d, 'modules', moduleId);
        var maxG = (m.content && m.content.max_grade) || 10;
        var a = {
          id: uid(d, 'a'), module_id: moduleId, student_id: me.id,
          started_at: now(), finished_at: now(), answers: answers,
          score: g.score, max_score: g.max, needs_review: g.needs_review,
          auto_score: g.score, essay_scores: {},
          status: g.needs_review ? 'submitted' : 'graded'
        };
        d.quiz_attempts.push(a);
        var mx2 = (m.content && m.content.max_grade) || 10;
        var pnota = g.max ? g.score / g.max * mx2 : 0;
        var pass = (m.content && m.content.pass_grade) || 6;
        if (g.max && pnota >= pass) addXp(d, me.id, 20, 'Cuestionario aprobado');
        if (g.max && g.score === g.max) addXp(d, me.id, 10, 'Puntaje perfecto');
        // grade al libro (cuenta el mejor intento)
        var nota = g.max ? Math.round(g.score * maxG / g.max * 10) / 10 : 0;
        var better = d.grades.filter(function (gr) {
          return gr.course_id === m.course_id && gr.student_id === me.id && gr.module_id === moduleId;
        });
        var best = better.reduce(function (b, gr) { return Math.max(b, gr.grade || 0); }, 0);
        if (nota > best || !better.length) {
          if (!better.length) d.grades.push({ id: uid(d, 'g'), course_id: m.course_id, student_id: me.id, module_id: moduleId, grade: nota, max_grade: maxG, weight: 1, updated_at: now() });
          else better[0].grade = nota, better[0].updated_at = now();
        }
        save(d); return Promise.resolve(clone(a));
      }
      return api.questions(moduleId, false).then(function (qs) {
        var g = gradeAnswers(qs, answers);
        return supa().from('quiz_attempts').insert({
          module_id: moduleId, student_id: me.id, answers: answers,
          score: g.score, max_score: g.max, needs_review: g.needs_review,
          finished_at: now(), status: g.needs_review ? 'submitted' : 'graded'
        }).select().single().then(function (r) { return r.data; });
      });
    },
    reviewAttempt: function (attemptId, essayScores, feedback) {
      // essayScores: {questionId: puntos}
      if (useDemo) {
        var d = load();
        var a = find(d, 'quiz_attempts', attemptId);
        a.essay_scores = essayScores || {};
        var extra = 0;
        for (var k in a.essay_scores) extra += Number(a.essay_scores[k]) || 0;
        a.score = Math.round(((a.auto_score || 0) + extra) * 10) / 10;
        a.needs_review = false; a.status = 'graded'; a.feedback = feedback || null;
        var m = find(d, 'modules', a.module_id);
        var maxG = (m.content && m.content.max_grade) || 10;
        var nota = a.max_score ? Math.round(a.score * maxG / a.max_score * 10) / 10 : 0;
        var tiene = false;
        d.grades.forEach(function (gr) {
          if (gr.course_id === m.course_id && gr.student_id === a.student_id && gr.module_id === a.module_id) {
            tiene = true;
            if (nota > (gr.grade || 0)) { gr.grade = nota; gr.updated_at = now(); }
          }
        });
        if (!tiene) d.grades.push({ id: uid(d, 'g'), course_id: m.course_id, student_id: a.student_id, module_id: a.module_id, grade: nota, max_grade: maxG, weight: 1, updated_at: now() });
        save(d); return Promise.resolve(clone(a));
      }
      var extra2 = 0;
      for (var k2 in (essayScores || {})) extra2 += Number(essayScores[k2]) || 0;
      return supa().from('quiz_attempts').select('*').eq('id', attemptId).single().then(function (r) {
        var a = r.data;
        var score = Math.round(((a.auto_score || a.score || 0) + extra2) * 10) / 10;
        return supa().from('quiz_attempts').update({
          essay_scores: essayScores || {}, score: score,
          needs_review: false, status: 'graded', feedback: feedback || null
        }).eq('id', attemptId).select().single().then(function (r2) { return r2.data; });
      });
    },

    /* ---------- entregas ---------- */
    mySubmission: function (moduleId) {
      if (useDemo) {
        var d = load();
        var s = null;
        d.submissions.forEach(function (x) { if (x.module_id === moduleId && x.student_id === me.id) s = clone(x); });
        return Promise.resolve(s);
      }
      return supa().from('submissions').select('*').eq('module_id', moduleId).eq('student_id', me.id)
        .maybeSingle().then(function (r) { return r.data; });
    },
    submissionsOf: function (moduleId) {
      if (useDemo) {
        var d = load();
        return Promise.resolve(d.submissions.filter(function (s) { return s.module_id === moduleId; }).map(function (s) {
          s = clone(s); var p = find(d, 'profiles', s.student_id);
          s.student_name = p ? p.full_name : '?'; return s;
        }));
      }
      return supa().from('submissions').select('*, student:student_id(full_name)')
        .eq('module_id', moduleId).then(function (r) {
          return (r.data || []).map(function (s) { s.student_name = s.student && s.student.full_name; return s; });
        });
    },
    submitAssignment: function (moduleId, data) {
      // data: {body, link, embed, files:[{name,url,size}]}
      if (useDemo) {
        var d = load();
        var s = null;
        d.submissions.forEach(function (x) { if (x.module_id === moduleId && x.student_id === me.id) s = x; });
        if (!s) { s = { id: uid(d, 'sb'), module_id: moduleId, student_id: me.id }; d.submissions.push(s); }
        s.body = data.body || '';
        s.link = data.link || null;
        s.embed = data.embed || null;
        s.files = data.files || [];
        s.submitted_at = now();
        addXp(d, me.id, 15, 'Tarea entregada');
        save(d); return Promise.resolve(clone(s));
      }
      return supa().from('submissions').upsert({
        module_id: moduleId, student_id: me.id, body: data.body || '',
        link: data.link || null, embed_html: data.embed || null,
        files: data.files || [], file_url: data.files && data.files[0] ? data.files[0].name : null,
        submitted_at: now()
      }, { onConflict: 'module_id,student_id' }).select().single().then(function (r) { return r.data; });
    },
    gradeSubmission: function (id, grade, feedback) {
      if (useDemo) {
        var d = load();
        var s = find(d, 'submissions', id);
        s.grade = grade; s.feedback = feedback || null;
        s.graded_at = now(); s.graded_by = me.id;
        var m = find(d, 'modules', s.module_id);
        var exists = d.grades.filter(function (g) {
          return g.course_id === m.course_id && g.student_id === s.student_id && g.module_id === s.module_id;
        })[0];
        if (exists) { exists.grade = grade; exists.updated_at = now(); }
        else d.grades.push({ id: uid(d, 'g'), course_id: m.course_id, student_id: s.student_id, module_id: s.module_id, grade: grade, max_grade: (m.content && m.content.max_grade) || 10, weight: 1, updated_at: now() });
        save(d); return Promise.resolve(s);
      }
      return supa().from('submissions').update({ grade: grade, feedback: feedback || null, graded_at: now(), graded_by: me.id })
        .eq('id', id).then(function (r) { return r.data; });
    },

    /* ---------- gradebook ---------- */
    gradebook: function (courseId) {
      if (useDemo) {
        var d = load();
        var studs = d.enrollments.filter(function (e) { return e.course_id === courseId; })
          .map(function (e) { return find(d, 'profiles', e.student_id); });
        var gradables = d.modules.filter(function (m) {
          return m.course_id === courseId && (m.type === 'quiz' || m.type === 'assignment');
        });
        var manual = {};
        d.grades.forEach(function (g) {
          if (g.course_id === courseId && !g.module_id) {
            manual[g.label] = true;
          }
        });
        var rows = d.grades.filter(function (g) { return g.course_id === courseId; });
        return Promise.resolve({ students: clone(studs), gradables: clone(gradables), manualLabels: Object.keys(manual), rows: clone(rows) });
      }
      return Promise.all([
        supa().from('enrollments').select('student:student_id(id,full_name)').eq('course_id', courseId),
        supa().from('modules').select('id,title,type').eq('course_id', courseId).in('type', ['quiz', 'assignment']),
        supa().from('grades').select('*').eq('course_id', courseId)
      ]).then(function (rs) {
        var rows = rs[2].data || [];
        var manual = {};
        rows.forEach(function (g) { if (!g.module_id) manual[g.label] = true; });
        return { students: (rs[0].data || []).map(function (e) { return e.student; }),
                 gradables: rs[1].data || [], manualLabels: Object.keys(manual), rows: rows };
      });
    },
    saveGrade: function (courseId, studentId, moduleId, label, grade, maxGrade) {
      if (useDemo) {
        var d = load();
        var row = null;
        d.grades.forEach(function (g) {
          if (g.course_id === courseId && g.student_id === studentId &&
              (g.module_id || null) === (moduleId || null) && (g.label || null) === (label || null)) row = g;
        });
        if (!row) {
          row = { id: uid(d, 'g'), course_id: courseId, student_id: studentId, module_id: moduleId, label: label, weight: 1 };
          d.grades.push(row);
        }
        row.grade = grade === '' || grade === null ? null : Number(grade);
        row.max_grade = maxGrade || 10; row.updated_at = now();
        save(d); return Promise.resolve(clone(row));
      }
      return supa().from('grades').upsert({
        course_id: courseId, student_id: studentId, module_id: moduleId,
        label: label, grade: grade === '' || grade === null ? null : Number(grade), max_grade: maxGrade || 10
      }, { onConflict: 'course_id,student_id,module_id,label' }).select().single().then(function (r) { return r.data; });
    },

    /* ---------- comunicados ---------- */
    announcements: function (courseId) {
      if (useDemo) {
        var d = load();
        var myCourseIds = d.courses.filter(function (c) {
          if (me.role === 'admin') return true;
          if (me.role === 'docente') return c.teacher_id === me.id;
          return d.enrollments.some(function (e) { return e.course_id === c.id && e.student_id === api.sid(); });
        }).map(function (c) { return c.id; });
        return Promise.resolve(d.announcements.filter(function (a) {
          if (a.course_id === null) {
            return a.audience === 'todos' || (a.audience === 'docentes' && me.role !== 'estudiante') || (a.audience === 'estudiantes' && me.role === 'estudiante');
          }
          return myCourseIds.indexOf(a.course_id) >= 0 && (!courseId || a.course_id === courseId);
        }).map(function (a) {
          a = clone(a); var p = find(d, 'profiles', a.author_id);
          a.author_name = p ? p.full_name : '?';
          var c = find(d, 'courses', a.course_id);
          a.course_name = c ? c.short_name || c.name : 'General';
          return a;
        }).sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; }));
      }
      return supa().from('announcements').select('*, author:author_id(full_name), course:course_id(short_name,name)')
        .order('created_at', { ascending: false }).then(function (r) {
          return (r.data || []).map(function (a) {
            a.author_name = a.author && a.author.full_name;
            a.course_name = a.course ? (a.course.short_name || a.course.name) : 'General';
            return a;
          });
        });
    },
    postAnnouncement: function (a) {
      if (useDemo) {
        var d = load();
        var row = { id: uid(d, 'an'), course_id: a.course_id || null, author_id: me.id,
          title: a.title, body: a.body, audience: a.audience || 'todos', created_at: now() };
        d.announcements.push(row); save(d); return Promise.resolve(clone(row));
      }
      return supa().from('announcements').insert({
        course_id: a.course_id || null, author_id: me.id, title: a.title, body: a.body, audience: a.audience || 'todos'
      }).select().single().then(function (r) { return r.data; });
    },

    /* ---------- admin ---------- */
    saveCourse: function (c) {
      if (useDemo) {
        var d = load();
        var row = c.id ? find(d, 'courses', c.id) : null;
        if (!row) { row = { id: uid(d, 'c'), active: true, created_at: now() }; d.courses.push(row); }
        ['name', 'short_name', 'color', 'description', 'school_year', 'teacher_id', 'active', 'pattern', 'welcome', 'sigla', 'banner_url', 'layout', 'enroll_code', 'presentacion', 'programa'].forEach(function (k) {
          if (c[k] !== undefined) row[k] = c[k];
        });
        save(d); return Promise.resolve(clone(row));
      }
      var r2 = {};
      ['id', 'name', 'short_name', 'color', 'description', 'school_year', 'teacher_id', 'active', 'pattern', 'welcome', 'sigla', 'banner_url', 'layout', 'enroll_code', 'presentacion', 'programa'].forEach(function (k) {
        if (c[k] !== undefined) r2[k] = c[k];
      });
      return supa().from('courses').upsert(r2).select().single().then(function (r) { return r.data; });
    },
    enroll: function (courseId, studentId) {
      if (useDemo) {
        var d = load();
        var dup = d.enrollments.some(function (e) { return e.course_id === courseId && e.student_id === studentId; });
        if (!dup) { d.enrollments.push({ id: uid(d, 'en'), course_id: courseId, student_id: studentId }); save(d); }
        return Promise.resolve();
      }
      return supa().from('enrollments').upsert({ course_id: courseId, student_id: studentId }, { onConflict: 'course_id,student_id' });
    },
    unenroll: function (courseId, studentId) {
      if (useDemo) {
        var d = load();
        d.enrollments = d.enrollments.filter(function (e) { return !(e.course_id === courseId && e.student_id === studentId); });
        save(d); return Promise.resolve();
      }
      return supa().from('enrollments').delete().eq('course_id', courseId).eq('student_id', studentId);
    },
    addUser: function (u) {
      if (useDemo) {
        var d = load();
        var row = { id: uid(d, 'u'), full_name: u.full_name, role: u.role, email: u.email || null };
        d.profiles.push(row); save(d); return Promise.resolve(clone(row));
      }
      return Promise.reject(new Error('Crear usuarios reales: Supabase → Authentication → Add user'));
    },
    markViewed: function (moduleId) {
      if (useDemo) {
        var d = load();
        if (me.hijo_id) return Promise.resolve();
        var ok = d.module_views.some(function (v) { return v.module_id === moduleId && v.student_id === me.id; });
        if (!ok) { d.module_views.push({ module_id: moduleId, student_id: me.id, viewed_at: now() }); save(d); }
        return Promise.resolve();
      }
      return supa().from('module_views').upsert({ module_id: moduleId, student_id: me.id });
    },
    myViews: function () {
      if (useDemo) {
        var d = load();
        return Promise.resolve(d.module_views.filter(function (v) { return v.student_id === api.sid(); }).map(function (v) { return v.module_id; }));
      }
      return supa().from('module_views').select('module_id').eq('student_id', me.id)
        .then(function (r) { return (r.data || []).map(function (v) { return v.module_id; }); });
    },

    /* ---------- foros ---------- */
    forumPosts: function (moduleId) {
      if (useDemo) {
        var d = load();
        return Promise.resolve(d.forum_posts.filter(function (p) { return p.module_id === moduleId; }).map(function (p) {
          p = clone(p); var a = find(d, 'profiles', p.author_id);
          p.author_name = a ? a.full_name : '?'; p.author_role = a ? a.role : '';
          return p;
        }).sort(function (a, b) { return a.created_at < b.created_at ? -1 : 1; }));
      }
      return supa().from('forum_posts').select('*, author:author_id(full_name,role)').eq('module_id', moduleId)
        .order('created_at').then(function (r) {
          return (r.data || []).map(function (p) {
            p.author_name = p.author && p.author.full_name; p.author_role = p.author && p.author.role; return p;
          });
        });
    },
    postForum: function (moduleId, post) {
      if (useDemo) {
        var d = load();
        var row = { id: uid(d, 'fp'), module_id: moduleId, parent_id: post.parent_id || null,
          author_id: me.id, title: post.title || null, body: post.body, created_at: now() };
        d.forum_posts.push(row); addXp(d, me.id, 5, 'Participaste en el foro');
        save(d); return Promise.resolve(clone(row));
      }
      return supa().from('forum_posts').insert({
        module_id: moduleId, parent_id: post.parent_id || null,
        title: post.title || null, body: post.body
      }).select().single().then(function (r) { return r.data; });
    },
    deleteForumPost: function (id) {
      if (useDemo) {
        var d = load();
        d.forum_posts = d.forum_posts.filter(function (p) { return p.id !== id && p.parent_id !== id; });
        save(d); return Promise.resolve();
      }
      return supa().from('forum_posts').delete().eq('id', id);
    },

    /* ---------- banco de preguntas ---------- */
    bankList: function (courseId) {
      if (useDemo) {
        var d = load();
        return Promise.resolve(clone(d.bank.filter(function (q) { return q.course_id === courseId; })));
      }
      return supa().from('question_bank').select('*').eq('course_id', courseId).order('created_at')
        .then(function (r) { return r.data || []; });
    },
    bankSave: function (courseId, q) {
      if (useDemo) {
        var d = load();
        var row = { id: uid(d, 'bk'), course_id: courseId, type: q.type, prompt: q.prompt,
          points: q.points || 1, payload: q.payload || {}, created_at: now() };
        d.bank.push(row); save(d); return Promise.resolve(clone(row));
      }
      return supa().from('question_bank').insert({
        course_id: courseId, type: q.type, prompt: q.prompt, points: q.points || 1, payload: q.payload || {}
      }).select().single().then(function (r) { return r.data; });
    },
    bankDelete: function (id) {
      if (useDemo) {
        var d = load();
        d.bank = d.bank.filter(function (q) { return q.id !== id; });
        save(d); return Promise.resolve();
      }
      return supa().from('question_bank').delete().eq('id', id);
    },

    /* ---------- asistencia ---------- */
    attendance: function (courseId, fecha) {
      // fecha 'YYYY-MM-DD' o null = todo el curso
      if (useDemo) {
        var d = load();
        var rows = d.attendance.filter(function (a) {
          return a.course_id === courseId && (!fecha || a.date === fecha);
        }).map(function (a) {
          a = clone(a); var s = find(d, 'profiles', a.student_id);
          a.student_name = s ? s.full_name : '?'; return a;
        });
        return Promise.resolve(rows);
      }
      var q = supa().from('attendance').select('*').eq('course_id', courseId);
      if (fecha) q = q.eq('date', fecha);
      return q.then(function (r) { return r.data || []; });
    },
    setAttendance: function (courseId, studentId, fecha, status) {
      if (useDemo) {
        var d = load();
        var row = null;
        d.attendance.forEach(function (a) {
          if (a.course_id === courseId && a.student_id === studentId && a.date === fecha) row = a;
        });
        if (!row) { row = { id: uid(d, 'at'), course_id: courseId, student_id: studentId, date: fecha }; d.attendance.push(row); }
        row.status = status; row.marked_by = me.id;
        save(d); return Promise.resolve(clone(row));
      }
      return supa().from('attendance').upsert({
        course_id: courseId, student_id: studentId, date: fecha, status: status, marked_by: me.id
      }, { onConflict: 'course_id,student_id,date' }).select().single().then(function (r) { return r.data; });
    },
    myAttendancePct: function (courseId) {
      if (useDemo) {
        var d = load();
        var rows = d.attendance.filter(function (a) { return a.course_id === courseId && a.student_id === api.sid(); });
        if (!rows.length) return Promise.resolve(null);
        var ok = rows.filter(function (a) { return a.status === 'P' || a.status === 'T'; }).length;
        return Promise.resolve(Math.round(ok / rows.length * 100));
      }
      return supa().from('attendance').select('status').eq('course_id', courseId).eq('student_id', me.id)
        .then(function (r) {
          var rows = r.data || [];
          if (!rows.length) return null;
          var ok = rows.filter(function (a) { return a.status === 'P' || a.status === 'T'; }).length;
          return Math.round(ok / rows.length * 100);
        });
    },

    /* ---------- insignias (computadas) ---------- */
    badges: function () {
      if (useDemo) {
        var d = load();
        var att = d.quiz_attempts.filter(function (a) { return a.student_id === api.sid(); });
        var subs = d.submissions.filter(function (s) { return s.student_id === api.sid(); });
        var views = d.module_views.filter(function (v) { return v.student_id === api.sid(); });
        var posts = d.forum_posts.filter(function (p) { return p.author_id === me.id; });
        var best = att.reduce(function (b, a) { return Math.max(b, (a.score || 0) / Math.max(1, a.max_score)); }, 0);
        var perfect = att.some(function (a) { return a.max_score && a.score === a.max_score; });
        var aprobado = att.some(function (a) { var m = find(d, 'modules', a.module_id); var p = (m && m.content && m.content.pass_grade) || 6; var mx = (m && m.content && m.content.max_grade) || 10; return a.max_score && (a.score / a.max_score * mx) >= p; });
        var aTiempo = subs.some(function (s) { var m = find(d, 'modules', s.module_id); return m && m.due_date && s.submitted_at <= m.due_date; });
        var defs = [
          { id: 'intento',  icon: 'quiz',    nombre: 'Primer intento',    desc: 'Rendiste tu primer cuestionario',        ok: att.length >= 1 },
          { id: 'perfecto', icon: 'sparkle', nombre: 'Puntaje perfecto',  desc: '100% en un cuestionario',                ok: perfect },
          { id: 'aprobada', icon: 'check',   nombre: 'Aprobada',          desc: 'Superaste la nota de aprobación',        ok: aprobado },
          { id: 'puntual',  icon: 'clock',   nombre: 'Puntual',           desc: 'Entregaste una tarea antes del vencimiento', ok: aTiempo },
          { id: 'entregas', icon: 'task',    nombre: 'Responsable',       desc: '3 o más tareas entregadas',              ok: subs.length >= 3 },
          { id: 'explora',  icon: 'eye',     nombre: 'Curiosa',           desc: 'Abriste 5+ materiales',                  ok: views.length >= 5 },
          { id: 'forera',   icon: 'forum',   nombre: 'Participa',         desc: 'Publicaste en un foro',                  ok: posts.length >= 1 },
          { id: 'racha',    icon: 'flame',   nombre: 'En racha',          desc: '3+ intentos de cuestionarios',           ok: att.length >= 3 },
          { id: 'crack',    icon: 'award',   nombre: 'Crack',             desc: 'Promedio de cuestionarios ≥ 90%',        ok: att.length >= 2 && best >= 0.9 }
        ];
        return Promise.resolve(defs);
      }
      return Promise.resolve([]); // supabase: mismo cómputo en cliente (V2)
    },

    /* ---------- notificaciones (campanita) ---------- */
    notifications: function () {
      if (useDemo) {
        var d = load();
        var seen = localStorage.getItem('zeiro_seen_' + me.id) || '2000-01-01T00:00:00Z';
        var items = [];
        var myCourseIds = d.courses.filter(function (c) {
          if (me.role === 'admin') return true;
          if (me.role === 'docente') return c.teacher_id === me.id;
          return d.enrollments.some(function (e) { return e.course_id === c.id && e.student_id === api.sid(); });
        }).map(function (c) { return c.id; });
        d.announcements.forEach(function (a) {
          if (a.created_at > seen && a.author_id !== me.id &&
              (a.course_id === null || myCourseIds.indexOf(a.course_id) >= 0)) {
            items.push({ tipo: 'comunicado', icon: 'mega', titulo: a.title, extra: 'Nuevo comunicado', hash: '#/comunicados', fecha: a.created_at });
          }
        });
        d.grades.forEach(function (g) {
          if (g.student_id === me.id && g.updated_at > seen) {
            var m = g.module_id ? find(d, 'modules', g.module_id) : null;
            var c = find(d, 'courses', g.course_id);
            items.push({ tipo: 'nota', icon: 'star', titulo: 'Nota ' + g.grade + ' en ' + (m ? m.title : g.label || 'actividad'),
              extra: c ? c.short_name || c.name : '', hash: '#/mis-notas', fecha: g.updated_at });
          }
        });
        if (me.role !== 'estudiante') {
          d.submissions.forEach(function (s) {
            if (s.submitted_at > seen && s.grade == null) {
              var m = find(d, 'modules', s.module_id);
              if (m && (me.role === 'admin' || find(d, 'courses', m.course_id).teacher_id === me.id)) {
                var st = find(d, 'profiles', s.student_id);
                items.push({ tipo: 'entrega', icon: 'task', titulo: (st ? st.full_name : '?') + ' entregó ' + m.title,
                  extra: 'Por corregir', hash: '#/corregir-entregas/' + m.id, fecha: s.submitted_at });
              }
            }
          });
          d.quiz_attempts.forEach(function (a) {
            if (a.needs_review && a.finished_at > seen) {
              var m = find(d, 'modules', a.module_id);
              if (m && (me.role === 'admin' || find(d, 'courses', m.course_id).teacher_id === me.id)) {
                var st2 = find(d, 'profiles', a.student_id);
                items.push({ tipo: 'intento', icon: 'quiz', titulo: (st2 ? st2.full_name : '?') + ' rindió ' + m.title,
                  extra: 'Revisar abiertas', hash: '#/correccion-quiz/' + m.id, fecha: a.finished_at });
              }
            }
          });
        }
        (d.notifs || []).forEach(function (n) {
          if (n.user_id === me.id && n.fecha > seen) {
            items.push({ tipo: 'aviso', icon: n.icon || 'send', titulo: n.titulo, extra: n.extra || '', hash: n.hash, fecha: n.fecha });
          }
        });
        items.sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; });
        return Promise.resolve(items.slice(0, 15));
      }
      return Promise.resolve([]);
    },
    markNotifsSeen: function () {
      if (useDemo) { localStorage.setItem('zeiro_seen_' + me.id, now()); return Promise.resolve(); }
      return Promise.resolve();
    },

    /* ---------- usuarios ---------- */
    deleteUser: function (id) {
      if (useDemo) {
        var d = load();
        d.profiles = d.profiles.filter(function (p) { return p.id !== id; });
        d.enrollments = d.enrollments.filter(function (e) { return e.student_id !== id; });
        save(d); return Promise.resolve();
      }
      return Promise.reject(new Error('Borrar usuarios reales: Supabase → Authentication'));
    },
    /* ---------- XP, niveles, racha, leaderboard ---------- */
    grantXp: function (pts, motivo) {
      if (!useDemo || !me) return Promise.resolve();
      var d = load(); addXp(d, me.id, pts, motivo); save(d); return Promise.resolve();
    },
    myXp: function () {
      if (!useDemo) return Promise.resolve({ total: 0, level: 1, next: 100, streak: 0, recent: [] });
      var d = load();
      var mios = d.xp_log.filter(function (x) { return x.student_id === me.id; });
      var total = mios.reduce(function (t, x) { return t + x.pts; }, 0);
      var level = 1, acum = 0, NEXT = [50, 150, 300, 500, 800, 1200, 1700, 2300, 3000];
      for (var i = 0; i < NEXT.length; i++) { if (total >= NEXT[i]) { level = i + 2; acum = NEXT[i]; } else break; }
      var next = NEXT[level - 1] || (acum + 1000);
      var dias = {};
      mios.forEach(function (x) { dias[x.created_at.slice(0, 10)] = 1; });
      var streak = 0, day = new Date();
      if (!dias[day.toISOString().slice(0, 10)]) day.setDate(day.getDate() - 1);
      while (dias[day.toISOString().slice(0, 10)]) { streak++; day.setDate(day.getDate() - 1); }
      return Promise.resolve({ total: total, level: level, acum: acum, next: next, streak: streak,
        recent: mios.slice(-6).reverse() });
    },
    leaderboard: function () {
      if (!useDemo) return Promise.resolve([]);
      var d = load();
      var tot = {};
      d.xp_log.forEach(function (x) { tot[x.student_id] = (tot[x.student_id] || 0) + x.pts; });
      return Promise.resolve(Object.keys(tot).map(function (uid) {
        var p = find(d, 'profiles', uid);
        return { id: uid, name: p ? p.full_name : '?', pts: tot[uid] };
      }).sort(function (a, b) { return b.pts - a.pts; }).slice(0, 20));
    },

    /* ---------- mensajería 1-a-1 ---------- */
    threads: function () {
      if (!useDemo) return Promise.resolve([]);
      var d = load();
      var otros = {};
      d.messages.forEach(function (m) {
        if (m.from_id !== me.id && m.to_id !== me.id) return;
        var o = m.from_id === me.id ? m.to_id : m.from_id;
        if (!otros[o]) otros[o] = { uid: o, last: m, unread: 0 };
        if (m.created_at > otros[o].last.created_at) otros[o].last = m;
        if (m.to_id === me.id && !m.read_at) otros[o].unread++;
      });
      return Promise.resolve(Object.keys(otros).map(function (k) {
        var t = otros[k]; var p = find(d, 'profiles', t.uid);
        return { uid: k, name: p ? p.full_name : '?', role: p ? p.role : '',
          last_body: t.last.body, last_at: t.last.created_at, mio: t.last.from_id === me.id, unread: t.unread };
      }).sort(function (a, b) { return a.last_at < b.last_at ? 1 : -1; }));
    },
    threadWith: function (uid) {
      if (!useDemo) return Promise.resolve([]);
      var d = load();
      var leer = false;
      d.messages.forEach(function (m) {
        if (m.to_id === me.id && m.from_id === uid && !m.read_at) { m.read_at = now(); leer = true; }
      });
      if (leer) save(d);
      return Promise.resolve(d.messages.filter(function (m) {
        return (m.from_id === me.id && m.to_id === uid) || (m.from_id === uid && m.to_id === me.id);
      }).sort(function (a, b) { return a.created_at < b.created_at ? -1 : 1; }).map(clone));
    },
    sendMessage: function (toId, body) {
      if (!useDemo) return Promise.resolve();
      var d = load();
      d.messages.push({ id: uid(d, 'ms'), from_id: me.id, to_id: toId, body: body, created_at: now(), read_at: null });
      save(d); return Promise.resolve();
    },
    unreadMsgs: function () {
      if (!useDemo) return Promise.resolve(0);
      var d = load();
      return Promise.resolve(d.messages.filter(function (m) { return m.to_id === me.id && !m.read_at; }).length);
    },

    /* ---------- encuestas (módulo poll) ---------- */
    pollVote: function (moduleId, ix) {
      if (!useDemo) return Promise.resolve();
      var d = load();
      var v = d.poll_votes.filter(function (x) { return x.module_id === moduleId && x.student_id === me.id; })[0];
      if (v) v.option = ix;
      else d.poll_votes.push({ id: uid(d, 'pv'), module_id: moduleId, student_id: me.id, option: ix, created_at: now() });
      addXp(d, me.id, 3, 'Votaste en la encuesta');
      save(d); return Promise.resolve();
    },
    pollResults: function (moduleId) {
      if (!useDemo) return Promise.resolve({ votes: {}, mine: null, total: 0 });
      var d = load();
      var votes = {}, mine = null, total = 0;
      d.poll_votes.forEach(function (x) {
        if (x.module_id !== moduleId) return;
        votes[x.option] = (votes[x.option] || 0) + 1; total++;
        if (x.student_id === me.id) mine = x.option;
      });
      return Promise.resolve({ votes: votes, mine: mine, total: total });
    },

    /* ---------- flashcards ---------- */
    flashCards: function (courseId) {
      if (!useDemo) return Promise.resolve([]);
      var d = load();
      return Promise.resolve(clone(d.flashcards.filter(function (c) { return c.course_id === courseId; })));
    },
    flashSave: function (courseId, card) {
      if (!useDemo) return Promise.resolve();
      var d = load();
      var row = card.id ? find(d, 'flashcards', card.id) : null;
      if (!row) { row = { id: uid(d, 'fc'), course_id: courseId, created_by: me.id }; d.flashcards.push(row); }
      row.front = card.front; row.back = card.back;
      save(d); return Promise.resolve(clone(row));
    },
    flashDelete: function (id) {
      if (!useDemo) return Promise.resolve();
      var d = load();
      d.flashcards = d.flashcards.filter(function (c) { return c.id !== id; });
      d.flash_reviews = d.flash_reviews.filter(function (r) { return r.card_id !== id; });
      save(d); return Promise.resolve();
    },
    myDueFlash: function (courseId) {
      // devuelve cartas del curso con su estado: debidas primero, luego nuevas
      if (!useDemo) return Promise.resolve([]);
      var d = load();
      var hoy = new Date().toISOString().slice(0, 10);
      return Promise.resolve(d.flashcards.filter(function (c) { return c.course_id === courseId; }).map(function (c) {
        var r = d.flash_reviews.filter(function (x) { return x.card_id === c.id && x.student_id === me.id; })[0];
        return clone({ card: c, box: r ? r.box : 0, due: r ? r.due : null, pendiente: !r || r.due <= hoy });
      }));
    },
    flashReview: function (cardId, ok) {
      if (!useDemo) return Promise.resolve();
      var d = load();
      var r = d.flash_reviews.filter(function (x) { return x.card_id === cardId && x.student_id === me.id; })[0];
      var INT = [0, 1, 3, 7, 15, 30, 60];
      if (!r) { r = { id: uid(d, 'fr'), card_id: cardId, student_id: me.id, box: 0 }; d.flash_reviews.push(r); }
      r.box = ok ? Math.min(r.box + 1, INT.length - 1) : 0;
      var dd = new Date(); dd.setDate(dd.getDate() + INT[r.box]);
      r.due = dd.toISOString().slice(0, 10); r.last = now();
      addXp(d, me.id, 2, 'Repasaste flashcards');
      save(d); return Promise.resolve();
    },

    /* ---------- certificados ---------- */
    issueCert: function (courseId, studentId) {
      if (!useDemo) return Promise.resolve();
      var d = load();
      var ex = d.certificates.filter(function (c) { return c.course_id === courseId && c.student_id === studentId; })[0];
      if (ex) return Promise.resolve(clone(ex));
      var code = 'ZEI-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      var c = { id: uid(d, 'ct'), course_id: courseId, student_id: studentId, code: code, issued_at: now(), issued_by: me.id };
      d.certificates.push(c); save(d); return Promise.resolve(clone(c));
    },
    myCerts: function () {
      if (!useDemo) return Promise.resolve([]);
      var d = load();
      return Promise.resolve(d.certificates.filter(function (c) { return c.student_id === me.id; }).map(function (c) {
        c = clone(c); var co = find(d, 'courses', c.course_id);
        c.course_name = co ? co.name : '?'; c.course_color = co ? co.color : '#7C3AED';
        return c;
      }));
    },
    certByCode: function (code) {
      if (!useDemo) return Promise.resolve(null);
      var d = load();
      var c = d.certificates.filter(function (x) { return x.code === code; })[0];
      if (!c) return Promise.resolve(null);
      c = clone(c);
      var co = find(d, 'courses', c.course_id), st = find(d, 'profiles', c.student_id), te = co ? find(d, 'profiles', co.teacher_id) : null;
      c.course_name = co ? co.name : '?'; c.course_color = co ? co.color : '#7C3AED';
      c.student_name = st ? st.full_name : '?'; c.teacher_name = te ? te.full_name : '';
      return Promise.resolve(c);
    },

    /* ---------- inscripción por código ---------- */
    joinByCode: function (code) {
      if (!useDemo) return Promise.resolve({ error: 'demo' });
      var d = load();
      code = (code || '').trim().toUpperCase();
      var c = d.courses.filter(function (x) { return (x.enroll_code || '').toUpperCase() === code; })[0];
      if (!c) return Promise.resolve({ error: 'Código no encontrado' });
      if (d.enrollments.some(function (e) { return e.course_id === c.id && e.student_id === api.sid(); }))
        return Promise.resolve({ error: 'Ya estás inscripto en ese curso', course: c });
      d.enrollments.push({ id: uid(d, 'en'), course_id: c.id, student_id: me.id });
      save(d); return Promise.resolve({ course: c });
    },

    /* ---------- progreso (docente) ---------- */
    courseProgress: function (courseId) {
      if (!useDemo) return Promise.resolve([]);
      var d = load();
      var mods = d.modules.filter(function (m) { return m.course_id === courseId && m.visible; });
      var gradables = mods.filter(function (m) { return m.type === 'quiz' || m.type === 'assignment'; });
      return Promise.resolve(d.enrollments.filter(function (e) { return e.course_id === courseId; }).map(function (e) {
        var st = find(d, 'profiles', e.student_id);
        var vistos = d.module_views.filter(function (v) { return v.student_id === e.student_id && mods.some(function (m) { return m.id === v.module_id; }); }).length;
        var hechos = gradables.filter(function (m) {
          return d.submissions.some(function (s) { return s.module_id === m.id && s.student_id === e.student_id; }) ||
                 d.quiz_attempts.some(function (a) { return a.module_id === m.id && a.student_id === e.student_id && a.status !== 'open'; });
        }).length;
        var notas = d.grades.filter(function (g) { return g.course_id === courseId && g.student_id === e.student_id && g.grade != null; });
        var prom = notas.length ? Math.round(notas.reduce(function (t, g) { return t + g.grade / Math.max(1, g.max_grade) * 10; }, 0) / notas.length * 10) / 10 : null;
        var cert = d.certificates.filter(function (c) { return c.course_id === courseId && c.student_id === e.student_id; })[0];
        return { student: clone(st), vistos: vistos, total: mods.length, hechos: hechos, gradables: gradables.length, prom: prom, cert: cert || null };
      }));
    },

    /* ---------- estadísticas (dirección) ---------- */
    stats: function () {
      if (!useDemo) return Promise.resolve(null);
      var d = load();
      var por = { estudiante: 0, docente: 0, admin: 0 };
      d.profiles.forEach(function (p) { por[p.role] = (por[p.role] || 0) + 1; });
      var hace30 = new Date(); hace30.setDate(hace30.getDate() - 30);
      var act = {};
      var marcar = function (iso) { var k = (iso || '').slice(0, 10); if (k) act[k] = (act[k] || 0) + 1; };
      d.quiz_attempts.forEach(function (a) { marcar(a.finished_at); });
      d.submissions.forEach(function (s) { marcar(s.submitted_at); });
      d.forum_posts.forEach(function (p) { marcar(p.created_at); });
      d.messages.forEach(function (m) { marcar(m.created_at); });
      var serie = [];
      for (var i = 29; i >= 0; i--) {
        var dd = new Date(); dd.setDate(dd.getDate() - i);
        var k = dd.toISOString().slice(0, 10);
        serie.push({ dia: k.slice(5), n: act[k] || 0 });
      }
      var evaluados = d.grades.filter(function (g) { return g.grade != null; });
      var aprob = evaluados.filter(function (g) { return g.grade >= 6; }).length;
      return Promise.resolve({
        usuarios: por, cursos: d.courses.length, modulos: d.modules.length,
        intentos: d.quiz_attempts.length, entregas: d.submissions.length,
        mensajes: d.messages.length, foros: d.forum_posts.length,
        serie: serie, aprob_pct: evaluados.length ? Math.round(aprob / evaluados.length * 100) : null,
        certs: d.certificates.length
      });
    },

    /* ---------- pendientes (estudiante) ---------- */
    pendientes: function () {
      if (!useDemo) return Promise.resolve([]);
      var d = load();
      var out = [];
      d.enrollments.filter(function (e) { return e.student_id === api.sid(); }).forEach(function (e) {
        var c = find(d, 'courses', e.course_id);
        d.modules.filter(function (m) {
          return m.course_id === e.course_id && m.visible && m.due_date &&
            (m.type === 'assignment' || m.type === 'quiz');
        }).forEach(function (m) {
          var hecha = m.type === 'assignment'
            ? d.submissions.some(function (s) { return s.module_id === m.id && s.student_id === me.id; })
            : d.quiz_attempts.some(function (a) { return a.module_id === m.id && a.student_id === api.sid() && a.status !== 'open'; });
          out.push({ mod: clone(m), course: c, hecha: hecha, vencida: new Date(m.due_date) < new Date() });
        });
      });
      return Promise.resolve(out.sort(function (a, b) { return a.mod.due_date < b.mod.due_date ? -1 : 1; }));
    },
  };

  window.Z = window.Z || {};

  window.Z.api = api;
})();

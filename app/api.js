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
          return d.enrollments.some(function (e) { return e.course_id === c.id && e.student_id === me.id; });
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
        s.title = sec.title;
        save(d); return Promise.resolve(clone(s));
      }
      var row = { course_id: courseId, title: sec.title };
      if (sec.id) row.id = sec.id;
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
        ['section_id', 'type', 'title', 'content', 'visible', 'due_date'].forEach(function (k) {
          if (m[k] !== undefined) row[k] = m[k];
        });
        save(d); return Promise.resolve(clone(row));
      }
      var row2 = { course_id: courseId };
      ['id', 'section_id', 'type', 'title', 'content', 'visible', 'due_date'].forEach(function (k) {
        if (m[k] !== undefined) row2[k] = m[k];
      });
      return supa().from('modules').upsert(row2).select().single().then(function (r) { return r.data; });
    },
    deleteModule: function (id) {
      if (useDemo) {
        var d = load();
        d.modules = d.modules.filter(function (m) { return m.id !== id; });
        d.questions = d.questions.filter(function (q) { return q.module_id !== id; });
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
      return Promise.resolve(); // en supabase: reordenar vía update position (análogo)
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
          status: g.needs_review ? 'submitted' : 'graded'
        };
        d.quiz_attempts.push(a);
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
    reviewAttempt: function (attemptId, extraScore, feedback) {
      if (useDemo) {
        var d = load();
        var a = find(d, 'quiz_attempts', attemptId);
        a.score = Math.round((a.score + extraScore) * 10) / 10;
        a.needs_review = false; a.status = 'graded'; a.feedback = feedback || null;
        var m = find(d, 'modules', a.module_id);
        var maxG = (m.content && m.content.max_grade) || 10;
        var nota = a.max_score ? Math.round(a.score * maxG / a.max_score * 10) / 10 : 0;
        d.grades.forEach(function (gr) {
          if (gr.course_id === m.course_id && gr.student_id === a.student_id && gr.module_id === a.module_id) {
            if (nota > (gr.grade || 0)) { gr.grade = nota; gr.updated_at = now(); }
          }
        });
        save(d); return Promise.resolve(a);
      }
      return Promise.resolve();
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
    submitAssignment: function (moduleId, body, fileName) {
      if (useDemo) {
        var d = load();
        var s = null;
        d.submissions.forEach(function (x) { if (x.module_id === moduleId && x.student_id === me.id) s = x; });
        if (!s) { s = { id: uid(d, 'sb'), module_id: moduleId, student_id: me.id }; d.submissions.push(s); }
        s.body = body; s.file_url = fileName || s.file_url || null; s.submitted_at = now();
        save(d); return Promise.resolve(clone(s));
      }
      return supa().from('submissions').upsert({
        module_id: moduleId, student_id: me.id, body: body,
        file_url: fileName || null, submitted_at: now()
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
          return d.enrollments.some(function (e) { return e.course_id === c.id && e.student_id === me.id; });
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
        ['name', 'short_name', 'color', 'description', 'school_year', 'teacher_id', 'active'].forEach(function (k) {
          if (c[k] !== undefined) row[k] = c[k];
        });
        save(d); return Promise.resolve(clone(row));
      }
      var r2 = {};
      ['id', 'name', 'short_name', 'color', 'description', 'school_year', 'teacher_id', 'active'].forEach(function (k) {
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
        var ok = d.module_views.some(function (v) { return v.module_id === moduleId && v.student_id === me.id; });
        if (!ok) { d.module_views.push({ module_id: moduleId, student_id: me.id, viewed_at: now() }); save(d); }
        return Promise.resolve();
      }
      return supa().from('module_views').upsert({ module_id: moduleId, student_id: me.id });
    },
    myViews: function () {
      if (useDemo) {
        var d = load();
        return Promise.resolve(d.module_views.filter(function (v) { return v.student_id === me.id; }).map(function (v) { return v.module_id; }));
      }
      return supa().from('module_views').select('module_id').eq('student_id', me.id)
        .then(function (r) { return (r.data || []).map(function (v) { return v.module_id; }); });
    }
  };

  window.Z = window.Z || {};
  window.Z.api = api;
})();

/* ZEIRO · Íconos SVG propios (sin emojis del sistema).
   Uso: ZI('home') devuelve '<span class="ic">…svg…</span>'. */
(function () {
  var P = {
    home: '<path d="M3 11.5 12 4l9 7.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9.5 21v-6h5v6" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 7.5h8M8 11h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    page: '<path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 3v4h4M8.5 12h7M8.5 15.5h7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    file: '<path d="M12 3v10m0 0-4-4m4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 17v2.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    code: '<path d="M8 6.5 3 12l5 5.5M16 6.5 21 12l-5 5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="m13.5 4.5-3 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    link: '<path d="M9.5 14.5 14.5 9.5M8 11 5.5 13.5a3.54 3.54 0 0 0 5 5L13 16m-2-5 2.5-2.5a3.54 3.54 0 0 1 5 5L16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    quiz: '<rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9 9.5a2.5 2.5 0 1 1 3.4 2.34c-.7.26-1.4.8-1.4 1.66v.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="11" cy="16.8" r="1.1" fill="currentColor"/>',
    task: '<rect x="4" y="4" width="16" height="17" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m8 12.5 2.6 2.6L16 9.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    mega: '<path d="M4 10v4a1 1 0 0 0 1 1h2l5 4V5L7 9H5a1 1 0 0 0-1 1z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    cal: '<rect x="3.5" y="5" width="17" height="16" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="8.5" cy="14.5" r="1.3" fill="currentColor"/><circle cx="12" cy="14.5" r="1.3" fill="currentColor"/>',
    users: '<circle cx="9" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="17" cy="9" r="2.4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M16 14.4a5.5 5.5 0 0 1 4.5 5.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    cap: '<path d="m12 4 10 4.5L12 13 2 8.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M6 10.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5M21 9v6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    gear: '<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.8v2.4m0 13.6v2.4M2.8 12h2.4m13.6 0h2.4M5.6 5.6l1.7 1.7m9.4 9.4 1.7 1.7m0-12.8-1.7 1.7M7.3 16.7l-1.7 1.7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    plus: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    edit: '<path d="m14.5 5.5 4 4L8 20H4v-4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m12.5 7.5 4 4" stroke="currentColor" stroke-width="1.8"/>',
    trash: '<path d="M5 7h14M10 7V5h4v2m-8 0 .8 13a1.5 1.5 0 0 0 1.5 1.4h7.4a1.5 1.5 0 0 0 1.5-1.4L18 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    check: '<path d="m4.5 12.5 5 5L19.5 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    x: '<path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    clock: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7.5V12l3.2 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    up: '<path d="M12 19V5m0 0-5.5 5.5M12 5l5.5 5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    eye: '<path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.8" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    eyeoff: '<path d="M4 4l16 16M9.9 6.4A8.6 8.6 0 0 1 12 5.8c6 0 9.5 6.2 9.5 6.2a16.7 16.7 0 0 1-3.3 3.9m-3.6 2.3a8.6 8.6 0 0 1-2.6.4C6 18.2 2.5 12 2.5 12a16.6 16.6 0 0 1 4-4.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    send: '<path d="m3.5 11 17-7-5.5 17-3-7.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    out: '<path d="M14 8V6a1.5 1.5 0 0 0-1.5-1.5h-7A1.5 1.5 0 0 0 4 6v12a1.5 1.5 0 0 0 1.5 1.5h7A1.5 1.5 0 0 0 14 18v-2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9 12h11m0 0-3.5-3.5M20 12l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    back: '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    down: '<path d="M12 5v14m0 0-5.5-5.5M12 19l5.5-5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    drag: '<circle cx="9" cy="6" r="1.4" fill="currentColor"/><circle cx="15" cy="6" r="1.4" fill="currentColor"/><circle cx="9" cy="12" r="1.4" fill="currentColor"/><circle cx="15" cy="12" r="1.4" fill="currentColor"/><circle cx="9" cy="18" r="1.4" fill="currentColor"/><circle cx="15" cy="18" r="1.4" fill="currentColor"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    print: '<path d="M7 8V3.5h10V8" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="4" y="8" width="16" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7 14h10v6.5H7z" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    warn: '<path d="M12 3.5 22 20H2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 10v4.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><circle cx="12" cy="17.3" r="1.1" fill="currentColor"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9l-5.4 2.9 1.1-6.1L3.2 9.4l6.1-.8z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    z: '<path d="M5 4.5h14L6.5 19.5H20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
    forum: '<path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5 4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 8.5h8M8 11.5h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    bell: '<path d="M12 4a6 6 0 0 0-6 6v3.2L4 17h16l-2-3.8V10a6 6 0 0 0-6-6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9.8 20a2.2 2.2 0 0 0 4.4 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    award: '<circle cx="12" cy="9.5" r="5.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m12 6.6.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3z" fill="currentColor"/><path d="m9 14-1.7 6 4.7-2.6 4.7 2.6L15 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    chev: '<path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    download: '<path d="M12 4v9.5m0 0L8 9.5m4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.5 16v2.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    asist: '<rect x="3.5" y="5" width="17" height="16" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="m8.5 14.5 2.4 2.4 4.6-4.9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    flame: '<path d="M12 3.5c1.5 3-2.5 5-2.5 8a4.4 4.4 0 0 0 8.8.2c0-1.8-.9-2.7-1.3-4.2-.4 1-1 1.6-1.8 2.2C15.6 7 14 4.7 12 3.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M10.2 15.4a2 2 0 0 0 1.8 2.2 2 2 0 0 0 1.9-2.3c-.6.5-1.2.5-1.8 0-.6-.5-.4-1.2-.3-1.8-.9.6-1.6 1.2-1.6 1.9z" fill="currentColor"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" fill="currentColor"/>',
    search: '<circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m15.3 15.3 4.7 4.7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    lock: '<rect x="5.5" y="10.5" width="13" height="9.5" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="15" r="1.4" fill="currentColor"/>',
    mic: '<rect x="9" y="2.5" width="6" height="11" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  speaker: '<path d="M4 9.5v5h3.5L12 19V5L7.5 9.5H4Z" fill="currentColor"/><path d="M15 9a4 4 0 0 1 0 6M17.5 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  msgs: '<path d="M4 5h16v10H9l-5 4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M20 8.5h1a1 1 0 0 1 1 1V18l-3-2.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'
  };
  window.ZI = function (name, cls) {
    return '<span class="ic' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><svg viewBox="0 0 24 24">' + (P[name] || P.page) + '</svg></span>';
  };
  window.Z_LOGO = '<svg class="logo" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#0C0C14"/><path d="M14 18h36L16 46h36" fill="none" stroke="#14B8A6" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 18h36" stroke="#7C3AED" stroke-width="7" stroke-linecap="round"/></svg>';

  /* Ziro · la cebra mascota de Zeiro (SVG propio, varias poses) */
  window.Z_ZEBRA = function (pose) {
    var comun =
      '<ellipse cx="18" cy="16" rx="7" ry="9" fill="#FFFFFF" stroke="#0C0C14" stroke-width="4"/>' +
      '<ellipse cx="18" cy="16" rx="2.6" ry="4" fill="#0C0C14"/>' +
      '<ellipse cx="62" cy="16" rx="7" ry="9" fill="#FFFFFF" stroke="#0C0C14" stroke-width="4"/>' +
      '<ellipse cx="62" cy="16" rx="2.6" ry="4" fill="#0C0C14"/>' +
      '<path d="M40 4c-5 0-8 3-8 8v6h16v-6c0-5-3-8-8-8z" fill="#0C0C14"/>' +
      '<path d="M33 6c-2-2-1-5 2-5" stroke="#0C0C14" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<path d="M47 6c2-2 1-5-2-5" stroke="#0C0C14" stroke-width="4" fill="none" stroke-linecap="round"/>';
    var cara =
      '<path d="M40 12C24 12 14 24 14 40v14c0 15 12 26 26 26s26-11 26-26V40c0-16-10-28-26-28z" fill="#FFFFFF" stroke="#0C0C14" stroke-width="4"/>' +
      '<path d="M17 28c6-6 14-9 23-9M16 40c7-7 15-10 24-10M18 52c6-5 13-8 20-8" stroke="#0C0C14" stroke-width="4.5" fill="none" stroke-linecap="round"/>' +
      '<circle cx="52" cy="44" r="3.2" fill="#0C0C14"/>' +
      '<circle cx="53.2" cy="42.8" r="1" fill="#fff"/>' +
      '<ellipse cx="46" cy="66" rx="12" ry="9" fill="#F6F3FE" stroke="#0C0C14" stroke-width="4"/>' +
      '<circle cx="42" cy="64" r="1.6" fill="#0C0C14"/><circle cx="50" cy="64" r="1.6" fill="#0C0C14"/>';
    if (pose === 'saludo') {
      return '<svg viewBox="0 0 80 92" class="ziro">' + comun +
        '<path d="M66 74q10 4 10-6" stroke="#14B8A6" stroke-width="5" fill="none" stroke-linecap="round"/>' +
        '<path d="M74 60l5-7M71 57l2-8M68 55v-8" stroke="#14B8A6" stroke-width="3.5" stroke-linecap="round"/>' +
        cara + '<path d="M38 70q4 3 8 0" stroke="#0C0C14" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>';
    }
    if (pose === 'pensar') {
      return '<svg viewBox="0 0 80 92" class="ziro">' + comun + cara +
        '<path d="M38 72h8" stroke="#0C0C14" stroke-width="3.5" stroke-linecap="round"/>' +
        '<path d="M63 22l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#7C3AED"/></svg>';
    }
    if (pose === 'fest') {
      return '<svg viewBox="0 0 80 92" class="ziro">' + comun + cara +
        '<path d="M36 70q6 5 12 0" stroke="#0C0C14" stroke-width="3.5" fill="none" stroke-linecap="round"/>' +
        '<circle cx="8" cy="34" r="2.4" fill="#7C3AED"/><circle cx="74" cy="30" r="2.4" fill="#14B8A6"/>' +
        '<circle cx="12" cy="22" r="2" fill="#2563EB"/><circle cx="72" cy="44" r="2" fill="#7C3AED"/></svg>';
    }
    return '<svg viewBox="0 0 80 92" class="ziro">' + comun + cara + '<path d="M38 70q4 3 8 0" stroke="#0C0C14" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>';
  };
})();

/* Packet-only Gearly UI. No remote service or access to personal worksheet values. */
(function (root) {
  'use strict';
  if (!root.GearlyCareerEngine || root.GearlyCareer) return;
  var doc = root.document;
  var engine = root.GearlyCareerEngine.create(doc);
  var base = new URL('.', doc.currentScript && doc.currentScript.src || root.location.href);
  var key = 'asme-career-gearly-session-v1';
  var motion = root.matchMedia('(prefers-reduced-motion: reduce)');
  var records = [], context = {}, pending = 0, generation = 0, lastFocus;
  var waveTimer = 0, stillTimer = 0, waveEpoch = 0, waveObjectURL = null, animationBlob = null;
  var defaults = ['How should I organize my resume?', 'How do I prepare for a career fair?', 'What is a STAR answer?', 'What if I do not have an internship?'];
  function el(tag, cls, text) {
    var node = doc.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function picture(file, cls) {
    var img = el('img', cls); img.src = new URL('sprites/' + file, base).href;
    img.alt = ''; img.width = 32; img.height = 32; img.draggable = false;
    return img;
  }
  function button(label, cls, action, text) {
    var node = el('button', cls, text === undefined ? label : text);
    node.type = 'button'; node.setAttribute('aria-label', label);
    node.addEventListener('click', action); return node;
  }
  var host = el('div', 'cg-root');
  var launcher = button('Open Gearly career guide', 'cg-launcher', open);
  launcher.setAttribute('aria-expanded', 'false'); launcher.setAttribute('aria-controls', 'career-gearly-panel');
  var face = picture('gearly-centered-idle.webp', 'cg-launcher-image'); launcher.append(face);
  launcher.append(el('span', 'cg-launcher-label', 'Ask Gearly'));
  var panel = el('div', 'cg-panel'); panel.id = 'career-gearly-panel'; panel.hidden = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Gearly career packet guide');
  panel.setAttribute('aria-modal', 'false');
  var header = el('div', 'cg-header'); header.append(picture('gearly-neutral-head.webp', 'cg-header-avatar'));
  var identity = el('div', 'cg-identity'); identity.append(el('strong', '', 'Gearly'), el('span', '', 'Your career packet guide'));
  header.append(identity, button('Reset conversation', 'cg-icon', reset, '↺'), button('Close Gearly', 'cg-icon', close, '×'));
  var feed = el('div', 'cg-messages'); feed.setAttribute('role', 'log');
  feed.setAttribute('aria-label', 'Conversation with Gearly'); feed.setAttribute('aria-live', 'polite');
  feed.setAttribute('aria-relevant', 'additions'); feed.setAttribute('tabindex', '0');
  var form = el('form', 'cg-form'); var input = el('input', 'cg-input');
  input.type = 'text'; input.maxLength = 1200; input.autocomplete = 'off';
  input.setAttribute('aria-label', 'Ask Gearly about the career packet'); input.placeholder = 'Ask about resumes, interviews…';
  var send = el('button', 'cg-send', '↑'); send.type = 'submit'; send.setAttribute('aria-label', 'Send question');
  form.append(input, send);
  var notice = el('p', 'cg-notice', 'Answers use this packet. Chat is saved in this tab’s session. Reset clears it.');
  panel.append(header, feed, form, notice); host.append(launcher, panel);
  function scrollFeed(item) {
    if (item && item.getBoundingClientRect().height > feed.clientHeight) {
      feed.scrollTop += item.getBoundingClientRect().top - feed.getBoundingClientRect().top - 14;
    } else feed.scrollTop = feed.scrollHeight;
  }
  function sourcesFor(value) {
    var seen = new Set();
    return Array.isArray(value) ? value.filter(function (s) {
      if (!s || seen.has(s.id)) return false;
      seen.add(s.id);
      return s && typeof s.id === 'string' && doc.getElementById(s.id) && doc.getElementById(s.id).closest('main > section');
    }).slice(0, 3).map(function (s) { return { id: s.id, title: String(s.title || 'packet section').slice(0, 180), excerpt: String(s.excerpt || '').slice(0, 360) }; }) : [];
  }
  function openSource(event, source) {
    event.preventDefault(); var target = doc.getElementById(source.id); if (!target) return;
    close(false);
    if (typeof root.closeMobileMenu === 'function') root.closeMobileMenu();
    var parent = target;
    while (parent && parent !== doc.body) { if (parent.tagName === 'DETAILS') parent.open = true; parent = parent.parentElement; }
    root.location.hash = encodeURIComponent(source.id);
    if (typeof root.updateMobileReadingView === 'function') root.updateMobileReadingView(false);
    // Wait for native hash navigation and the packet's chapter-mode scroll to finish.
    root.requestAnimationFrame(function () { root.requestAnimationFrame(function () {
      var offset = 12;
      doc.querySelectorAll('.nav,.topbar').forEach(function (node) {
        var rect = node.getBoundingClientRect(), pos = root.getComputedStyle(node).position;
        if ((pos === 'fixed' || pos === 'sticky') && rect.bottom > 0 && rect.top < 80) offset = Math.max(offset, rect.bottom + 12);
      });
      root.scrollTo({ top: Math.max(0, root.scrollY + target.getBoundingClientRect().top - offset), behavior: 'instant' });
      var hadIndex = target.hasAttribute('tabindex'); if (!hadIndex) target.tabIndex = -1;
      target.focus({ preventScroll: true });
      if (!hadIndex) target.addEventListener('blur', function () { target.removeAttribute('tabindex'); }, { once: true });
    }); });
  }
  function addSuggestions(parent, suggestions) {
    if (!Array.isArray(suggestions)) return;
    var choices = el('div', 'cg-suggestions');
    suggestions.filter(function (value) { return typeof value === 'string' && value.trim(); }).slice(0, 4).forEach(function (value) {
      var text = value.slice(0, 180); choices.append(button(text, 'cg-suggestion', function () { ask(text); }));
    });
    if (choices.childElementCount) parent.append(choices);
  }
  function message(record, save) {
    var item = el('div', 'cg-message cg-' + record.who);
    if (record.who === 'bot') item.append(picture('gearly-neutral-head.webp', 'cg-message-avatar'));
    var text = el('p', 'cg-message-text', record.text); item.append(text);
    sourcesFor(record.sources).forEach(function (source) {
      var a = el('a', 'cg-source'); a.href = '#' + encodeURIComponent(source.id);
      a.append(el('strong', '', 'Open ' + source.title));
      if (source.excerpt) a.append(el('span', '', source.excerpt));
      a.addEventListener('click', function (event) { openSource(event, source); }); item.append(a);
    });
    addSuggestions(item, record.suggestions); feed.append(item);
    while (feed.querySelectorAll('.cg-message').length > 24) feed.querySelector('.cg-message').remove();
    if (save) { records.push(record); records = records.slice(-24); persist(); }
    scrollFeed(save && record.who === 'bot' ? item : null); return item;
  }
  function boundedContext(value) {
    if (!value || !Array.isArray(engine.sections) || engine.sections.indexOf(value.section) === -1) return {};
    return { section: value.section, terms: Array.isArray(value.terms) ? value.terms.filter(function (text) { return typeof text === 'string'; }).slice(0, 6).map(function (text) { return text.slice(0, 40); }) : [], excerpts: Array.isArray(value.excerpts) ? value.excerpts.filter(function (text) { return typeof text === 'string'; }).slice(0, 3).map(function (text) { return text.slice(0, 2000); }) : [] };
  }
  function persist() {
    try { root.sessionStorage.setItem(key, JSON.stringify({ version: 1, messages: records, context: boundedContext(context) })); } catch (_) { /* Storage can be unavailable in private sessions. */ }
  }
  function welcome() {
    message({ who: 'bot', text: 'Hi, I’m Gearly! Ask me about this career packet, and I’ll point you to the relevant advice, examples, and tools.', suggestions: defaults }, false);
  }
  function restore() {
    try {
      var snapshot = JSON.parse(root.sessionStorage.getItem(key) || '[]');
      var saved = Array.isArray(snapshot) ? snapshot : snapshot && snapshot.messages;
      context = boundedContext(snapshot && snapshot.context);
      if (Array.isArray(saved)) records = saved.slice(-24).filter(function (r) {
        return r && (r.who === 'bot' || r.who === 'user') && typeof r.text === 'string' && r.text.length <= 8000;
      }).map(function (r) {
        return { who: r.who, text: r.text, sources: r.who === 'bot' ? sourcesFor(r.sources) : [], suggestions: Array.isArray(r.suggestions) ? r.suggestions.filter(function (s) { return typeof s === 'string'; }).slice(0, 4) : [] };
      });
    } catch (_) { records = []; }
    if (records.length) records.forEach(function (r) { message(r, false); }); else welcome();
  }
  function ask(query) {
    query = String(query || '').trim().slice(0, 1200); if (!query) return;
    if (panel.hidden) open(); if (pending) return;
    input.value = ''; message({ who: 'user', text: query }, true);
    var turn = ++generation; var activity = el('div', 'cg-activity');
    activity.setAttribute('role', 'status'); activity.append(picture('gearly-thinking-chin.webp', 'cg-thinking'), el('span', '', 'Gearly is checking the packet…'));
    feed.append(activity); feed.setAttribute('aria-busy', 'true'); send.disabled = true; scrollFeed();
    pending = root.setTimeout(function () {
      if (turn !== generation) return;
      pending = 0; activity.remove(); feed.removeAttribute('aria-busy'); send.disabled = false;
      var result;
      try { result = engine.answer(query, context); } catch (_) { result = { text: 'I couldn’t check that just now. Try a shorter question, or use the packet’s chapter menu.', suggestions: defaults }; }
      context = result.context && typeof result.context === 'object' ? result.context : {};
      message({ who: 'bot', text: String(result.text || 'I could not find that in this packet. Try asking about resumes, interviews, or career fairs.').slice(0, 8000), sources: sourcesFor(result.sources), suggestions: result.suggestions }, true);
    }, motion.matches ? 0 : 320);
  }
  function reset() {
    generation++; if (pending) root.clearTimeout(pending); pending = 0;
    context = {}; records = []; input.value = ''; feed.replaceChildren(); feed.removeAttribute('aria-busy'); send.disabled = false;
    try { root.sessionStorage.removeItem(key); } catch (_) {}
    welcome(); if (!panel.hidden) input.focus();
  }
  function stopWave() {
    waveEpoch++;
    root.clearTimeout(waveTimer); root.clearTimeout(stillTimer); waveTimer = 0; stillTimer = 0;
    face.src = new URL('sprites/gearly-centered-idle.webp', base).href;
    if (waveObjectURL) { root.URL.revokeObjectURL(waveObjectURL); waveObjectURL = null; }
  }
  function canWave(epoch) { return epoch === waveEpoch && !motion.matches && panel.hidden && !doc.hidden; }
  function loadAnimation() {
    if (!animationBlob) {
      animationBlob = root.fetch(new URL('sprites/gearly-centered-wave.webp', base).href, { credentials: 'same-origin' }).then(function (response) {
        if (!response.ok) throw new Error('Animation unavailable');
        return response.blob();
      }).catch(function (error) { animationBlob = null; throw error; });
    }
    return animationBlob;
  }
  function decoded(image) {
    if (typeof image.decode === 'function') return image.decode();
    if (image.complete && image.naturalWidth) return Promise.resolve();
    return new Promise(function (resolve, reject) { image.onload = resolve; image.onerror = reject; });
  }
  function scheduleWave(first) {
    stopWave(); if (motion.matches || !panel.hidden || doc.hidden || !root.URL.createObjectURL || !root.fetch) return;
    var epoch = waveEpoch;
    waveTimer = root.setTimeout(async function () {
      if (!canWave(epoch)) return;
      var url;
      try {
        var blob = await loadAnimation();
        if (!canWave(epoch)) return;
        url = root.URL.createObjectURL(blob); waveObjectURL = url;
        var preloader = new root.Image(); preloader.src = url;
        await decoded(preloader);
        if (!canWave(epoch)) { root.URL.revokeObjectURL(url); return; }
        face.src = url; await decoded(face);
        if (!canWave(epoch)) { root.URL.revokeObjectURL(url); return; }
        stillTimer = root.setTimeout(function () { scheduleWave(false); }, 6250);
      } catch (_) {
        if (canWave(epoch)) scheduleWave(false);
        else if (url) root.URL.revokeObjectURL(url);
      }
    }, (first ? 8000 : 60000) + Math.floor(Math.random() * (first ? 4000 : 30000)));
  }
  function open() {
    if (!panel.hidden) { input.focus(); return; }
    lastFocus = doc.activeElement; panel.hidden = false; launcher.hidden = true;
    launcher.setAttribute('aria-expanded', 'true'); stopWave(); input.focus(); scrollFeed(feed.querySelector('.cg-bot:last-child'));
  }
  function close(returnFocus) {
    if (panel.hidden) return;
    panel.hidden = true; launcher.hidden = false; launcher.setAttribute('aria-expanded', 'false'); scheduleWave(false);
    if (returnFocus !== false) { if (lastFocus && lastFocus !== doc.body && lastFocus.isConnected && !panel.contains(lastFocus)) lastFocus.focus(); else launcher.focus(); }
  }
  form.addEventListener('submit', function (event) { event.preventDefault(); ask(input.value); });
  panel.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
    if (event.key !== 'Tab') return;
    var focusable = Array.prototype.slice.call(panel.querySelectorAll('button:not(:disabled),input,a[href],[tabindex="0"]')).filter(function (n) { return !n.hidden; });
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && doc.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && doc.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  function motionChanged() { if (motion.matches) stopWave(); else scheduleWave(false); }
  if (motion.addEventListener) motion.addEventListener('change', motionChanged);
  else if (motion.addListener) motion.addListener(motionChanged);
  doc.addEventListener('visibilitychange', function () { if (doc.hidden) stopWave(); else scheduleWave(false); });
  face.addEventListener('error', function () {
    // A failed animation must leave the known static launcher visible.
    if (waveObjectURL && face.src === waveObjectURL) scheduleWave(false);
  });
  root.addEventListener('pagehide', stopWave);
  doc.body.append(host); restore(); scheduleWave(true);
  root.GearlyCareer = { open: open, close: close, ask: ask, reset: reset };
})(window);

/* Austria trip companion. Plain JS, no build step. All content comes from trip-data.json. */
(function () {
  'use strict';

  var ICONS = {
    bed: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
    nav: '<path d="M3 11l18-8-8 18-2-8-8-2z"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    stroller: '<path d="M12 4a8 8 0 0 1 8 8h-8z"/><path d="M4 12h16a6 6 0 0 1-6 5h-4a6 6 0 0 1-6-5z"/><path d="M4 12 2.5 8"/><circle cx="9" cy="20" r="1.5"/><circle cx="15" cy="20" r="1.5"/>',
    chevR: '<path d="m9 18 6-6-6-6"/>',
    chevD: '<path d="m6 9 6 6 6-6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    map: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15"/><path d="M15 6v15"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
    bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    sticker: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    image: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
    offline: '<circle cx="12" cy="12" r="10"/><path d="m8.5 12.5 2.5 2.5 4.5-5.5"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3 6 1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2"/>'
  };
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var TABS = ['today', 'itinerary', 'places', 'info'];

  var data = null;
  var state = { filter: 'all', hub: null, offlineReady: false, timer: null };

  /* ---------- helpers ---------- */
  function icon(name) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || '') + '</svg>'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function isPlaceholder(s) { return !s || /\[.*\]/.test(s); }
  function mapsUrl(q) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q); }
  function parse(d) { var p = d.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
  function diffDays(a, b) { return Math.round((parse(a) - parse(b)) / 86400000); }
  function addDays(d, n) { var x = parse(d); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); }
  function fmt(d) { var x = parse(d); return DAYS[x.getUTCDay()] + ' ' + x.getUTCDate() + ' ' + MONTHS[x.getUTCMonth()]; }
  function fmtShort(d) { var x = parse(d); return DAYS[x.getUTCDay()] + ' ' + x.getUTCDate(); }
  function dow(d) { return DAYS[parse(d).getUTCDay()]; }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }

  function todayStr() {
    var m = /[?&]date=(\d{4}-\d{2}-\d{2})/.exec(location.search);
    if (m) return m[1];
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: data.trip.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    } catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  function phase(t) { return t < data.trip.start ? 'before' : (t > data.trip.end ? 'after' : 'during'); }
  function baseFor(t) {
    for (var i = 0; i < data.bases.length; i++) { var b = data.bases[i]; if (b.from <= t && t < b.to) return b; }
    return null;
  }
  function legOn(d) { return data.legs.filter(function (l) { return l.date === d; })[0] || null; }
  function flightOn(d) { return data.flights.filter(function (f) { return f.date === d; })[0] || null; }
  // The hub whose places we show by default: Wagrain until the move to Zell am See, then Zell.
  function defaultHub(t) { return t >= data.hubs[1].from ? data.hubs[1].id : data.hubs[0].id; }
  function driveText(min) {
    if (!min) return 'On foot';
    if (min < 60) return '~' + min + ' min';
    var h = Math.floor(min / 60), m = min % 60;
    return '~' + h + ' h' + (m ? ' ' + (m < 10 ? '0' : '') + m : '');
  }
  function placesFor(hubId) {
    return data.places.slice().sort(function (a, b) { return a.driveMin[hubId] - b.driveMin[hubId]; });
  }
  function doneLast(list) { return list.filter(function (p) { return !isDone(p.id); }).concat(list.filter(function (p) { return isDone(p.id); })); }
  function isDone(id) { return store('done:' + id) === '1'; }

  function photoSrc(localPath, remoteUrl) {
    if (data.trip.photoSource === 'local') return localPath || '';
    return remoteUrl || '';
  }
  function photoBox(cls, src, alt, fallbackIcon, eager, inner) {
    var img = src ? '<img src="' + esc(src) + '" alt="' + esc(alt) + '"' + (eager ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async" data-retry="1">' : '';
    return '<div class="photo ' + cls + '"' + (src ? '' : ' role="img" aria-label="' + esc(alt) + '"') + '>' + icon(fallbackIcon || 'image') + img + (inner || '') + '</div>';
  }
  function navBtn(q, label, extra) { return '<a class="btn btn--nav ' + (extra || '') + '" href="' + mapsUrl(q) + '" target="_blank" rel="noopener">' + icon('nav') + esc(label || 'Navigate') + '</a>'; }
  function callBtn(phone, label, extra) {
    if (isPlaceholder(phone)) return '';
    return '<a class="btn btn--call ' + (extra || '') + '" href="tel:' + esc(phone.replace(/[^+\d]/g, '')) + '">' + icon('phone') + esc(label || 'Call') + '</a>';
  }
  function checkInText(v) { return isPlaceholder(v) || /[–-]/.test(v) ? v : 'from ' + v; }
  function checkOutText(v) { return 'by ' + v; }
  function stayCells(stay, outDay, dayInValue) {
    return '<div class="cells">' +
      '<div class="cell cell--blue"><div class="cell-label">Check-in</div><div class="cell-value">' + esc(checkInText(stay.checkIn)) + '</div></div>' +
      '<div class="cell cell--yellow"><div class="cell-label">Check-out' + (dayInValue ? '' : ' · ' + outDay) + '</div><div class="cell-value">' + esc((dayInValue ? outDay + ', ' : '') + checkOutText(stay.checkOut)) + '</div></div>' +
      '</div>';
  }
  function notePills(notes) {
    if (!notes || !notes.length) return '';
    return '<div class="pills">' + notes.map(function (n) { return '<span class="pill pill--red pill--wrap">' + esc(n) + '</span>'; }).join('') + '</div>';
  }
  function catOf(id) { return data.categories.filter(function (c) { return c.id === id; })[0]; }

  /* ---------- Today ---------- */
  function renderToday() {
    var el = document.getElementById('today');
    var t = todayStr(), ph = phase(t);
    clearInterval(state.timer);
    if (ph === 'before') { el.innerHTML = countdownHtml(t); tickCountdown(); state.timer = setInterval(tickCountdown, 30000); return; }
    if (ph === 'after') {
      el.innerHTML = '<div class="page"><header class="page-head"><div><h1 class="h1">Trip complete</h1><div class="sub">' + esc(data.trip.title) + ' · ' + fmt(data.trip.start) + ' – ' + fmt(data.trip.end) + '</div></div></header>' + timelineHtml(t) + '</div>';
      return;
    }
    var lastDay = t === data.trip.end;
    var base = baseFor(t) || data.bases[data.bases.length - 1];
    var dayNo = diffDays(t, data.trip.start) + 1;
    var heroSrc = photoSrc(base.heroPhoto, base.heroPhotoUrl);
    var offlinePill = '<span class="pill pill--green" id="offline-pill"' + (state.offlineReady ? '' : ' hidden') + '>' + icon('offline') + 'Saved offline</span>';
    var html = '<header class="hero">' + photoBox('', heroSrc, base.name, base.icon || 'image', true) +
      '<div class="hero-pills"><span class="pill pill--accent">Day ' + dayNo + ' of ' + data.trip.days + '</span><span class="pill pill--card">' + fmt(t) + '</span>' + offlinePill + '</div>' +
      '<div class="hero-title"><h1>' + esc(lastDay ? 'Flying home' : base.name) + '</h1></div></header>';
    html += '<div class="today-body">';

    if (lastDay) {
      var f = flightOn(t);
      html += '<section class="stay-card" aria-label="Flight home"><div><span class="pill pill--blue pill--lg">' + icon('plane') + 'Today’s flight</span></div>' +
        flightHtml(f) + '<div class="btn-row">' + navBtn(f.fromMapsQuery || 'Vienna International Airport', 'Navigate to terminal', 'btn--hero') + '</div></section>';
    } else {
      var night = diffDays(t, base.from) + 1;
      var s = base.stay;
      html += '<section class="stay-card" aria-label="Tonight’s stay">' +
        '<div><span class="pill pill--green pill--lg">' + icon('bed') + 'Tonight’s stay · night ' + night + ' of ' + base.nights + '</span></div>' +
        '<div class="stay-head"><h2 class="stay-name">' + esc(s.name) + '</h2><div class="stay-addr">' + esc(s.address) + '</div></div>' +
        stayCells(s, dow(base.to), false) + notePills(s.notes) +
        '<div class="btn-row">' + navBtn(s.mapsQuery, 'Navigate', 'btn--hero') + callBtn(s.phone, base.id === 'wagrain' || base.id === 'zell' ? 'Call host' : 'Call', 'btn--hero') + '</div></section>';
    }

    if (!lastDay) html += driveCardHtml(t);

    var ideas = ideasFor(base, lastDay);
    if (ideas.length) {
      html += '<section class="ideas" aria-label="Ideas near you"><div class="ideas-head"><h2 class="h2">Ideas near you</h2><a class="link-more" href="#places">All places' + icon('chevR') + '</a></div>' +
        '<div class="hs ideas-row">' + ideas.map(function (p) { return ideaHtml(p, base.id); }).join('') + '</div></section>';
    }
    html += '</div>';
    el.innerHTML = html;
  }

  function driveCardHtml(t) {
    var leg = legOn(t), fl = flightOn(t), tm = addDays(t, 1);
    var legT = legOn(tm), flT = flightOn(tm);
    var ic = 'car', title;
    if (leg) title = 'Today: ' + leg.from + ' → ' + leg.to + ' · ' + leg.duration;
    else if (fl) { title = 'Flight today: ' + fl.number + ' · ' + fl.departLocal + ' → ' + fl.arriveLocal; ic = 'plane'; }
    else title = 'No driving today';
    var sub = '';
    if (legT) sub = 'Tomorrow: ' + legT.from + ' → ' + legT.to + ' · ' + legT.duration;
    else if (flT) sub = 'Tomorrow: ' + flT.number + ' ' + flT.from + ' → ' + flT.to + ' · ' + flT.departLocal;
    else if (fl && fl.label === 'outbound') sub = 'Then pick up the car at Vienna Airport';
    return '<section class="drive-card" aria-label="Today’s drive"><div class="drive-icon">' + icon(ic) + '</div><div class="drive-text"><div class="drive-title">' + esc(title) + '</div>' +
      (sub ? '<div class="drive-sub">' + esc(sub) + '</div>' : '') + '</div></section>';
  }

  function ideasFor(base, lastDay) {
    if (lastDay || (base.id !== 'wagrain' && base.id !== 'zell')) return [];
    return doneLast(placesFor(base.id).filter(function (p) { return p.driveMin[base.id] <= 60; })).slice(0, 8);
  }
  function ideaHtml(p, hubId) {
    var cat = catOf(p.categories[0]), st = data.strollerStates[p.stroller];
    return '<article class="idea' + (isDone(p.id) ? ' is-done' : '') + '">' +
      photoBox('', photoSrc(p.photo, p.photoUrl), p.name, 'image', false, '<span class="pill pill--card photo-tag">' + esc(cat.label) + '</span>') +
      '<div class="idea-body"><h3>' + esc(p.name) + '</h3><div class="idea-short">' + esc(p.short) + '</div>' +
      '<div class="pills"><span class="pill pill--yellow">' + icon('car') + esc(driveText(p.driveMin[hubId])) + '</span><span class="pill pill--blue">' + icon('clock') + esc(p.timeThere) + '</span><span class="pill pill--' + st.color + '">' + icon('stroller') + esc(st.label) + '</span></div>' +
      '<div class="btn-row">' + navBtn(p.mapsQuery, 'Navigate', 'btn--sm') + '</div></div></article>';
  }

  function countdownHtml(t) {
    var n = diffDays(data.trip.start, t), f = data.flights[0], first = data.bases[0], s = first.stay;
    return '<div class="page"><header class="page-head"><div><h1 class="h1">' + n + (n === 1 ? ' day' : ' days') + ' to go</h1><div class="sub">' + esc(data.trip.title) + ' · ' + fmt(data.trip.start) + ' – ' + fmt(data.trip.end) + '</div></div>' +
      '<span class="pill pill--green" id="offline-pill"' + (state.offlineReady ? '' : ' hidden') + '>' + icon('offline') + 'Saved offline</span></header>' +
      '<section class="card" aria-label="Countdown to the flight"><div><span class="pill pill--blue pill--lg">' + icon('plane') + 'Until take-off</span></div>' +
      '<div class="count-cells" aria-live="off"><div class="count-cell"><span class="count-num" id="cd-d">–</span><span class="count-label">days</span></div><div class="count-cell"><span class="count-num" id="cd-h">–</span><span class="count-label">hours</span></div><div class="count-cell"><span class="count-num" id="cd-m">–</span><span class="count-label">minutes</span></div></div>' +
      flightHtml(f) + '<div class="btn-row">' + navBtn(f.fromMapsQuery || 'Ben Gurion Airport', 'Navigate to airport') + '</div></section>' +
      '<section class="card" aria-label="First night"><div><span class="pill pill--green pill--lg">' + icon('bed') + 'First night · ' + fmt(first.from) + '</span></div>' +
      '<div class="stay-head"><h2 class="h2">' + esc(s.name) + '</h2><div class="stay-addr">' + esc(s.address) + '</div></div>' + stayCells(s, dow(first.to), false) + notePills(s.notes) +
      '<div class="btn-row">' + navBtn(s.mapsQuery) + callBtn(s.phone) + '</div></section>' +
      '<div class="link-list"><a class="btn btn--link" href="#info" data-scroll="packing"><span class="icon-row">' + icon('list') + 'Packing checklist</span>' + icon('chevR') + '</a>' +
      '<a class="btn btn--link" href="#itinerary"><span class="icon-row">' + icon('map') + 'Full itinerary</span>' + icon('chevR') + '</a></div></div>';
  }
  function tickCountdown() {
    var d = document.getElementById('cd-d'); if (!d) return;
    var ms = Math.max(0, new Date(data.flights[0].departUtc) - new Date());
    var mins = Math.floor(ms / 60000);
    d.textContent = Math.floor(mins / 1440);
    document.getElementById('cd-h').textContent = Math.floor((mins % 1440) / 60);
    document.getElementById('cd-m').textContent = mins % 60;
  }

  /* ---------- Itinerary ---------- */
  function renderItinerary() {
    var t = todayStr();
    document.getElementById('itinerary').innerHTML = '<div class="page"><header class="page-head"><div><h1 class="h1">Itinerary</h1><div class="sub">' +
      fmt(data.trip.start) + ' – ' + fmt(data.trip.end) + ' · ' + (data.trip.days - 1) + ' nights</div></div></header>' + timelineHtml(t) + '</div>';
  }
  function dotHtml(status) {
    if (status === 'done') return '<div class="dot--done">' + icon('check') + '</div>';
    return '<div class="dot--' + (status === 'now' ? 'now' : 'next') + '"></div>';
  }
  function timelineHtml(t) {
    var html = '<div class="timeline"><div class="rail"></div>';
    data.bases.forEach(function (b) {
      var leg = legOn(b.from);
      if (leg) html += '<div class="leg-row"><div class="leg-dot-col"><div class="leg-dot">' + icon('car') + '</div></div><div class="leg-text"><span>' + esc(leg.from + ' → ' + leg.to) + '</span><span class="pill pill--blue">' + icon('clock') + esc(leg.duration) + '</span></div></div>';
      var status = t >= b.to ? 'done' : (b.from <= t ? 'now' : 'next');
      html += stopHtml(b, status);
    });
    var f = data.flights[data.flights.length - 1];
    var fs = t > f.date ? 'done' : (t === f.date ? 'now' : 'next');
    html += '<div class="stop-row"><div class="stop-dot-col"><div class="dot-wrap">' + dotHtml(fs) + '</div></div><details class="stop' + (fs === 'now' ? ' stop--now' : '') + '"' + (fs === 'now' ? ' open' : '') + '>' +
      '<summary><div class="thumb thumb--icon thumb--blue">' + icon('plane') + '</div><div class="stop-text"><div class="stop-date">' + fmt(f.date) + '</div><div class="stop-title">Fly home</div><div class="secondary">' + esc(f.from + ' → ' + f.to + ' · ' + f.departLocal) + '</div></div>' + sideHtml(fs) + '</summary>' +
      '<div class="stop-body"><div class="icon-row"><div class="icon-tile icon-tile--blue">' + icon('plane') + '</div><div class="icon-row-text"><div class="strong">' + esc(f.number + ' · ' + f.departLocal + ' → ' + f.arriveLocal) + '</div><div class="secondary">' + esc(f.terminals) + ', local times</div></div></div>' +
      '<div class="btn-row">' + navBtn(f.fromMapsQuery || 'Vienna International Airport', 'Navigate to terminal') + '</div></div></details></div>';
    return html + '</div>';
  }
  function sideHtml(status) { return '<div class="stop-side">' + (status === 'now' ? '<span class="pill pill--accent">Now</span>' : '') + '<span class="chev">' + icon('chevD') + '</span></div>'; }
  function stopHtml(b, status) {
    var s = b.stay, src = photoSrc(b.heroPhoto, b.heroPhotoUrl);
    var dateLine = b.nights > 1 ? fmtShort(b.from) + ' – ' + fmt(b.to) : fmt(b.from);
    var thumb = b.icon ? '<div class="thumb thumb--icon thumb--yellow">' + icon(b.icon) + '</div>' : photoBox('thumb', src, b.name, 'image', false);
    var cls = 'stop' + (status === 'now' ? ' stop--now' : '') + (b.placeholder ? ' stop--placeholder' : '');
    var body = '';
    if (status === 'now' && src) body += photoBox('stop-photo', src, b.name, 'image', false);
    (b.extras || []).forEach(function (x) {
      body += '<div class="icon-row"><div class="icon-tile icon-tile--' + (x.icon === 'plane' ? 'blue' : 'yellow') + '">' + icon(x.icon) + '</div><div class="icon-row-text"><div class="strong">' + esc(x.title) + '</div><div class="secondary">' + esc(x.sub) + '</div></div></div>';
    });
    body += '<div class="icon-row"><div class="icon-tile icon-tile--green">' + icon('bed') + '</div><div class="icon-row-text"><div class="strong">' + esc(s.name) + '</div><div class="secondary">' + esc(s.address) + '</div></div></div>' +
      stayCells(s, dow(b.to), true) + notePills(s.notes) + '<div class="btn-row">' + navBtn(s.mapsQuery) + callBtn(s.phone) + '</div>';
    return '<div class="stop-row"><div class="stop-dot-col"><div class="dot-wrap">' + dotHtml(status) + '</div></div><details class="' + cls + '"' + (status === 'now' ? ' open' : '') + '>' +
      '<summary>' + thumb + '<div class="stop-text"><div class="stop-date">' + dateLine + '</div><div class="stop-title">' + esc(b.itineraryTitle || b.name) + '</div><div class="secondary">' + esc(b.itineraryMeta || b.summary) + '</div></div>' + sideHtml(status) + '</summary>' +
      '<div class="stop-body">' + body + '</div></details></div>';
  }

  /* ---------- Places ---------- */
  function renderPlaces() {
    var t = todayStr();
    var hubId = state.hub || defaultHub(t);
    var listUrl = data.trip.mapsListUrl;
    var html = '<div class="page page--tight"><h1 class="h1" style="padding:0 4px">Places</h1>';
    html += '<div class="hubs" role="group" aria-label="Choose where you are staying">' + data.hubs.map(function (h) {
      return '<button type="button" class="hub" data-hub="' + h.id + '" aria-pressed="' + (h.id === hubId) + '"><span class="hub-from">From</span><span class="hub-name">' + esc(h.title) + '</span><span class="hub-sub">' + esc(h.sub) + '</span></button>';
    }).join('') + '</div>';
    html += '<div class="hs chips" role="group" aria-label="Filter places"><button type="button" class="chip chip--all" data-filter="all" aria-pressed="' + (state.filter === 'all') + '">All</button>' +
      data.categories.map(function (c) { return '<button type="button" class="chip chip--' + c.color + '" data-filter="' + c.id + '" aria-pressed="' + (state.filter === c.id) + '">' + esc(c.label) + '</button>'; }).join('') + '</div>';
    var list = placesFor(hubId).filter(function (p) { return state.filter === 'all' || p.categories.indexOf(state.filter) > -1; });
    var min = -1;
    data.driveBands.forEach(function (band) {
      var inBand = doneLast(list.filter(function (p) { var m = p.driveMin[hubId]; return m > min && m <= band.max; }));
      min = band.max;
      if (!inBand.length) return;
      html += '<div class="group-head"><h2 class="h2">' + esc(band.title) + '</h2><div class="group-sub">' + esc(band.sub) + ' · ' + inBand.length + '</div></div>' + inBand.map(function (p) { return placeHtml(p, hubId); }).join('');
    });
    if (!list.length) html += '<p class="empty">Nothing in this category.</p>';
    if (!isPlaceholder(listUrl)) html += '<a class="btn btn--outline-blue" href="' + esc(listUrl) + '" target="_blank" rel="noopener">' + icon('map') + 'Open our list in Google Maps</a>';
    document.getElementById('places').innerHTML = html + '</div>';
  }
  function placeHtml(p, hubId) {
    var cat = catOf(p.categories[0]), st = data.strollerStates[p.stroller], done = isDone(p.id);
    return '<article class="place' + (done ? ' is-done' : '') + '">' +
      photoBox('', photoSrc(p.photo, p.photoUrl), p.name, 'image', false, '<span class="pill pill--card photo-tag">' + esc(cat.label) + '</span>') +
      '<div class="place-body"><h3>' + esc(p.name) + '</h3>' +
      '<ul class="todo">' + p.whatToDo.map(function (w) { return '<li>' + icon('check') + '<span>' + esc(w) + '</span></li>'; }).join('') + '</ul>' +
      '<div class="cells"><div class="cell cell--blue"><div class="cell-label">' + icon('clock') + 'Time there</div><div class="cell-value cell-value--lg">' + esc(p.timeThere) + '</div></div>' +
      '<div class="cell cell--yellow"><div class="cell-label">' + icon('car') + 'Drive</div><div class="cell-value cell-value--lg">' + esc(driveText(p.driveMin[hubId])) + '</div></div></div>' +
      '<div class="stroller stroller--' + st.color + '">' + icon('stroller') + '<div><div class="strong">' + esc(st.label) + '</div><div class="stroller-note">' + esc(p.strollerNote) + '</div></div></div>' +
      '<div class="btn-row">' + navBtn(p.mapsQuery) + '<button type="button" class="done-btn" data-done="' + esc(p.id) + '" aria-pressed="' + done + '" aria-label="Mark as done: ' + esc(p.name) + '">' + icon('check') + '</button></div>' +
      '</div></article>';
  }

  /* ---------- Info ---------- */
  function flightHtml(f) {
    return '<div class="flight"><div class="flight-top"><span>' + fmt(f.date) + ' · ' + esc(f.label) + '</span><span class="pill pill--blue">' + esc(f.airline + ' ' + f.number) + '</span></div>' +
      '<div class="flight-times"><div class="flight-end"><span class="flight-time">' + esc(f.departLocal) + '</span><span class="flight-code">' + esc(f.from) + '</span></div>' +
      '<div class="flight-line"><span></span>' + icon('plane') + '<span></span></div>' +
      '<div class="flight-end flight-end--right"><span class="flight-time">' + esc(f.arriveLocal) + '</span><span class="flight-code">' + esc(f.to) + '</span></div></div>' +
      '<div class="secondary">' + esc(f.terminals) + '</div></div>';
  }
  function effectiveTheme() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function syncThemeColor() {
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', effectiveTheme() === 'dark' ? '#12201A' : '#FFF8EC');
  }
  function renderInfo() {
    var c = data.car, dark = effectiveTheme() === 'dark';
    var html = '<div class="page"><header class="page-head"><div><h1 class="h1">Info</h1><div class="sub">Flights, car and things to remember</div></div>' +
      '<button type="button" class="theme-btn" id="theme-btn" aria-label="Switch to ' + (dark ? 'light' : 'dark') + ' mode">' + icon(dark ? 'sun' : 'moon') + '</button></header>';
    html += '<section class="card" aria-label="Flights"><div><span class="pill pill--blue pill--lg">' + icon('plane') + 'Flights</span></div>' +
      data.flights.map(flightHtml).join('<div class="rule"></div>') + '<div class="small">All times are local. Check the terminal again on the day.</div></section>';
    html += '<section class="card" aria-label="Car rental"><div><span class="pill pill--yellow pill--lg">' + icon('car') + 'Car rental</span></div>' +
      '<div class="kv"><div class="kv-label">Company</div><div class="strong">' + esc(c.company) + '</div></div>' +
      '<div class="kv-grid"><div class="kv"><div class="kv-label">Pick-up</div><div class="strong">' + fmt(c.pickUp.date) + ' · ' + esc(c.pickUp.time) + '</div><div class="secondary">' + esc(c.pickUp.place) + '</div></div>' +
      '<div class="kv"><div class="kv-label">Return</div><div class="strong">' + fmt(c['return'].date) + ' · ' + esc(c['return'].time) + '</div><div class="secondary">' + esc(c['return'].place) + '</div></div></div>' +
      notePills(c.notes) + '<div class="btn-row">' + navBtn(c.mapsQuery) + callBtn(c.phone) + '</div></section>';
    html += '<section class="card" aria-label="Good to know"><h2 class="h2">Good to know</h2>' + data.notes.map(function (n) {
      return '<div class="note note--' + n.color + '">' + icon(n.icon) + '<div class="note-text"><div class="note-title">' + esc(n.title) + '</div><div>' + esc(n.text) + '</div>' +
        (n.tel ? '<a class="btn btn--sos" href="tel:' + esc(n.tel) + '">' + icon('phone') + 'Call ' + esc(n.tel) + '</a>' : '') + '</div></div>';
    }).join('') + '</section>';
    html += '<section class="card card--tight" id="packing" aria-label="Packing checklist"><h2 class="h2">Packing checklist</h2><div class="checklist">' + data.checklist.map(function (item, i) {
      return '<label class="check-row" for="pk' + i + '"><input id="pk' + i + '" type="checkbox" data-check="' + i + '"' + (store('check:' + i) === '1' ? ' checked' : '') + '><span>' + esc(item) + '</span></label>';
    }).join('') + '</div></section>';
    var credits = [];
    data.bases.concat(data.places).forEach(function (x) { if (x.photoCredit) credits.push(x); });
    if (credits.length && data.trip.photoSource !== 'local') {
      html += '<details class="credits"><summary>Photo credits</summary>' + credits.map(function (x) {
        var pc = x.photoCredit;
        return '<div>' + esc(x.name) + ': <a href="https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(pc.file.replace(/ /g, '_')) + '" target="_blank" rel="noopener">' + esc(pc.author) + '</a>, ' + esc(pc.license) + ', via Wikimedia Commons</div>';
      }).join('') + '</details>';
    }
    document.getElementById('info').innerHTML = html + '</div>';
  }

  /* ---------- routing, events ---------- */
  function currentTab() {
    var h = location.hash.replace('#', '');
    if (TABS.indexOf(h) > -1) return h;
    return 'today';
  }
  function showTab() {
    var tab = currentTab();
    TABS.forEach(function (id) { document.getElementById(id).hidden = id !== tab; });
    Array.prototype.forEach.call(document.querySelectorAll('.tabbar a'), function (a) {
      if (a.getAttribute('data-tab') === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    window.scrollTo(0, 0);
  }
  function renderAll() { renderToday(); renderItinerary(); renderPlaces(); renderInfo(); }

  document.addEventListener('click', function (e) {
    var chip = e.target.closest('[data-filter]');
    if (chip) {
      state.filter = chip.getAttribute('data-filter');
      var x = document.querySelector('.chips').scrollLeft;
      renderPlaces();
      document.querySelector('.chips').scrollLeft = x;
      var again = document.querySelector('[data-filter="' + state.filter + '"]'); if (again) again.focus();
      return;
    }
    var hubBtn = e.target.closest('[data-hub]');
    if (hubBtn) {
      state.hub = hubBtn.getAttribute('data-hub');
      renderPlaces(); window.scrollTo(0, 0);
      var pressed = document.querySelector('[data-hub="' + state.hub + '"]'); if (pressed) pressed.focus();
      return;
    }
    var done = e.target.closest('[data-done]');
    if (done) {
      var id = done.getAttribute('data-done');
      store('done:' + id, isDone(id) ? null : '1');
      var y = window.scrollY; renderPlaces(); renderToday(); window.scrollTo(0, y);
      return;
    }
    if (e.target.closest('#theme-btn')) {
      var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      store('theme', next); syncThemeColor(); renderInfo();
      var b = document.getElementById('theme-btn'); if (b) b.focus();
      return;
    }
    var jump = e.target.closest('[data-scroll]');
    if (jump) setTimeout(function () { var s = document.getElementById(jump.getAttribute('data-scroll')); if (s) s.scrollIntoView(); }, 60);
  });
  document.addEventListener('change', function (e) {
    var i = e.target.getAttribute && e.target.getAttribute('data-check');
    if (i !== null && i !== undefined) store('check:' + i, e.target.checked ? '1' : null);
  });
  // Wikimedia sometimes rate-limits a burst of image requests: retry once, then fall back to the tinted box.
  document.addEventListener('error', function (e) {
    var img = e.target;
    if (!img || img.tagName !== 'IMG') return;
    if (img.getAttribute('data-retry') === '1') {
      img.setAttribute('data-retry', '0');
      var src = img.src;
      setTimeout(function () { img.src = src + (src.indexOf('?') > -1 ? '&' : '?') + 'r=1'; }, 2500);
    } else { img.remove(); }
  }, true);
  window.addEventListener('hashchange', showTab);
  if (window.matchMedia) {
    var mq = matchMedia('(prefers-color-scheme: dark)');
    var onScheme = function () { syncThemeColor(); if (data) renderInfo(); };
    if (mq.addEventListener) mq.addEventListener('change', onScheme); else if (mq.addListener) mq.addListener(onScheme);
  }
  // Re-render when the app comes back to the foreground, so the day rolls over on its own.
  document.addEventListener('visibilitychange', function () { if (!document.hidden && data) { renderToday(); renderItinerary(); } });

  /* ---------- offline ---------- */
  function setOfflineReady() {
    state.offlineReady = true;
    var p = document.getElementById('offline-pill'); if (p) p.hidden = false;
  }
  function initServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.addEventListener('message', function (e) { if (e.data && e.data.type === 'offline-ready') setOfflineReady(); });
    navigator.serviceWorker.register('sw.js').then(function () {
      if (!window.caches) return;
      caches.keys().then(function (keys) {
        keys.filter(function (k) { return k.indexOf('austria-trip-') === 0; }).forEach(function (k) {
          caches.open(k).then(function (c) { return c.match('__precached'); }).then(function (r) { if (r) setOfflineReady(); });
        });
      });
    }).catch(function () {});
  }

  /* ---------- start ---------- */
  fetch('trip-data.json').then(function (r) { return r.json(); }).then(function (d) {
    data = d;
    syncThemeColor();
    renderAll();
    showTab();
    initServiceWorker();
  }).catch(function () {
    document.getElementById('today').hidden = false;
    document.getElementById('today').innerHTML = '<div class="page"><h1 class="h1">Could not load the trip</h1><p class="sub">Check the connection and reload.</p></div>';
  });
})();

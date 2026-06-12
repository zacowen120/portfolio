// =====================================================================
// ZAC OWEN / THE INDEX  ::  interaction layer
// =====================================================================
(function () {
  var page = location.pathname.split('/').pop() || 'index.html';
  var isHome = (page === 'index.html' || page === '');
  var onWork = page.indexOf('case-') === 0 || isHome;

  // ---- Masthead: one running header on every page ----
  var mast = document.createElement('header');
  mast.className = 'masthead';
  mast.innerHTML =
    '<div class="mast-inner">' +
      '<div class="mast-left">' +
        '<a class="mast-brand" href="index.html">Zac Owen</a>' +
      '</div>' +
      '<nav class="mast-nav" aria-label="Primary">' +
        '<a href="index.html#work">Work</a>' +
        '<a href="extras.html">Extras</a>' +
        '<a href="about.html">About</a>' +
      '</nav>' +
    '</div>';
  document.body.insertBefore(mast, document.body.firstChild);

  mast.querySelectorAll('.mast-nav a').forEach(function (a) {
    var href = a.getAttribute('href').split('#')[0];
    if (href === page || (href === 'index.html' && isHome)) a.setAttribute('aria-current', 'page');
  });

  // hide on scroll down, reveal on scroll up
  var lastY = window.pageYOffset, ticking = false;
  function onScroll() {
    var y = window.pageYOffset;
    if (y > lastY && y > 140) mast.classList.add('up');
    else mast.classList.remove('up');
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });


  var motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Scroll reveal ----
  if (motionOK && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('v2in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
    var revealables = document.querySelectorAll(
      '.case-row, .wall figure, .results .stat, .carousel, .curveball, .extra-block, .paper, .case-headline, .impl-sub, .card, .feature-shot, .megastat, .quiet-line, .pop-callout, .result-teaser, .cs-item, .data-card, .about-closer, .cover-photo'
    );
    revealables.forEach(function (el) {
      if (el.closest('.carousel-track')) return;
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight) return;
      el.classList.add('v2r');
      io.observe(el);
    });
  }

  // ---- Lightbox ----
  var lb = null;
  function closeLB() {
    if (!lb) return;
    var el = lb; lb = null;
    el.classList.remove('on');
    setTimeout(function () { el.remove(); }, 240);
  }
  function openLB(src, cap) {
    closeLB();
    lb = document.createElement('div');
    lb.className = 'lb';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-label', cap || 'enlarged image');
    var img = document.createElement('img');
    img.src = src; img.alt = cap || '';
    lb.appendChild(img);
    if (cap) {
      var c = document.createElement('p');
      c.className = 'lb-cap'; c.textContent = cap;
      lb.appendChild(c);
    }
    var x = document.createElement('button');
    x.className = 'lb-x'; x.textContent = 'Close (Esc)';
    lb.appendChild(x);
    lb.addEventListener('click', closeLB);
    document.body.appendChild(lb);
    requestAnimationFrame(function () { if (lb) lb.classList.add('on'); });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLB(); });
  document.querySelectorAll('.wall figure img, .carousel-track figure img, .case-row .media img').forEach(function (img) {
    if (img.closest('a')) return;
    img.classList.add('lbable');
    img.addEventListener('click', function () {
      var fig = img.closest('figure');
      var capEl = fig ? fig.querySelector('figcaption') : null;
      openLB(img.currentSrc || img.src, capEl ? capEl.textContent : '');
    });
  });

  // ---- Carousels: continuous auto-glide + professional side arrows ----
  document.querySelectorAll('.carousel').forEach(function (c) {
    var track = c.querySelector('.carousel-track');
    if (!track) return;

    // side arrows, vertically centered on the images
    var prev = document.createElement('button');
    prev.className = 'car-arrow car-prev'; prev.type = 'button';
    prev.innerHTML = '&#8249;'; prev.setAttribute('aria-label', 'previous');
    var next = document.createElement('button');
    next.className = 'car-arrow car-next'; next.type = 'button';
    next.innerHTML = '&#8250;'; next.setAttribute('aria-label', 'next');
    c.appendChild(prev); c.appendChild(next);

    var isAuto = c.classList.contains('auto') && motionOK;
    var paused = false, hovering = false, resumeTimer = null;

    function placeArrows() {
      var t = track.offsetTop + track.clientHeight / 2;
      prev.style.top = next.style.top = t + 'px';
      var scrollable = track.scrollWidth > track.clientWidth + 8;
      c.classList.toggle('no-arrows', !scrollable);
    }
    function holdAuto() {
      paused = true;
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(function () { resumeTimer = null; if (!hovering) paused = false; }, 4200);
    }
    function nudge(dir) {
      if (isAuto) holdAuto();
      track.scrollBy({ left: dir * Math.max(track.clientWidth * 0.8, 260), behavior: motionOK ? 'smooth' : 'auto' });
    }
    prev.addEventListener('click', function () { nudge(-1); });
    next.addEventListener('click', function () { nudge(1); });
    placeArrows();
    window.addEventListener('resize', placeArrows);
    window.addEventListener('load', placeArrows);

    if (isAuto) {
      Array.prototype.forEach.call(track.querySelectorAll('img'), function (im) { im.loading = 'eager'; });
      // duplicate the items once so the glide can loop seamlessly
      var originals = Array.prototype.slice.call(track.children);
      originals.forEach(function (node) {
        var clone = node.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.classList.add('carousel-clone');
        track.appendChild(clone);
      });
      var firstClone = track.children[originals.length];
      var loopW = 0, speed = 0.5;
      function measure() { if (firstClone) loopW = firstClone.offsetLeft; placeArrows(); }
      measure();
      window.addEventListener('load', measure);
      window.addEventListener('resize', measure);
      Array.prototype.forEach.call(track.querySelectorAll('img'), function (im) {
        if (!(im.complete && im.naturalWidth > 0)) { im.addEventListener('load', measure); im.addEventListener('error', measure); }
      });
      function step() {
        if (loopW <= 0) measure();
        if (!paused && loopW > track.clientWidth) {
          track.scrollLeft += speed;
          if (track.scrollLeft >= loopW) track.scrollLeft -= loopW;
        }
        requestAnimationFrame(step);
      }
      c.addEventListener('mouseenter', function () { hovering = true; paused = true; });
      c.addEventListener('focusin', function () { hovering = true; paused = true; });
      c.addEventListener('mouseleave', function () { hovering = false; if (!resumeTimer) paused = false; });
      c.addEventListener('focusout', function () { hovering = false; if (!resumeTimer) paused = false; });
      ['pointerdown', 'touchstart'].forEach(function (ev) { track.addEventListener(ev, function () { holdAuto(); }, { passive: true }); });
      requestAnimationFrame(step);
    } else {
      track.addEventListener('scroll', placeArrows, { passive: true });
    }
  });

  // ---- Count up the stats ----
  if (motionOK && 'IntersectionObserver' in window) {
    var statIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        statIO.unobserve(e.target);
        var el = e.target;
        var m = el.textContent.match(/^([^0-9]*)([0-9][0-9,.]*)(.*)$/);
        if (!m) return;
        var pre = m[1], numStr = m[2], post = m[3];
        var hasComma = numStr.indexOf(',') > -1;
        var target = parseFloat(numStr.replace(/,/g, ''));
        if (!isFinite(target)) return;
        var decimals = (numStr.split('.')[1] || '').length;
        var t0 = null;
        function frame(ts) {
          if (t0 === null) t0 = ts;
          var k = Math.min((ts - t0) / 850, 1);
          k = 1 - Math.pow(1 - k, 3);
          var v = (target * k).toFixed(decimals);
          if (hasComma) v = Number(v).toLocaleString('en-US', { minimumFractionDigits: decimals });
          el.textContent = pre + v + post;
          if (k < 1) requestAnimationFrame(frame);
          else el.textContent = pre + numStr + post;
        }
        requestAnimationFrame(frame);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('.results .stat b, .megastat b').forEach(function (b) {
      statIO.observe(b);
    });
  }
})();

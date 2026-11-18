(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ----- A hello for anyone peeking at the console ----- */
  console.log('Need a website? Reach out here: https://evanstmartindevelopment.com/');

  /* ----- Footer year ----- */
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  /* ----- Header: shrink once the page scrolls ----- */
  const header = document.querySelector('[data-header]');
  // Tuck the header away while scrolling down, bring it back on any scroll up
  let lastY = window.scrollY;
  const onScroll = () => {
    if (!header) return;
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 24);
    const menuOpen = document.body.classList.contains('menu-open');
    if (!menuOpen && Math.abs(y - lastY) > 6) {
      header.classList.toggle('is-hidden', y > lastY && y > 320);
      lastY = y;
    }
  };
  header?.addEventListener('focusin', () => header.classList.remove('is-hidden'));
  requestAnimationFrame(onScroll);
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ----- Mobile menu ----- */
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-mobile-menu]');

  const setMenu = (open) => {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', String(open));
    menu.style.setProperty('--menu-top', `${header.getBoundingClientRect().bottom}px`);
    menu.hidden = !open;
    document.body.classList.toggle('menu-open', open);
    if (open) menu.querySelector('a')?.focus();
  };

  toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      toggle.focus();
    }
  });
  menu?.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  window.matchMedia('(min-width: 1021px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* ----- Hero polaroid: random photos, each one "developing" in ----- */
  const polaroid = document.querySelector('[data-polaroid]');
  if (polaroid) {
    const stack = polaroid.querySelector('.polaroid__stack');
    const dir = 'assets/images/polaroid/';
    const photos = [
      { src: '000017460036.webp', alt: 'A couple sharing a kiss beside their wedding cake, shot on film' },
      { src: '000017460022.webp', alt: 'Newlyweds walking hand in hand across a city street, shot on film' },
      { src: 'acp-24.webp', alt: 'A bride and groom beneath white stone arches' },
      { src: 'acp-55.webp', alt: 'A bride in her gown under glowing string lights' },
      { src: 'acp-100.webp', alt: 'A couple laughing together outdoors, one in an orange beanie' },
      { src: 'rempfer-738.webp', alt: 'Wedding guests dancing with their arms in the air' },
      { src: 'acp-1.webp', alt: 'A bride and groom holding hands during their ceremony' },
    ];

    // Shuffle so every visit gets a different order, and start on a random photo
    for (let i = photos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [photos[i], photos[j]] = [photos[j], photos[i]];
    }
    let current = stack.querySelector('img');
    current.src = dir + photos[0].src;
    current.alt = photos[0].alt;
    let index = 0;

    const INTERVAL = 7500;
    let timer = null;
    let busy = false;
    const paused = new Set();

    const swap = () => {
      if (busy) return;
      busy = true;
      const nextIndex = (index + 1) % photos.length;
      const next = new Image();
      next.decoding = 'async';
      next.alt = photos[nextIndex].alt;
      next.onload = () => {
        stack.appendChild(next);
        current.classList.remove('is-active');
        current.classList.add('is-leaving');
        requestAnimationFrame(() => requestAnimationFrame(() => next.classList.add('is-active')));
        const old = current;
        setTimeout(() => { old.remove(); busy = false; }, 1200);
        current = next;
        index = nextIndex;
      };
      next.onerror = () => { busy = false; index = nextIndex; };
      next.src = dir + photos[nextIndex].src;
    };

    const schedule = () => {
      clearInterval(timer);
      timer = null;
      if (!paused.size && !reduceMotion.matches) timer = setInterval(swap, INTERVAL);
    };
    const setPaused = (reason, on) => { on ? paused.add(reason) : paused.delete(reason); schedule(); };

    polaroid.addEventListener('mouseenter', () => setPaused('hover', true));
    polaroid.addEventListener('mouseleave', () => setPaused('hover', false));
    document.addEventListener('visibilitychange', () => setPaused('hidden', document.hidden));
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => setPaused('offscreen', !e.isIntersecting)).observe(polaroid);
    }
    reduceMotion.addEventListener('change', schedule);
    // Let the opening drop-in finish before the first swap
    setPaused('intro', true);
    setTimeout(() => setPaused('intro', false), 1800);
  }

  /* ----- Testimonial carousel ----- */
  const carousel = document.querySelector('[data-carousel]');
  if (carousel) {
    const slides = [...carousel.querySelectorAll('[data-slide]')];
    const dots = [...carousel.querySelectorAll('[data-dot]')];
    let index = 0;

    // Auto-advance is driven by the progress pill's CSS animation (12s),
    // so pausing the animation pauses the carousel too.
    carousel.style.setProperty('--slide-time', '12s');
    const pauseReasons = new Set();
    const setPaused = (reason, on) => {
      on ? pauseReasons.add(reason) : pauseReasons.delete(reason);
      carousel.classList.toggle('is-paused', pauseReasons.size > 0);
    };
    const syncMotion = () => carousel.classList.toggle('is-static', reduceMotion.matches);
    syncMotion();
    reduceMotion.addEventListener('change', syncMotion);

    const show = (next) => {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const active = i === index;
        slide.classList.toggle('is-active', active);
        slide.hidden = false;
        slide.inert = !active;
        slide.setAttribute('aria-hidden', String(!active));
      });
      dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
    };

    carousel.addEventListener('animationend', (e) => {
      if (e.animationName === 'slide-progress' && !reduceMotion.matches) show(index + 1);
    });

    carousel.querySelector('[data-prev]').addEventListener('click', () => show(index - 1));
    carousel.querySelector('[data-next]').addEventListener('click', () => show(index + 1));
    dots.forEach((dot) => dot.addEventListener('click', () => show(Number(dot.dataset.dot))));

    carousel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });

    // Swipe on touch screens
    let touchX = null;
    carousel.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    carousel.addEventListener('touchend', (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
      touchX = null;
    });

    // Pause while someone is reading, interacting, or the section is off screen
    carousel.addEventListener('mouseenter', () => setPaused('hover', true));
    carousel.addEventListener('mouseleave', () => setPaused('hover', false));
    carousel.addEventListener('focusin', () => setPaused('focus', true));
    carousel.addEventListener('focusout', (e) => { if (!carousel.contains(e.relatedTarget)) setPaused('focus', false); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => setPaused('offscreen', !entry.isIntersecting), { threshold: 0.25 }).observe(carousel);
    }

    show(0);
  }

  /* ----- Videos: load near view, play while visible, each with its own pause button ----- */
  // Markup: a [data-video] <video>, and optionally a [data-video-toggle] button in the same [data-video-wrap].
  document.querySelectorAll('[data-video]').forEach((video) => {
    const wrap = video.closest('[data-video-wrap]') || video.parentElement;
    const toggle = wrap.querySelector('[data-video-toggle]');
    let userPaused = reduceMotion.matches;
    let inView = false;

    const render = () => {
      if (!toggle) return;
      toggle.setAttribute('aria-pressed', String(userPaused));
      toggle.setAttribute('aria-label', userPaused ? 'Play video' : 'Pause video');
    };
    const sync = () => {
      if (inView && !userPaused) video.play().catch(() => {});
      else video.pause();
      render();
    };

    toggle?.addEventListener('click', () => { userPaused = !userPaused; sync(); });

    if ('IntersectionObserver' in window) {
      // Start fetching a little before it scrolls in
      new IntersectionObserver(([entry], obs) => {
        if (entry.isIntersecting) { video.preload = 'auto'; video.load(); obs.disconnect(); }
      }, { rootMargin: '600px 0px' }).observe(video);
      new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }, { threshold: 0.2 }).observe(video);
    } else {
      inView = true;
      sync();
    }
    render();
  });

  /* ----- Heavy third-party embeds (the HoneyBook form) load only as they come near ----- */
  document.querySelectorAll('iframe[data-lazy-frame]').forEach((frame) => {
    const load = () => {
      if (frame.src) return;
      frame.addEventListener('load', () => frame.parentElement.classList.add('is-loaded'), { once: true });
      frame.src = frame.dataset.src;
    };
    if (!('IntersectionObserver' in window)) return load();
    new IntersectionObserver(([entry], obs) => {
      if (entry.isIntersecting) { load(); obs.disconnect(); }
    }, { rootMargin: '400px 0px' }).observe(frame);
    // Anyone who jumps straight to the form gets it loaded right away
    document.querySelectorAll(`a[href="#${frame.closest('section')?.id}"]`).forEach((a) => a.addEventListener('click', load));
    try { if (location.hash && frame.closest(location.hash)) load(); } catch (e) { /* not a selector */ }
  });

  /* ----- Timeline: the spine fills as you scroll through it ----- */
  const timeline = document.querySelector('[data-timeline]');
  if (timeline) {
    let ticking = false;
    const update = () => {
      const r = timeline.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height));
      timeline.style.setProperty('--progress', p.toFixed(3));
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ----- Split headings into words for the masked rise ----- */
  document.querySelectorAll('[data-split]').forEach((el) => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = text.split(/\s+/).map((w, i) =>
      `<span class="word" aria-hidden="true"><span style="--i:${i}">${w.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</span></span>`
    ).join(' ');
  });

  /* ----- Reveal: prints "develop" as they scroll in ----- */
  const reveals = document.querySelectorAll('.reveal, [data-split], [data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  /* ----- Gentle parallax on decorative pieces ----- */
  const layers = [...document.querySelectorAll('[data-parallax]')];
  if (layers.length && !reduceMotion.matches) {
    let ticking = false;
    const update = () => {
      const vh = window.innerHeight;
      layers.forEach((el) => {
        const rect = el.parentElement.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        const offset = (rect.top + rect.height / 2 - vh / 2) * Number(el.dataset.parallax);
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)` + (el.dataset.baseTransform || '');
      });
      ticking = false;
    };
    layers.forEach((el) => {
      // keep any rotation set in CSS via the `transform` property
      const t = getComputedStyle(el).transform;
      el.dataset.baseTransform = t && t !== 'none' ? ` ${t}` : '';
    });
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }
})();

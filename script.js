(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const toggle = document.getElementById('themeToggle');
  const updateLabel = () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    toggle.setAttribute('aria-label', `Switch to ${next} mode`);
    toggle.title = `Switch to ${next} mode`;
    toggle.querySelector('.theme-label').textContent = `${next[0].toUpperCase() + next.slice(1)} mode`;
  };
  updateLabel();
  toggle.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (_) {}
    updateLabel();
  });
  const menu = document.querySelector('.menu-toggle');
  const nav = document.getElementById('primary-nav');
  menu.hidden = false;
  function closeMenu() {
    menu.setAttribute('aria-expanded', 'false');
    nav.classList.remove('open');
    menu.querySelector('span').textContent = '＋';
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
    menu.querySelector('span').textContent = open ? '−' : '＋';
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      closeMenu(); menu.focus();
    }
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.navigation')) closeMenu();
  });
  nav.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
})();

// Homepage portrait collection. One rotation timer and a bounded transition cache.
(() => {
  const carousel = document.querySelector('.portrait-carousel');
  if (!carousel) return;
  const screen = carousel.querySelector('.portrait-screen');
  const slides = [...screen.querySelectorAll('.portrait-slide')];
  if (slides.length < 2) return;
  const controls = screen.querySelector('.portrait-controls');
  const pause = controls.querySelector('.portrait-pause');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const displacement = document.querySelector('#tv-wave feDisplacementMap');
  const waveMap = document.querySelector('.tv-wave-map');
  const red = document.querySelector('.tv-red-offset');
  const blue = document.querySelector('.tv-blue-offset');
  const noise = document.querySelector('.tv-static');
  let index = 0, rotationTimer = null, frame = null, fallback = null;
  let finishTransition = null, visible = true, suspended = false;
  let userPaused = motion.matches;
  let maps = null;
  controls.hidden = false;

  function distortionMaps() {
    if (maps) return maps;
    maps = Array.from({length: 12}, (_, n) => {
      const phase = n / 12;
      const bands = Array.from({length: 128}, (_, row) => {
        const y = row / 128;
        const broad = Math.sin(y * Math.PI * 3.3 + phase * Math.PI * 4) * 83;
        const fine = Math.sin(y * Math.PI * 17 - phase * Math.PI * 12) * 14;
        const tear = Math.exp(-Math.pow((y - (0.12 + phase * 0.75)) / 0.043, 2)) * 80;
        const value = Math.round(Math.max(8, Math.min(247, 128 + broad + fine + tear)));
        return `<rect y="${row * 5}" width="64" height="5" fill="rgb(${value},128,128)"/>`;
      }).join('');
      return 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="640">${bands}</svg>`);
    });
    return maps;
  }
  function updatePause() {
    pause.textContent = userPaused ? '▶' : 'Ⅱ';
    pause.setAttribute('aria-label', userPaused ? 'Play photo rotation' : 'Pause photo rotation');
  }
  function canRotate() { return !userPaused && visible && !document.hidden && !suspended; }
  function schedule() {
    clearTimeout(rotationTimer);
    rotationTimer = null;
    if (canRotate() && !finishTransition) {
      rotationTimer = setTimeout(() => { rotationTimer = null; change(1); }, 6000);
    }
  }
  function change(direction) {
    if (finishTransition) return;
    clearTimeout(rotationTimer);
    rotationTimer = null;
    // Never wait indefinitely for decode(). Skip unavailable images and retry later.
    let next = index;
    for (let step = 1; step < slides.length; step++) {
      const candidate = (index + direction * step + slides.length) % slides.length;
      if (slides[candidate].complete && slides[candidate].naturalWidth > 0) { next = candidate; break; }
    }
    if (next === index) { schedule(); return; }
    let swapped = false;
    function swap() {
      if (swapped) return;
      swapped = true;
      slides[index].classList.remove('is-current');
      slides[index].setAttribute('aria-hidden', 'true');
      index = next;
      slides[index].classList.add('is-current');
      slides[index].removeAttribute('aria-hidden');
    }
    function finish() {
      if (finishTransition !== finish) return;
      cancelAnimationFrame(frame);
      clearTimeout(fallback);
      frame = fallback = null;
      swap();
      screen.classList.remove('is-tuning');
      if (displacement) displacement.setAttribute('scale', '0');
      if (red) red.setAttribute('dx', '0');
      if (blue) blue.setAttribute('dx', '0');
      if (waveMap) waveMap.removeAttribute('href');
      finishTransition = null;
      schedule();
    }
    finishTransition = finish;
    if (motion.matches || document.hidden || suspended || !visible || !displacement || !waveMap) { finish(); return; }
    const textures = distortionMaps();
    screen.classList.add('is-tuning');
    const started = performance.now();
    function ripple(now) {
      if (finishTransition !== finish) return;
      const progress = Math.min(1, (now - started) / 260);
      if (progress >= 1 || motion.matches || document.hidden || suspended || !visible) { finish(); return; }
      const envelope = Math.pow(Math.sin(Math.PI * progress), 1.15);
      displacement.setAttribute('scale', String(42 * envelope));
      waveMap.setAttribute('href', textures[Math.min(11, Math.floor(progress * 12))]);
      red.setAttribute('dx', String(6 * envelope));
      blue.setAttribute('dx', String(-6 * envelope));
      noise.setAttribute('seed', String(Math.floor(progress * 28) + 2));
      if (progress >= 0.48) swap();
      frame = requestAnimationFrame(ripple);
    }
    // Settle even if animation frames stall or the browser interrupts rendering.
    fallback = setTimeout(finish, 500);
    frame = requestAnimationFrame(ripple);
  }
  function recover() {
    if (finishTransition) finishTransition();
    schedule();
  }
  controls.querySelector('.portrait-prev').addEventListener('click', () => change(-1));
  controls.querySelector('.portrait-next').addEventListener('click', () => change(1));
  pause.addEventListener('click', () => { userPaused = !userPaused; updatePause(); recover(); });
  // Touch hover and retained button focus must never silently pause rotation.
  document.addEventListener('visibilitychange', recover);
  window.addEventListener('pagehide', () => { suspended = true; recover(); });
  window.addEventListener('pageshow', () => { suspended = false; recover(); });
  motion.addEventListener('change', () => { if (motion.matches) userPaused = true; updatePause(); recover(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; recover(); }, {threshold: .1}).observe(screen);
  }
  updatePause(); schedule();
})();

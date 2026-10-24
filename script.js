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

// Homepage portrait collection.
(() => {
  const carousel = document.querySelector('.portrait-carousel');
  if (!carousel) return;
  const screen = carousel.querySelector('.portrait-screen');
  const slides = [...screen.querySelectorAll('.portrait-slide')];
  const controls = screen.querySelector('.portrait-controls');
  const pause = controls.querySelector('.portrait-pause');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, timer, busy = false, hovered = false, focused = false, visible = true;
  let userPaused = motion.matches;
  controls.hidden = false;
  const updatePause = () => {
    pause.textContent = userPaused ? '▶' : 'Ⅱ';
    pause.setAttribute('aria-label', userPaused ? 'Play photo rotation' : 'Pause photo rotation');
  };
  function schedule() {
    clearTimeout(timer);
    if (!userPaused && !hovered && !focused && visible && !document.hidden && !busy) {
      timer = setTimeout(() => change(1), 6000);
    }
  }
  async function change(direction) {
    if (busy) return;
    busy = true;
    clearTimeout(timer);
    let next = (index + direction + slides.length) % slides.length;
    try { await slides[next].decode(); } catch (_) { busy = false; schedule(); return; }
    const swap = () => {
      slides[index].classList.remove('is-current');
      slides[index].setAttribute('aria-hidden', 'true');
      index = next;
      slides[index].classList.add('is-current');
      slides[index].removeAttribute('aria-hidden');

    };
    if (motion.matches) {
      swap(); busy = false; schedule(); return;
    }
    screen.classList.add('is-tuning');
    const displacement = document.querySelector('#tv-wave feDisplacementMap');
    const waveMap = document.querySelector('.tv-wave-map');
    const red = document.querySelector('.tv-red-offset');
    const blue = document.querySelector('.tv-blue-offset');
    const noise = document.querySelector('.tv-static');
    const maps = Array.from({length: 36}, (_, frame) => {
      const phase = frame / 36;
      const bands = Array.from({length: 160}, (_, row) => {
        const y = row / 160;
        const broadWave = Math.sin(y * Math.PI * 3.3 + phase * Math.PI * 4) * 83;
        const fineWave = Math.sin(y * Math.PI * 17 - phase * Math.PI * 12) * 14;
        const tear = Math.exp(-Math.pow((y - (0.12 + phase * 0.75)) / 0.043, 2)) * 80;
        const value = Math.round(Math.max(8, Math.min(247, 128 + broadWave + fineWave + tear)));
        return `<rect y="${row * 4}" width="64" height="4" fill="rgb(${value},128,128)"/>`;
      }).join('');
      return 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="640">${bands}</svg>`);
    });
    const started = performance.now();
    let swapped = false;
    function ripple(now) {
      const progress = Math.min(1, (now - started) / 260);
      if (motion.matches) {
        if (!swapped) swap();
        displacement.setAttribute('scale', '0');
        screen.classList.remove('is-tuning'); busy = false; schedule(); return;
      }
      const envelope = Math.pow(Math.sin(Math.PI * progress), 1.15);
      displacement.setAttribute('scale', String(42 * envelope));
      waveMap.setAttribute('href', maps[Math.min(35, Math.floor(progress * 36))]);
      red.setAttribute('dx', String(6 * envelope));
      blue.setAttribute('dx', String(-6 * envelope));
      noise.setAttribute('seed', String(Math.floor(progress * 28) + 2));
      if (progress >= 0.48 && !swapped) { swap(); swapped = true; }
      if (progress < 1) requestAnimationFrame(ripple);
      else {
        displacement.setAttribute('scale', '0');
        screen.classList.remove('is-tuning'); busy = false; schedule();
      }
    }
    requestAnimationFrame(ripple);
  }
  controls.querySelector('.portrait-prev').addEventListener('click', () => change(-1));
  controls.querySelector('.portrait-next').addEventListener('click', () => change(1));
  pause.addEventListener('click', () => { userPaused = !userPaused; updatePause(); schedule(); });
  carousel.addEventListener('mouseenter', () => { hovered = true; schedule(); });
  carousel.addEventListener('mouseleave', () => { hovered = false; schedule(); });
  carousel.addEventListener('focusin', () => { focused = true; schedule(); });
  carousel.addEventListener('focusout', () => { requestAnimationFrame(() => { focused = carousel.contains(document.activeElement); schedule(); }); });
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', () => { if (motion.matches) userPaused = true; updatePause(); schedule(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }, {threshold: .1}).observe(screen);
  }
  updatePause(); schedule();
})();

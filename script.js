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

(() => {
  const links = [...document.querySelectorAll('.archive .stage-card > a')];
  if (!links.length || typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal) return;
  const viewer = document.createElement('dialog');
  viewer.className = 'photo-viewer';
  viewer.setAttribute('aria-label', 'Enlarged stage photograph');
  const toolbar = document.createElement('div');
  toolbar.className = 'photo-viewer-toolbar';
  const caption = document.createElement('p');
  caption.id = 'photo-viewer-caption';
  viewer.setAttribute('aria-describedby', caption.id);
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'photo-viewer-close';
  close.setAttribute('aria-label', 'Close image viewer');
  close.textContent = '×';
  toolbar.append(caption, close);
  const canvas = document.createElement('div');
  canvas.className = 'photo-viewer-canvas';
  const image = document.createElement('img');
  canvas.append(image);
  viewer.append(toolbar, canvas);
  document.body.append(viewer);
  let opener = null, previousOverflow = '';
  for (const link of links) {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      image.alt = link.querySelector('img')?.alt || 'Stage photograph';
      image.src = link.href;
      caption.textContent = link.closest('figure').querySelector('h3')?.textContent || 'Stage photograph';
      previousOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      viewer.showModal();
      close.focus({preventScroll: true});
    });
  }
  close.addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', event => {
    if (event.target === viewer || event.target === canvas) viewer.close();
  });
  // Native dialog handles Escape, focus trapping and making the page inert.
  viewer.addEventListener('close', () => {
    document.documentElement.style.overflow = previousOverflow;
    image.removeAttribute('src');
    image.alt = '';
    opener?.focus({preventScroll: true});
    opener = null;
  });
})();

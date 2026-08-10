export function initHeroVideo(root) {
  const box = root?.querySelector('#avb') || document.getElementById('avb');
  const frame = box?.querySelector('#avbFrame') || document.getElementById('avbFrame');

  if (!box || !frame) return;

  let lastWidth = window.innerWidth;
  let lockedHeight = window.innerHeight;

  function setStableHeight(force) {
    const currentWidth = window.innerWidth;
    const widthChanged = Math.abs(currentWidth - lastWidth) > 24;

    if (force || widthChanged) {
      lockedHeight = window.innerHeight;
      lastWidth = currentWidth;
    }

    document.documentElement.style.setProperty('--avb-vh', `${lockedHeight}px`);
  }

  function getAspect() {
    let aspect = 16 / 9;
    const raw = box.getAttribute('data-aspect') || '16/9';
    const parts = raw.split('/');

    if (parts.length === 2) {
      const w = parseFloat(parts[0]);
      const h = parseFloat(parts[1]);
      if (w > 0 && h > 0) aspect = w / h;
    }

    return aspect;
  }

  function coverResize() {
    const aspect = getAspect();
    const cw = box.clientWidth;
    const ch = box.clientHeight;
    if (!cw || !ch) return;

    let w = cw;
    let h = w / aspect;

    if (h < ch) {
      h = ch;
      w = h * aspect;
    }

    frame.style.width = `${Math.ceil(w)}px`;
    frame.style.height = `${Math.ceil(h)}px`;
  }

  function initFallback() {
    const fb = box.querySelector('.avb__fallback');
    const url = box.getAttribute('data-fallback');
    if (fb && url) {
      fb.style.backgroundImage = `url("${url}")`;
    }
  }

  function refresh(force) {
    setStableHeight(force);
    coverResize();
  }

  initFallback();
  refresh(true);

  frame.addEventListener('load', () => {
    setTimeout(() => box.classList.add('is-ready'), 500);
  });

  window.addEventListener('resize', () => refresh(false), { passive: true });
  window.addEventListener('orientationchange', () => {
    setTimeout(() => refresh(true), 350);
  }, { passive: true });

  document.addEventListener('DOMContentLoaded', () => refresh(false));
  setTimeout(() => refresh(false), 300);
  setTimeout(() => refresh(false), 1200);
}

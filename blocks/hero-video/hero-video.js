/**
 * Высота hero на мобильном: фиксируем реальный viewport (visualViewport),
 * чтобы адресная строка браузера не оставляла зазор. Десктоп — CSS 100dvh.
 */
export function initHeroVideo(root) {
  const box = root?.querySelector('#avb') || document.getElementById('avb');
  const media = box?.querySelector('#avbFrame') || document.getElementById('avbFrame');
  const wrap = box?.closest?.('.uc-video') || root;

  if (!box || !media) return;

  let lastWidth = window.innerWidth;
  let lockedHeight = 0;

  function isMobileCover() {
    return window.matchMedia('(max-width: 980px)').matches
      || ('ontouchend' in document && window.innerWidth <= 1180);
  }

  /** Высота видимой области (с учётом mobile browser chrome) */
  function measureViewportHeight() {
    const docH = document.documentElement?.clientHeight || 0;
    const winH = window.innerHeight || 0;
    const vv = window.visualViewport?.height || 0;
    return Math.max(1, Math.round(Math.max(docH, winH, vv)));
  }

  function clearDesktopHeight() {
    document.documentElement.style.removeProperty('--avb-vh');
    box.style.height = '';
    box.style.minHeight = '';
    if (wrap && wrap !== box) wrap.style.minHeight = '';
    lockedHeight = 0;
  }

  function applyHeight(px) {
    const h = `${px}px`;
    document.documentElement.style.setProperty('--avb-vh', h);
    box.style.height = h;
    box.style.minHeight = h;
    if (wrap && wrap !== box) {
      wrap.style.minHeight = h;
    }
  }

  function setStableHeight(force) {
    if (!isMobileCover()) {
      clearDesktopHeight();
      return;
    }

    const currentWidth = window.innerWidth;
    const widthChanged = Math.abs(currentWidth - lastWidth) > 24;
    const next = measureViewportHeight();

    if (!lockedHeight || force || widthChanged || next > lockedHeight + 2) {
      lockedHeight = next;
      lastWidth = currentWidth;
    }

    applyHeight(lockedHeight);
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
    const ch = box.clientHeight || lockedHeight || window.innerHeight;
    if (!cw || !ch) return;

    let w = cw;
    let h = w / aspect;

    if (h < ch) {
      h = ch;
      w = h * aspect;
    }

    media.style.width = `${Math.ceil(w)}px`;
    media.style.height = `${Math.ceil(h)}px`;
  }

  function initFallback() {
    const fb = box.querySelector('.avb__fallback');
    const url = box.getAttribute('data-fallback');
    if (fb && url) {
      fb.style.backgroundImage = `url("${url}")`;
    }
  }

  function markReady() {
    box.classList.add('is-ready');
  }

  function refresh(force) {
    setStableHeight(force);
    coverResize();
    document.dispatchEvent(new CustomEvent('page:layout'));
  }

  initFallback();
  refresh(true);

  if (media.tagName === 'VIDEO') {
    media.disablePictureInPicture = true;
    media.disableRemotePlayback = true;
    media.setAttribute('pip', 'false');
    media.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback');
    media.addEventListener('loadeddata', markReady, { once: true });
    media.addEventListener('canplay', markReady, { once: true });
    const playPromise = media.play?.();
    if (playPromise?.catch) {
      playPromise.catch(() => markReady());
    }
  } else {
    media.addEventListener('load', () => {
      setTimeout(markReady, 500);
    });
  }

  window.addEventListener('resize', () => refresh(false), { passive: true });
  window.addEventListener('orientationchange', () => {
    setTimeout(() => refresh(true), 400);
  }, { passive: true });

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => refresh(false), { passive: true });
  }

  document.addEventListener('DOMContentLoaded', () => refresh(true));
  setTimeout(() => refresh(true), 50);
  setTimeout(() => refresh(true), 300);
  setTimeout(() => refresh(false), 1000);
  setTimeout(markReady, 2500);
}

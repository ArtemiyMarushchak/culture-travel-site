export function initVideoOverlay() {
  const first = document.querySelector('.uc-video');
  // После переноса «Обо мне» в drawer — затемнять hero относительно следующей секции
  const second =
    document.querySelector('.uc-about')
    || document.querySelector('#cases')
    || document.querySelector('.uc-cases')
    || document.querySelector('main > section:nth-of-type(2)')
    || document.querySelector('#main > section:nth-of-type(2)');

  if (!first || !second) return;
  if (first.parentElement?.classList.contains('video-overlay-stage')) return;

  const stage = document.createElement('div');
  stage.className = 'video-overlay-stage';

  const placeholder = document.createElement('div');
  placeholder.className = 'video-overlay-placeholder';

  first.parentNode.insertBefore(stage, first);
  stage.appendChild(first);
  stage.appendChild(placeholder);
  stage.appendChild(second);

  let rafId = 0;
  let lastMode = '';

  function getHeight(el) {
    const avb = el.querySelector?.('#avb');
    if (avb) {
      const cssVh = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--avb-vh')) || 0;
      if (cssVh >= 200) return Math.round(cssVh);
      const avbH = avb.getBoundingClientRect().height;
      if (avbH >= 200) return Math.round(avbH);
    }
    const h = el.offsetHeight;
    if (h && h >= 200) return h;
    return Math.max(
      document.documentElement?.clientHeight || 0,
      window.innerHeight || 0,
      window.visualViewport?.height || 0,
      1,
    );
  }

  function syncStage() {
    const firstH = getHeight(first);
    const secondH = getHeight(second);
    placeholder.style.height = `${firstH}px`;
    stage.style.height = `${firstH + secondH}px`;
  }

  function presentationReveal(t) {
    const snapped = Math.min(1, Math.max(0, (t - 0.06) / 0.52));
    return 1 - ((1 - snapped) ** 2.6);
  }

  function updateScrollDim(mode) {
    const avb = first.querySelector('#avb');
    const aboutTop = second.getBoundingClientRect().top;
    const viewportH = window.innerHeight || 1;
    let cover = 0;

    if (mode === 'fixed') {
      cover = Math.min(1, Math.max(0, 1 - aboutTop / viewportH));
    } else if (mode === 'absolute') {
      cover = 1;
    }

    const reveal = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? (aboutTop < viewportH ? 1 : 0)
      : presentationReveal(cover);

    if (avb) avb.style.setProperty('--avb-scroll-dim', cover.toFixed(3));
    second.style.setProperty('--about-reveal', reveal.toFixed(3));
  }

  function syncVideoPlayback(mode) {
    const media = first.querySelector('#avbFrame');
    if (!media || media.tagName !== 'VIDEO') return;

    const covered = mode === 'absolute' || second.getBoundingClientRect().top <= 1;
    if (covered) {
      if (!media.paused) media.pause();
      return;
    }

    if (media.paused) {
      const playPromise = media.play();
      if (playPromise?.catch) playPromise.catch(() => {});
    }
  }

  function update() {
    syncStage();

    const firstH = getHeight(first);
    const rect = stage.getBoundingClientRect();
    const start = rect.top;
    const end = rect.bottom - firstH;

    let mode = 'static';
    if (start <= 0 && end > 0) mode = 'fixed';
    else if (end <= 0) mode = 'absolute';

    first.classList.remove('is-video-fixed', 'is-video-absolute');
    if (mode === 'fixed') first.classList.add('is-video-fixed');
    if (mode === 'absolute') first.classList.add('is-video-absolute');

    updateScrollDim(mode);
    syncVideoPlayback(mode);

    if (mode !== lastMode) {
      lastMode = mode;
      document.dispatchEvent(new CustomEvent('page:layout'));
    }
  }

  function scheduleUpdate() {
    if (rafId) return;
    rafId = window.requestAnimationFrame(() => {
      rafId = 0;
      update();
    });
  }

  update();
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  document.addEventListener('ct:prefs', () => {
    window.requestAnimationFrame(() => {
      update();
      window.requestAnimationFrame(update);
    });
  });

  if (typeof ResizeObserver === 'function') {
    const observer = new ResizeObserver(() => scheduleUpdate());
    observer.observe(second);
    observer.observe(first);
  }

  window.setTimeout(update, 300);
  window.setTimeout(update, 900);
}

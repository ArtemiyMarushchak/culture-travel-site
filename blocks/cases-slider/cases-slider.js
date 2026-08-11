/**
 * Cases slider — региональные табы, Ken Burns, autoplay
 */

const AUTOPLAY_MS = 7000;
const SWIPE_THRESHOLD = 44;

export function initCasesSlider(root) {
  if (!root) return;

  const dataEl = root.querySelector('#mcs-data');
  if (!dataEl) return;

  let cases = {};
  try {
    cases = JSON.parse(dataEl.textContent || '{}').cases || {};
  } catch (err) {
    console.error('Cases slider: invalid JSON', err);
    return;
  }

  const stage = root.querySelector('[data-case-stage]');
  const slide = root.querySelector('[data-case-slide]');
  const image = root.querySelector('[data-case-image]');
  const title = root.querySelector('[data-case-title]');
  const text = root.querySelector('[data-case-text]');
  const link = root.querySelector('[data-case-link]');
  const current = root.querySelector('[data-case-current]');
  const total = root.querySelector('[data-case-total]');
  const prevBtn = root.querySelector('[data-case-prev]');
  const nextBtn = root.querySelector('[data-case-next]');
  const tabs = root.querySelectorAll('[data-case-filter]');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let activeKey = 'all';
  let activeSlides = [];
  let index = 0;
  let autoplay = null;
  let isPaused = false;
  let touchStartX = 0;

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function getSlides(key) {
    if (key === 'all') {
      return Object.keys(cases).reduce((acc, group) => acc.concat(cases[group] || []), []);
    }
    return cases[key] || [];
  }

  function setSlideData(item) {
    if (!item) return;

    image.src = item.image || '';
    image.alt = '';
    image.setAttribute('aria-hidden', 'true');
    title.textContent = item.title || '';
    text.textContent = item.text || '';

    if (item.link) {
      link.href = item.link;
      link.classList.remove('is-hidden');
    } else {
      link.href = '#';
      link.classList.add('is-hidden');
    }

    current.textContent = pad(index + 1);
    total.textContent = pad(activeSlides.length);
  }

  function render() {
    activeSlides = getSlides(activeKey);
    if (!activeSlides.length) return;

    if (index > activeSlides.length - 1) index = 0;
    if (index < 0) index = activeSlides.length - 1;

    const item = activeSlides[index];
    stage?.classList.add('is-changing');
    slide?.classList.remove('is-active');

    window.setTimeout(() => {
      setSlideData(item);
      slide?.classList.add('is-active');
      stage?.classList.remove('is-changing');
    }, reducedMotion ? 0 : 180);
  }

  function goNext() {
    activeSlides = getSlides(activeKey);
    index = index >= activeSlides.length - 1 ? 0 : index + 1;
    render();
    restartAutoplay();
  }

  function goPrev() {
    activeSlides = getSlides(activeKey);
    index = index <= 0 ? activeSlides.length - 1 : index - 1;
    render();
    restartAutoplay();
  }

  function startAutoplay() {
    if (reducedMotion) return;
    clearInterval(autoplay);
    autoplay = window.setInterval(() => {
      if (!isPaused) goNext();
    }, AUTOPLAY_MS);
  }

  function restartAutoplay() {
    clearInterval(autoplay);
    startAutoplay();
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((item) => {
        item.classList.remove('is-active');
        item.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');

      activeKey = tab.getAttribute('data-case-filter') || 'all';
      index = 0;
      render();
      restartAutoplay();
    });
  });

  prevBtn?.addEventListener('click', goPrev);
  nextBtn?.addEventListener('click', goNext);

  stage?.addEventListener('mouseenter', () => { isPaused = true; });
  stage?.addEventListener('mouseleave', () => { isPaused = false; });

  stage?.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    isPaused = true;
  }, { passive: true });

  stage?.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    isPaused = false;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) goNext();
      else goPrev();
    }
  }, { passive: true });

  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft') goPrev();
  });

  activeSlides = getSlides(activeKey);
  if (activeSlides.length) {
    setSlideData(activeSlides[0]);
    slide?.classList.add('is-active');
    startAutoplay();
  }
}

/**
 * Cases slider — card carousel + location dropdown (notebook sketch)
 */

const SWIPE_THRESHOLD = 44;

export function initCasesSlider(root) {
  if (!root) return;

  const dataEl = root.querySelector('#mcs-data');
  const template = root.querySelector('#mcs-card-template');
  if (!dataEl || !template) return;

  let cases = {};
  let regions = [];
  try {
    const parsed = JSON.parse(dataEl.textContent || '{}');
    cases = parsed.cases || {};
    regions = parsed.regions || [];
  } catch (err) {
    console.error('Cases slider: invalid JSON', err);
    return;
  }

  const track = root.querySelector('[data-case-track]');
  const viewport = root.querySelector('[data-case-stage]');
  const prevBtn = root.querySelector('[data-case-prev]');
  const nextBtn = root.querySelector('[data-case-next]');
  const localeRoot = root.querySelector('[data-case-locale]');
  const localeBtn = root.querySelector('[data-case-locale-btn]');
  const localeLabel = root.querySelector('[data-case-locale-label]');
  const localeMenu = root.querySelector('[data-case-locale-menu]');
  const options = root.querySelectorAll('[data-case-filter]');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let activeKey = 'all';
  let activeSlides = [];
  let index = 0;
  let perView = 3;
  let touchStartX = 0;

  function getSlides(key) {
    if (key === 'all') {
      return Object.keys(cases).reduce((acc, group) => acc.concat(cases[group] || []), []);
    }
    return cases[key] || [];
  }

  function regionLabel(id) {
    const found = regions.find((item) => item.id === id);
    return found?.label || 'Все';
  }

  function measurePerView() {
    const width = window.innerWidth;
    if (width <= 760) return 1;
    if (width <= 1180) return 2;
    return 3;
  }

  function maxIndex() {
    return Math.max(0, activeSlides.length - perView);
  }

  function updateArrows() {
    const atStart = index <= 0;
    const atEnd = index >= maxIndex();
    prevBtn.disabled = atStart;
    nextBtn.disabled = atEnd;
  }

  function updateTrack() {
    const card = track.querySelector('.mcs__card');
    if (!card) {
      track.style.transform = 'translateX(0)';
      updateArrows();
      return;
    }

    const styles = window.getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
    const step = card.getBoundingClientRect().width + gap;
    track.style.transform = `translateX(-${index * step}px)`;
    updateArrows();
  }

  function buildDashes(container, gallery, active = 0) {
    container.replaceChildren();
    const count = Math.max(1, Math.min(gallery.length, 4));
    if (gallery.length <= 1) {
      container.hidden = true;
      return;
    }
    container.hidden = false;
    for (let i = 0; i < count; i += 1) {
      const dash = document.createElement('span');
      dash.className = `mcs__dash${i === active ? ' is-active' : ''}`;
      container.appendChild(dash);
    }
  }

  function createCard(item) {
    const node = template.content.firstElementChild.cloneNode(true);
    const media = node.querySelector('[data-card-media]');
    const image = node.querySelector('[data-card-image]');
    const badge = node.querySelector('[data-card-badge]');
    const dashes = node.querySelector('[data-card-dashes]');
    const title = node.querySelector('[data-card-title]');
    const text = node.querySelector('[data-card-text]');
    const link = node.querySelector('[data-card-link]');

    const gallery = Array.isArray(item.gallery) && item.gallery.length
      ? item.gallery
      : [item.image].filter(Boolean);

    image.src = gallery[0] || '';
    image.alt = '';
    image.setAttribute('aria-hidden', 'true');
    badge.textContent = item.badge || item.regionLabel || '';
    badge.hidden = !badge.textContent;
    title.textContent = item.title || '';
    text.textContent = item.text || '';
    buildDashes(dashes, gallery, 0);

    const href = item.link || '';
    if (href) {
      media.href = href;
      link.href = href;
      link.classList.remove('is-hidden');
    } else {
      media.removeAttribute('href');
      media.setAttribute('role', 'presentation');
      link.href = '#';
      link.classList.add('is-hidden');
      link.addEventListener('click', (e) => e.preventDefault());
    }

    if (gallery.length > 1) {
      let photoIndex = 0;
      const cycle = (dir) => {
        photoIndex = (photoIndex + dir + gallery.length) % gallery.length;
        image.src = gallery[photoIndex];
        buildDashes(dashes, gallery, photoIndex % Math.min(gallery.length, 4));
      };
      media.addEventListener('click', (e) => {
        if (!href) e.preventDefault();
      });
      dashes.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        cycle(1);
      });
    }

    return node;
  }

  function renderCards() {
    activeSlides = getSlides(activeKey);
    track.replaceChildren();
    activeSlides.forEach((item) => {
      track.appendChild(createCard(item));
    });
    index = Math.min(index, maxIndex());
    requestAnimationFrame(updateTrack);
  }

  function setFilter(key, label) {
    activeKey = key || 'all';
    index = 0;
    localeLabel.textContent = label || regionLabel(activeKey) || 'Выбор локации';
    if (activeKey === 'all') {
      localeLabel.textContent = 'Выбор локации';
    }
    options.forEach((option) => {
      const selected = option.getAttribute('data-case-filter') === activeKey;
      option.classList.toggle('is-active', selected);
      option.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
    renderCards();
  }

  function closeLocale() {
    if (!localeMenu || !localeBtn) return;
    localeMenu.hidden = true;
    localeBtn.setAttribute('aria-expanded', 'false');
  }

  function toggleLocale() {
    const open = localeMenu.hidden;
    localeMenu.hidden = !open;
    localeBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function goNext() {
    index = Math.min(maxIndex(), index + 1);
    updateTrack();
  }

  function goPrev() {
    index = Math.max(0, index - 1);
    updateTrack();
  }

  localeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleLocale();
  });

  options.forEach((option) => {
    option.addEventListener('click', () => {
      const key = option.getAttribute('data-case-filter') || 'all';
      setFilter(key, option.textContent.trim());
      closeLocale();
    });
  });

  document.addEventListener('click', (e) => {
    if (!localeRoot?.contains(e.target)) closeLocale();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLocale();
  });

  prevBtn?.addEventListener('click', goPrev);
  nextBtn?.addEventListener('click', goNext);

  viewport?.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  viewport?.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) goNext();
      else goPrev();
    }
  }, { passive: true });

  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft') goPrev();
  });

  window.addEventListener('resize', () => {
    const next = measurePerView();
    if (next !== perView) {
      perView = next;
      index = Math.min(index, maxIndex());
    }
    updateTrack();
  });

  // Prefer regions from DOM options if JSON omitted them
  if (!regions.length) {
    regions = Array.from(options).map((option) => ({
      id: option.getAttribute('data-case-filter'),
      label: option.textContent.trim(),
    }));
  }

  perView = measurePerView();
  setFilter('all');

  if (reducedMotion) {
    track.style.transition = 'none';
  }
}

/**
 * Cases slider — card carousel with region/duration filters
 */

import { applyI18n, getLang, t } from '../../core/i18n.js';

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
  const durationRoot = root.querySelector('[data-case-duration]');
  const durationBtn = root.querySelector('[data-case-duration-btn]');
  const durationLabel = root.querySelector('[data-case-duration-label]');
  const durationMenu = root.querySelector('[data-case-duration-menu]');
  const dayOptions = root.querySelectorAll('[data-case-days]');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let activeKey = 'all';
  let activeDays = 0;
  let activeSlides = [];
  let index = 0;
  let perView = 3;
  let touchStartX = 0;

  function getSlides() {
    const list = activeKey === 'all'
      ? Object.keys(cases).reduce((acc, group) => acc.concat(cases[group] || []), [])
      : (cases[activeKey] || []);

    if (!activeDays) return list;
    return list.filter((item) => Number(item.days) === activeDays);
  }

  function regionLabel(id) {
    const found = regions.find((item) => item.id === id);
    return found?.label || 'Все направления';
  }

  function measurePerView() {
    const width = window.innerWidth;
    if (width <= 980) return 1;
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

  function createCard(item) {
    const node = template.content.firstElementChild.cloneNode(true);
    const media = node.querySelector('[data-card-media]');
    const image = node.querySelector('[data-card-image]');
    const badge = node.querySelector('[data-card-badge]');
    const flag = node.querySelector('[data-card-flag]');
    const country = node.querySelector('[data-card-country]');
    const days = node.querySelector('[data-card-days]');
    const title = node.querySelector('[data-card-title]');
    const text = node.querySelector('[data-card-text]');
    const link = node.querySelector('[data-card-link]');

    image.src = item.image || '';
    image.alt = '';
    image.setAttribute('aria-hidden', 'true');
    const en = getLang() === 'en';
    const countryName = (en && item.countryEn) || item.country || item.badge || item.regionLabel || '';
    if (flag) flag.textContent = item.flag || '';
    if (country) country.textContent = countryName;
    badge.hidden = !countryName;
    const dayCount = Number(item.days) || 0;
    if (days) {
      days.textContent = dayCount ? `${dayCount} ${t('cases.daysShort')}` : '';
      days.hidden = !dayCount;
    }
    title.textContent = (en && item.titleEn) || item.title || '';
    text.textContent = (en && item.textEn) || item.text || '';

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

    return node;
  }

  function renderCards() {
    activeSlides = getSlides();
    track.replaceChildren();
    activeSlides.forEach((item) => {
      track.appendChild(createCard(item));
    });
    index = Math.min(index, maxIndex());
    requestAnimationFrame(updateTrack);
    applyI18n(track);
  }

  function daysLabel(days) {
    const value = Number(days) || 0;
    if (!value) return t('cases.allDays');
    return `${value} ${t('cases.days')}`;
  }

  function refreshCopy() {
    applyI18n(root);
    dayOptions.forEach((option) => {
      const value = option.getAttribute('data-case-days') || '';
      if (value) option.textContent = daysLabel(value);
    });
    if (activeKey === 'all') localeLabel.textContent = t('cases.region');
    else localeLabel.textContent = t(`region.${activeKey}`) || regionLabel(activeKey);
    durationLabel.textContent = activeDays ? daysLabel(activeDays) : t('cases.duration');
    renderCards();
  }

  function setRegion(key, label) {
    activeKey = key || 'all';
    index = 0;
    localeLabel.textContent = activeKey === 'all'
      ? t('cases.region')
      : (t(`region.${activeKey}`) || label || regionLabel(activeKey));
    options.forEach((option) => {
      const selected = option.getAttribute('data-case-filter') === activeKey;
      option.classList.toggle('is-active', selected);
      option.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
    renderCards();
  }

  function setDuration(days, label) {
    activeDays = Number(days) || 0;
    index = 0;
    durationLabel.textContent = activeDays ? daysLabel(activeDays) : t('cases.duration');
    dayOptions.forEach((option) => {
      const value = option.getAttribute('data-case-days') || '';
      const selected = (Number(value) || 0) === activeDays;
      option.classList.toggle('is-active', selected);
      option.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
    renderCards();
  }

  function isMobileFilters() {
    return window.matchMedia('(max-width: 980px)').matches;
  }

  function alignMenu(menu, btn) {
    if (!menu || !btn) return;

    if (!isMobileFilters() || menu.hidden) {
      menu.style.removeProperty('--mcs-caret-x');
      return;
    }

    const toolbar = root.querySelector('.mcs__toolbar');
    const toolbarRect = toolbar.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const caretX = btnRect.left + btnRect.width / 2 - toolbarRect.left;

    menu.style.setProperty('--mcs-caret-x', `${Math.max(18, caretX)}px`);
  }

  function closeMenu(menu, btn) {
    if (!menu || !btn) return;
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    menu.style.removeProperty('--mcs-caret-x');
  }

  function toggleMenu(menu, btn) {
    const open = menu.hidden;
    closeMenu(localeMenu, localeBtn);
    closeMenu(durationMenu, durationBtn);
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) alignMenu(menu, btn);
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
    toggleMenu(localeMenu, localeBtn);
  });

  durationBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu(durationMenu, durationBtn);
  });

  options.forEach((option) => {
    option.addEventListener('click', () => {
      const key = option.getAttribute('data-case-filter') || 'all';
      setRegion(key, option.textContent.trim());
      closeMenu(localeMenu, localeBtn);
    });
  });

  dayOptions.forEach((option) => {
    option.addEventListener('click', () => {
      setDuration(option.getAttribute('data-case-days'), option.textContent.trim());
      closeMenu(durationMenu, durationBtn);
    });
  });

  document.addEventListener('click', (e) => {
    if (!localeRoot?.contains(e.target)) closeMenu(localeMenu, localeBtn);
    if (!durationRoot?.contains(e.target)) closeMenu(durationMenu, durationBtn);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMenu(localeMenu, localeBtn);
      closeMenu(durationMenu, durationBtn);
    }
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
    alignMenu(localeMenu, localeBtn);
    alignMenu(durationMenu, durationBtn);
  });

  document.addEventListener('ct:prefs', refreshCopy);

  if (!regions.length) {
    regions = Array.from(options).map((option) => ({
      id: option.getAttribute('data-case-filter'),
      label: option.textContent.trim(),
    }));
  }

  perView = measurePerView();
  setRegion('all');
  refreshCopy();

  if (reducedMotion) {
    track.style.transition = 'none';
  }
}

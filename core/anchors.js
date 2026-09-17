/**
 * Якоря секций главной: hash ↔ селектор ↔ визуальная цель скролла.
 * Header scroll-spy и ссылки футера/hash используют этот модуль.
 * «Обо мне» (#about) открывает drawer профиля — не секция страницы.
 *
 * Модель скролла: верх SECTION сразу под фиксированной шапкой.
 * padding-top секции (--space-section-y ≈ 96px desktop) — воздух до заголовка.
 * Скролл к самому заголовку оставлял бы ~25px (96 − высота шапки).
 */

export const SECTION_ANCHORS = {
  cases: '#cases',
  services: '#services',
  reviews: '#reviews',
  news: '#news',
};

function getHeader() {
  return document.getElementById('lux-header');
}

function closeHeaderMenu() {
  const header = getHeader();
  if (!header) return;
  header.classList.remove('menu-open');
  document.documentElement.classList.remove('is-nav-open');
  document.body.classList.remove('is-nav-open');
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
}

export function anchorOffset() {
  const header = getHeader();
  return header?.offsetHeight || 72;
}

export function selectorForHash(key) {
  return SECTION_ANCHORS[key] || '';
}

export function keyForSelector(selector) {
  if (selector === 'about-drawer' || selector === '.uc-about') return 'about';
  return Object.keys(SECTION_ANCHORS).find((key) => SECTION_ANCHORS[key] === selector) || '';
}

export function hashUrl(key) {
  const base = document.documentElement.dataset.basePath || '';
  return key ? `${base}/#${key}` : `${base}/`;
}

/** True только если загруженный документ — главная (не иллюзия от pushState). */
export function isHomeDocument() {
  return document.documentElement.dataset.page === 'home';
}

/**
 * Перейти к hash главной с любой страницы.
 * «Обо мне» — глобальный drawer: открываем на месте, без ухода на `/`.
 * Остальные якоря вне главной — полная загрузка `/` (с одноразовым `?to=`),
 * чтобы старый pushState на `/#…` не оставил нас на внутренней странице.
 */
export function navigateToHomeHash(key, { smooth = true } = {}) {
  const safeKey = key || '';

  if (safeKey === 'about') {
    const { pathname, search } = window.location;
    history.pushState(null, '', `${pathname}${search}#about`);
    closeHeaderMenu();
    window.openAboutDrawer?.();
    return;
  }

  if (!isHomeDocument()) {
    const base = document.documentElement.dataset.basePath || '';
    const hash = safeKey ? `#${safeKey}` : '';
    // `?to=` отличает URL от «битого» `/#…` после pushState → полная загрузка
    window.location.assign(`${base}/?to=${encodeURIComponent(safeKey || 'home')}${hash}`);
    return;
  }

  history.pushState(null, '', hashUrl(safeKey));
  closeHeaderMenu();

  const selector = SECTION_ANCHORS[safeKey];
  if (!selector) return;
  window.setTimeout(() => scrollToBlock(selector, smooth), smooth ? 80 : 0);
}

/** Убрать временный `?to=` после посадки на главную (чистый URL `/#section`). */
function stripToQuery() {
  if (!isHomeDocument()) return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has('to')) return;
  const key = window.location.hash.replace(/^#/, '') || url.searchParams.get('to') || '';
  history.replaceState(null, '', hashUrl(key === 'home' ? '' : key));
}

export function getAnchorTarget(selector) {
  return document.querySelector(selector);
}

let scrollTimer = 0;

export function scrollToBlock(selector, smooth = true) {
  const section = getAnchorTarget(selector);
  if (!section) return;

  const headerH = anchorOffset();
  const y = () => {
    const top = section.getBoundingClientRect().top;
    const pageY = window.pageYOffset
      || document.documentElement.scrollTop
      || document.body.scrollTop
      || 0;
    return Math.max(0, top + pageY - headerH);
  };

  const apply = (behavior) => {
    const top = y();
    const se = document.scrollingElement || document.documentElement;
    if (behavior === 'smooth') {
      window.scrollTo({ top, behavior: 'smooth' });
    } else {
      se.scrollTop = top;
      if (se !== document.body) document.body.scrollTop = top;
      window.scrollTo(0, top);
    }
  };

  window.clearTimeout(scrollTimer);
  apply(smooth ? 'smooth' : 'auto');

  // Нативный hash / layout / preloader могут сбить позицию — зафиксировать снова
  scrollTimer = window.setTimeout(() => {
    const delta = section.getBoundingClientRect().top - headerH;
    if (Math.abs(delta) > 2) apply('auto');
  }, smooth ? 480 : 80);
}

export function scrollFromLocationHash({ smooth = false } = {}) {
  if (!window.location.hash) return;

  const key = window.location.hash.replace('#', '');
  if (key === 'about') {
    window.openAboutDrawer?.();
    return;
  }

  const selector = SECTION_ANCHORS[key];
  if (!selector || !getAnchorTarget(selector)) return;

  closeHeaderMenu();
  scrollToBlock(selector, smooth);
}

export function initAnchors() {
  try {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  } catch (_) { /* */ }

  stripToQuery();

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="/#"], a[href^="#"]');
    if (!link) return;

    // Header сам ведёт data-anchor ссылки (spy + scroll).
    if (link.hasAttribute('data-anchor') && link.getAttribute('data-anchor')) return;

    const href = link.getAttribute('href') || '';
    if (!href.includes('#')) return;

    const key = href.split('#')[1] || '';
    if (!key) return;

    if (key === 'about' || key in SECTION_ANCHORS) {
      e.preventDefault();
      e.stopPropagation();
      navigateToHomeHash(key, { smooth: true });
    }
  });

  function runHashScroll() {
    if (!isHomeDocument()) return;
    // Preloader блокирует overflow — скролл сейчас часто no-op
    if (document.documentElement.classList.contains('is-preloading')) return;
    scrollFromLocationHash({ smooth: false });
  }

  function scheduleHashScroll() {
    runHashScroll();
    // Layout / шрифты / поздние картинки могут сдвинуть верх секций
    window.setTimeout(runHashScroll, 120);
    window.setTimeout(runHashScroll, 450);
    window.setTimeout(runHashScroll, 900);
  }

  if (document.readyState === 'complete') scheduleHashScroll();
  else window.addEventListener('load', scheduleHashScroll);

  document.addEventListener('ct:preloader-done', () => {
    window.setTimeout(scheduleHashScroll, 40);
  });

  // Если модули стартовали после конца preloader — всё равно скроллим
  if (!document.documentElement.classList.contains('is-preloading')) {
    window.setTimeout(scheduleHashScroll, 0);
  }
}

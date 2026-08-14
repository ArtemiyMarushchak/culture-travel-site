/**
 * Home-section anchors: hash ↔ selector ↔ visual scroll target.
 * Header scroll-spy and footer/hash links all use this module.
 */

export const SECTION_ANCHORS = {
  about: '.uc-about',
  cases: '.uc-cases',
  services: '.uc-services',
  reviews: '.uc-reviews',
};

/** Prefer the title/card so scroll lands under the header with air. */
const VISUAL_TARGET = {
  '.uc-about': '.aa__frame',
  '.uc-cases': '.mcs__title',
  '.uc-services': '.sv__title',
  '.uc-reviews': '.rv__title',
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
  const styles = getComputedStyle(document.documentElement);
  const header = getHeader();
  const headerH = header?.offsetHeight
    || parseFloat(styles.getPropertyValue('--header-height'))
    || 72;
  const air = parseFloat(styles.getPropertyValue('--space-anchor-air')) || 24;
  return headerH + air;
}

export function selectorForHash(key) {
  return SECTION_ANCHORS[key] || '';
}

export function keyForSelector(selector) {
  return Object.keys(SECTION_ANCHORS).find((key) => SECTION_ANCHORS[key] === selector) || '';
}

export function hashUrl(key) {
  const base = document.documentElement.dataset.basePath || '';
  return key ? `${base}/#${key}` : `${base}/`;
}

export function getAnchorTarget(selector) {
  const visual = VISUAL_TARGET[selector];
  if (visual) {
    const node = document.querySelector(visual);
    if (node) return node;
  }
  if (selector === '.uc-about') {
    return document.querySelector('#anna-about') || document.querySelector('.uc-about');
  }
  return document.querySelector(selector);
}

export function scrollToBlock(selector, smooth = true) {
  const target = getAnchorTarget(selector);
  if (!target) return;

  const top = Math.max(
    0,
    target.getBoundingClientRect().top + window.pageYOffset - anchorOffset(),
  );

  window.scrollTo({
    top,
    behavior: smooth ? 'smooth' : 'auto',
  });
}

export function initAnchors() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="/#"], a[href^="#"]');
    if (!link) return;

    // Header owns data-anchor links (spy + scroll).
    if (link.hasAttribute('data-anchor')) return;

    const href = link.getAttribute('href') || '';
    if (!href.includes('#')) return;

    const key = href.split('#')[1] || '';
    if (!key || !(key in SECTION_ANCHORS)) return;

    const selector = SECTION_ANCHORS[key];
    if (!selector || !getAnchorTarget(selector)) return;

    e.preventDefault();
    e.stopPropagation();

    closeHeaderMenu();
    history.pushState(null, '', hashUrl(key));
    setTimeout(() => scrollToBlock(selector, true), 120);
  });

  window.addEventListener('load', () => {
    if (!window.location.hash) return;

    const key = window.location.hash.replace('#', '');
    const selector = SECTION_ANCHORS[key];
    if (!selector) return;

    setTimeout(() => {
      closeHeaderMenu();
      scrollToBlock(selector, false);
    }, 120);
  });
}

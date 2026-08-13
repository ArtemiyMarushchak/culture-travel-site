const hashMap = {
  about: '.uc-about',
  cases: '.uc-cases',
  services: '.uc-services',
  reviews: '.uc-reviews',
};

function getHeader() {
  return document.getElementById('lux-header');
}

function getHeaderHeight() {
  const header = getHeader();
  return header ? header.offsetHeight : 0;
}

function closeHeaderMenu() {
  const header = getHeader();
  if (!header) return;
  header.classList.remove('menu-open');
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
}

function sectionAir() {
  return window.matchMedia('(max-width: 1180px)').matches ? 20 : 40;
}

function getAnchorTarget(selector) {
  if (selector === '.uc-about') {
    return document.querySelector('.aa__frame') || document.querySelector('.uc-about');
  }
  return document.querySelector(selector);
}

function usesFrameOffset(selector) {
  return selector === '.uc-about';
}

function scrollToBlock(selector, smooth) {
  const target = getAnchorTarget(selector);
  if (!target) return;

  const offset = usesFrameOffset(selector)
    ? getHeaderHeight() + sectionAir()
    : getHeaderHeight();
  const top = Math.max(0, target.getBoundingClientRect().top + window.pageYOffset - offset);
  window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
}

export function initAnchors() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-anchor], a[href^="/#"], a[href^="#"]');
    if (!link) return;

    let selector = link.getAttribute('data-anchor');
    const href = link.getAttribute('href') || '';

    if (!selector && href.includes('#')) {
      const key = href.split('#')[1];
      selector = hashMap[key];
    }

    if (!selector) return;
    if (!getAnchorTarget(selector)) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    closeHeaderMenu();

    let hashKey = '';
    Object.keys(hashMap).forEach((key) => {
      if (hashMap[key] === selector) hashKey = key;
    });

    if (hashKey) history.pushState(null, '', `/#${hashKey}`);

    setTimeout(() => scrollToBlock(selector, true), 120);
  }, true);

  window.addEventListener('load', () => {
    if (!window.location.hash) return;

    const key = window.location.hash.replace('#', '');
    const selector = hashMap[key];

    if (selector) {
      setTimeout(() => {
        closeHeaderMenu();
        scrollToBlock(selector, false);
      }, 700);
    }
  });
}

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

function getAnchorTarget(selector) {
  const target = document.querySelector(selector);
  if (!target) return null;
  if (selector === '.uc-about') {
    return target.querySelector('#anna-about') || target;
  }
  return target;
}

function scrollToBlock(selector, smooth) {
  const target = getAnchorTarget(selector);
  if (!target) return;

  const top = target.getBoundingClientRect().top + window.pageYOffset - getHeaderHeight();
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

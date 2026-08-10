export function initHeader(root) {
  const header = root || document.getElementById('lux-header');
  if (!header) return;

  if (header.parentElement !== document.body) {
    document.body.prepend(header);
  }

  const burger = header.querySelector('.lh__burger');
  const topmenu = header.querySelector('.lh__topmenu');
  const scrollThreshold = 40;

  const hashMap = {
    about: '.uc-about',
    cases: '.uc-cases',
    services: '.uc-services',
    reviews: '.uc-reviews',
  };

  function isHome() {
    if (header.dataset.home === 'true') return true;
    if (document.body.dataset.page === 'home') return true;
    if (document.querySelector('.uc-video')) return true;

    const path = location.pathname.replace(/\/+$/, '');
    if (path === '' || path === '/') return true;
    if (/\/(index|home)(\.html)?$/i.test(path)) return true;

    return false;
  }

  function getHashKeyBySelector(selector) {
    return Object.keys(hashMap).find((k) => hashMap[k] === selector) || '';
  }

  function getHeaderHeight() {
    return header.offsetHeight || 0;
  }

  function closeMenu() {
    header.classList.remove('menu-open');
    burger?.setAttribute('aria-expanded', 'false');
    topmenu?.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  function toggleMenu() {
    header.classList.toggle('menu-open');
    const opened = header.classList.contains('menu-open');
    burger?.setAttribute('aria-expanded', opened ? 'true' : 'false');
    topmenu?.setAttribute('aria-hidden', opened ? 'false' : 'true');
    document.documentElement.style.overflow = opened ? 'hidden' : '';
    document.body.style.overflow = opened ? 'hidden' : '';
  }

  function updateHeader() {
    if (!isHome()) {
      header.classList.add('is-inner');
      header.classList.remove('is-scrolled');
      return;
    }

    header.classList.remove('is-inner');
    header.classList.toggle('is-scrolled', window.scrollY > scrollThreshold);
  }

  function getTarget(selector) {
    const outer = document.querySelector(selector);
    if (!outer) return null;
    if (selector === '.uc-about') {
      return outer.querySelector('#anna-about') || outer;
    }
    return outer;
  }

  function scrollToTarget(selector, smooth) {
    const target = getTarget(selector);
    if (!target) return;

    const top = target.getBoundingClientRect().top + window.pageYOffset - getHeaderHeight();
    window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
  }

  function goToHomeAnchor(selector) {
    const key = getHashKeyBySelector(selector);
    window.location.href = key ? `/#${key}` : '/';
  }

  burger?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMenu();
  });

  document.addEventListener('click', (e) => {
    const anchorLink = e.target.closest('a[data-anchor]');

    if (anchorLink) {
      const selector = anchorLink.getAttribute('data-anchor');
      if (!selector) return;

      e.preventDefault();
      e.stopPropagation();

      closeMenu();

      if (!isHome()) {
        goToHomeAnchor(selector);
        return;
      }

      const key = getHashKeyBySelector(selector);
      if (key) history.pushState(null, '', `/#${key}`);

      setTimeout(() => scrollToTarget(selector, true), 120);
      return;
    }

    const menuLink = e.target.closest('.lh__menu-links a, .lh__menu-cta');
    if (menuLink && !menuLink.getAttribute('data-anchor')) {
      closeMenu();
      return;
    }

    if (!header.contains(e.target)) {
      closeMenu();
    }
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  window.addEventListener('scroll', updateHeader, { passive: true });

  window.addEventListener('load', () => {
    if (isHome() && window.location.hash) {
      const key = window.location.hash.replace('#', '');
      const selector = hashMap[key];
      if (selector) {
        setTimeout(() => {
          closeMenu();
          scrollToTarget(selector, false);
        }, 700);
      }
    }
    updateHeader();
  });

  updateHeader();

  return { updateHeader };
}

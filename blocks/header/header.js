/**
 * Culture Travel — header (vanilla JS, без фреймворков)
 * Прозрачная → чёрная при скролле, якоря, scroll-spy, мобильное меню
 */

const SCROLL_THRESHOLD = 40;
const HASH_MAP = {
  about: '.uc-about',
  cases: '.uc-cases',
  services: '.uc-services',
  reviews: '.uc-reviews',
};

class SiteHeader {
  #root;
  #burger;
  #topmenu;
  #spyLinks = [];
  #sections = [];
  #scrollTick = false;
  #reducedMotion = false;

  constructor(root) {
    this.#root = root;
    this.#burger = root?.querySelector('.lh__burger');
    this.#topmenu = root?.querySelector('.lh__topmenu');
    this.#reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  init() {
    if (!this.#root) return null;

    if (this.#root.parentElement !== document.body) {
      document.body.prepend(this.#root);
    }

    this.#collectSpyTargets();
    this.#bindEvents();
    this.#syncFromHash();
    this.update();

    return this;
  }

  #collectSpyTargets() {
    this.#spyLinks = [...this.#root.querySelectorAll('a[data-anchor]')]
      .filter((link) => Boolean(link.getAttribute('data-anchor')));
    this.#sections = Object.entries(HASH_MAP)
      .map(([key, selector]) => {
        const node = this.#getTarget(selector);
        return node ? { key, selector, node } : null;
      })
      .filter(Boolean);
  }

  #bindEvents() {
    this.#burger?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.toggleMenu();
    });

    document.addEventListener('click', (event) => this.#onDocumentClick(event), true);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.closeMenu();
    });

    window.addEventListener('scroll', () => this.#onScroll(), { passive: true });
    window.addEventListener('resize', () => this.#onScroll(), { passive: true });

    window.addEventListener('load', () => {
      this.#collectSpyTargets();
      this.#syncFromHash();
      this.update();
    });
  }

  #onScroll() {
    if (this.#scrollTick) return;
    this.#scrollTick = true;

    window.requestAnimationFrame(() => {
      this.update();
      this.#scrollTick = false;
    });
  }

  update() {
    this.#updateHeaderState();
    this.#updateActiveLink();
  }

  #updateHeaderState() {
    if (!this.#isHome()) {
      this.#root.classList.add('is-inner');
      this.#root.classList.remove('is-scrolled');
      return;
    }

    this.#root.classList.remove('is-inner');
    this.#root.classList.toggle('is-scrolled', window.scrollY > SCROLL_THRESHOLD);
  }

  #updateActiveLink() {
    if (!this.#isHome() || !this.#sections.length) {
      this.#setActiveLink('');
      return;
    }

    const offset = this.#headerHeight() + 24;
    let current = '';

    for (const section of this.#sections) {
      const top = section.node.getBoundingClientRect().top;
      if (top - offset <= 0) current = section.key;
    }

    this.#setActiveLink(current);
  }

  #setActiveLink(key) {
    this.#spyLinks.forEach((link) => {
      const anchor = link.getAttribute('data-anchor') || '';
      const linkKey = this.#keyFromSelector(anchor);
      link.classList.toggle('is-active', Boolean(key && linkKey === key));
    });
  }

  #syncFromHash() {
    if (!this.#isHome() || !window.location.hash) return;

    const key = window.location.hash.replace('#', '');
    const selector = HASH_MAP[key];
    if (!selector) return;

    window.setTimeout(() => {
      this.closeMenu();
      this.#scrollToTarget(selector, false);
      this.#setActiveLink(key);
    }, this.#reducedMotion ? 0 : 700);
  }

  #onDocumentClick(event) {
    const anchorLink = event.target.closest('a[data-anchor]');

    if (anchorLink) {
      const selector = anchorLink.getAttribute('data-anchor');
      if (!selector) return;

      event.preventDefault();
      event.stopPropagation();
      this.closeMenu();

      if (!this.#isHome()) {
        this.#goToHomeAnchor(selector);
        return;
      }

      const key = this.#keyFromSelector(selector);
      if (key) history.pushState(null, '', `/#${key}`);

      window.setTimeout(
        () => this.#scrollToTarget(selector, !this.#reducedMotion),
        this.#reducedMotion ? 0 : 120,
      );
      return;
    }

    const menuLink = event.target.closest('.lh__menu-link, .lh__menu-cta');
    if (menuLink && !menuLink.getAttribute('data-anchor')) {
      this.closeMenu();
      return;
    }

    if (!this.#root.contains(event.target)) {
      this.closeMenu();
    }
  }

  toggleMenu() {
    if (this.#root.classList.contains('menu-open')) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    this.#root.classList.add('menu-open');
    this.#burger?.setAttribute('aria-expanded', 'true');
    this.#topmenu?.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('is-nav-open');
    document.body.classList.add('is-nav-open');
  }

  closeMenu() {
    this.#root.classList.remove('menu-open');
    this.#burger?.setAttribute('aria-expanded', 'false');
    this.#topmenu?.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('is-nav-open');
    document.body.classList.remove('is-nav-open');
  }

  #isHome() {
    if (this.#root.dataset.home === 'true') return true;
    if (document.body.dataset.page === 'home') return true;
    if (document.querySelector('.uc-video')) return true;

    const path = location.pathname.replace(/\/+$/, '');
    if (path === '' || path === '/') return true;
    if (/\/(index|home)(\.html)?$/i.test(path)) return true;

    const base = document.documentElement.dataset.basePath || '';
    if (base && (path === base.replace(/\/+$/, '') || path === base.replace(/\/+$/, '') + '/index')) {
      return true;
    }

    return false;
  }

  #headerHeight() {
    return this.#root.offsetHeight || 0;
  }

  #keyFromSelector(selector) {
    return Object.keys(HASH_MAP).find((key) => HASH_MAP[key] === selector) || '';
  }

  #getTarget(selector) {
    const outer = document.querySelector(selector);
    if (!outer) return null;
    if (selector === '.uc-about') {
      return outer.querySelector('#anna-about') || outer;
    }
    return outer;
  }

  #scrollToTarget(selector, smooth) {
    const target = this.#getTarget(selector);
    if (!target) return;

    const top = target.getBoundingClientRect().top + window.pageYOffset - this.#headerHeight();
    window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
  }

  #goToHomeAnchor(selector) {
    const key = this.#keyFromSelector(selector);
    const base = document.documentElement.dataset.basePath || '';
    window.location.href = key ? `${base}/#${key}` : `${base}/`;
  }
}

export function initHeader(root) {
  return new SiteHeader(root || document.getElementById('lux-header')).init();
}

/**
 * Culture Travel — header (vanilla JS, без фреймворков)
 * Glass header, якоря, scroll-spy, мобильное меню
 */

import { t } from '../../core/i18n.js';
import {
  SECTION_ANCHORS,
  anchorOffset,
  getAnchorTarget,
  hashUrl,
  keyForSelector,
  scrollToBlock,
  selectorForHash,
} from '../../core/anchors.js';

const SCROLL_THRESHOLD = 40;

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

class SiteHeader {
  #root;
  #burger;
  #topmenu;
  #searchInput;
  #searchIndex = null;
  #spyLinks = [];
  #sections = [];
  #scrollTick = false;
  #reducedMotion = false;
  #spyHold = '';
  #lastTap = 0;
  #lastTouchEnd = 0;

  constructor(root) {
    this.#root = root;
    this.#burger = root?.querySelector('.lh__burger');
    this.#topmenu = root?.querySelector('.lh__topmenu');
    this.#searchInput = root?.querySelector('[data-search-input="overlay"]');
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
    this.#sections = Object.entries(SECTION_ANCHORS)
      .map(([key, selector]) => {
        const node = getAnchorTarget(selector) || document.querySelector(selector);
        return node ? { key, selector, node } : null;
      })
      .filter(Boolean);
  }

  #bindEvents() {
    this.#root.addEventListener('touchend', (event) => this.#guardDoubleTap(event), { passive: false });

    this.#burger?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (this.#isBlindTap()) return;
      this.toggleMenu();
    });

    this.#root.querySelectorAll('[data-search-open]').forEach((el) => {
      el.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (this.#isBlindTap()) return;
        this.openSearch();
      });
    });

    this.#root.querySelectorAll('[data-search-close]').forEach((el) => {
      el.addEventListener('click', () => this.closeSearch());
    });

    this.#root.querySelectorAll('[data-search-form]').forEach((form) => {
      form.addEventListener('submit', (event) => event.preventDefault());
    });

    this.#root.querySelectorAll('[data-search-input]').forEach((input) => {
      input.addEventListener('input', () => {
        const scope = input.getAttribute('data-search-input') || 'overlay';
        this.#loadSearchIndex().then(() => this.#renderSearch(scope));
      });
    });

    this.#root.querySelectorAll('[data-search-results]').forEach((box) => {
      box.addEventListener('click', (event) => {
        if (!event.target.closest('a')) return;
        this.closeSearch();
        this.closeMenu();
      });
    });

    this.#root.querySelector('[data-menu-close]')?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (this.#isBlindTap()) return;
      this.closeMenu();
    });

    this.#root.querySelector('.lh__menu-brand-logo')?.addEventListener('click', () => {
      this.closeMenu();
    });

    this.#root.querySelector('[data-menu-search-open]')?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (this.#isBlindTap()) return;
      this.openDockSearch();
    });

    this.#root.querySelector('[data-search-clear="menu"]')?.addEventListener('click', (event) => {
      event.preventDefault();
      this.closeDockSearch();
    });

    document.addEventListener('ct:prefs', () => {
      this.#root.querySelectorAll('[data-search-input]').forEach((input) => {
        input.placeholder = t('search.placeholder');
      });
      if (this.#isBarSearchOpen()) this.#renderSearch('overlay');
    });

    document.addEventListener('click', (event) => this.#onDocumentClick(event), true);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if (this.#isBarSearchOpen()) {
          this.closeSearch();
          return;
        }
        if (this.#root.querySelector('.lh__menu-dock')?.classList.contains('is-searching')) {
          this.closeDockSearch();
          return;
        }
        this.closeMenu();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        this.openSearch();
      }
    });

    window.addEventListener('scroll', () => this.#onScroll(), { passive: true });
    window.addEventListener('resize', () => this.#onScroll(), { passive: true });

    const mobileMq = window.matchMedia('(max-width: 1180px)');
    const onBreakpoint = () => {
      this.#onScroll();
      if (mobileMq.matches) this.closeSearch();
      else this.closeMenu();
    };
    if (typeof mobileMq.addEventListener === 'function') {
      mobileMq.addEventListener('change', onBreakpoint);
    } else {
      mobileMq.addListener(onBreakpoint);
    }

    window.addEventListener('load', () => {
      this.#collectSpyTargets();
      this.#syncFromHash();
      this.update();
    });
  }

  #guardDoubleTap(event) {
    if (event.target.closest('input, textarea')) return;
    const now = Date.now();
    if (now - this.#lastTouchEnd < 380) {
      event.preventDefault();
    }
    this.#lastTouchEnd = now;
  }

  #isBlindTap() {
    const now = Date.now();
    if (now - this.#lastTap < 420) return true;
    this.#lastTap = now;
    return false;
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

    if (this.#spyHold) {
      this.#setActiveLink(this.#spyHold);
      return;
    }

    const probe = anchorOffset();
    let current = '';

    // Последняя секция, чей визуальный якорь уже прошёл линию под шапкой
    for (const section of this.#sections) {
      if (section.node.getBoundingClientRect().top <= probe) {
        current = section.key;
      }
    }

    this.#setActiveLink(current);
  }

  #setActiveLink(key) {
    this.#spyLinks.forEach((link) => {
      const anchor = link.getAttribute('data-anchor') || '';
      const linkKey = keyForSelector(anchor);
      link.classList.toggle('is-active', Boolean(key && linkKey === key));
    });
  }

  #syncFromHash() {
    if (!this.#isHome() || !window.location.hash) return;

    const key = window.location.hash.replace('#', '');
    const selector = selectorForHash(key);
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
      this.closeSearch();

      if (!this.#isHome()) {
        this.#goToHomeAnchor(selector);
        return;
      }

      const key = keyForSelector(selector);
      if (key) {
        history.pushState(null, '', hashUrl(key));
        this.#spyHold = key;
        this.#setActiveLink(key);
        window.setTimeout(() => {
          this.#spyHold = '';
          this.update();
        }, this.#reducedMotion ? 80 : 700);
      }

      window.setTimeout(
        () => this.#scrollToTarget(selector, !this.#reducedMotion),
        this.#reducedMotion ? 0 : 80,
      );
      return;
    }

    const menuLink = event.target.closest('.lh__menu-link, .lh__menu-cta');
    if (menuLink && !menuLink.getAttribute('data-anchor')) {
      this.closeMenu();
      return;
    }

    if (this.#isBarSearchOpen()) {
      const insideSearch = event.target.closest('.lh__bar-search, .lh__bar-results, [data-search-open]');
      if (!insideSearch) {
        this.closeSearch();
        return;
      }
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
    this.closeSearch();
    this.closeDockSearch();
    this.#root.classList.add('menu-open');
    this.#burger?.setAttribute('aria-expanded', 'true');
    this.#burger?.setAttribute('aria-label', t('header.menuClose'));
    this.#topmenu?.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('is-nav-open');
    document.body.classList.add('is-nav-open');
  }

  closeMenu() {
    this.closeDockSearch();
    this.#root.classList.remove('menu-open');
    this.#burger?.setAttribute('aria-expanded', 'false');
    this.#burger?.setAttribute('aria-label', t('header.menuOpen'));
    this.#topmenu?.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('is-nav-open');
    document.body.classList.remove('is-nav-open');
  }

  openDockSearch() {
    const dock = this.#root.querySelector('.lh__menu-dock');
    const fab = this.#root.querySelector('[data-menu-search-open]');
    const input = this.#root.querySelector('[data-search-input="menu"]');
    dock?.classList.add('is-searching');
    fab?.setAttribute('aria-expanded', 'true');
    if (input) {
      input.placeholder = t('search.placeholder');
      window.setTimeout(() => input.focus(), 80);
    }
    this.#loadSearchIndex().then(() => this.#renderSearch('menu'));
  }

  closeDockSearch() {
    const dock = this.#root.querySelector('.lh__menu-dock');
    const fab = this.#root.querySelector('[data-menu-search-open]');
    const input = this.#root.querySelector('[data-search-input="menu"]');
    dock?.classList.remove('is-searching');
    fab?.setAttribute('aria-expanded', 'false');
    if (input) input.value = '';
    this.#renderSearch('menu');
  }

  openSearch() {
    if (window.matchMedia('(max-width: 1180px)').matches) {
      if (!this.#root.classList.contains('menu-open')) this.openMenu();
      this.openDockSearch();
      return;
    }

    this.closeMenu();
    this.#root.classList.add('is-search-open');
    const form = this.#root.querySelector('.lh__bar-search');
    form?.setAttribute('aria-hidden', 'false');
    if (this.#searchInput) {
      this.#searchInput.placeholder = t('search.placeholder');
      this.#searchInput.value = '';
      window.setTimeout(() => this.#searchInput.focus(), 40);
    }
    this.#loadSearchIndex().then(() => this.#renderSearch('overlay'));
  }

  closeSearch() {
    if (!this.#isBarSearchOpen()) return;
    this.#root.classList.remove('is-search-open');
    this.#root.querySelector('.lh__bar-search')?.setAttribute('aria-hidden', 'true');
    if (this.#searchInput) this.#searchInput.value = '';
    this.#renderSearch('overlay');
  }

  #isBarSearchOpen() {
    return this.#root.classList.contains('is-search-open');
  }

  #basePath() {
    return document.documentElement.dataset.basePath || '';
  }

  async #loadSearchIndex() {
    if (this.#searchIndex) return this.#searchIndex;
    try {
      const response = await fetch(`${this.#basePath()}/search.json`);
      const data = await response.json();
      this.#searchIndex = data.items || [];
    } catch (err) {
      this.#searchIndex = [];
    }
    return this.#searchIndex;
  }

  #renderSearch(scope = 'overlay') {
    const input = this.#root.querySelector(`[data-search-input="${scope}"]`);
    const results = this.#root.querySelector(`[data-search-results="${scope}"]`);
    if (!results) return;

    const query = (input?.value || '').trim().toLowerCase();
    const en = document.documentElement.getAttribute('data-lang') === 'en';
    const links = this.#root.querySelector('.lh__menu-links');
    const prefs = this.#root.querySelector('.lh__menu-prefs');
    const groups = this.#root.querySelectorAll('.lh__menu-group');

    if (scope === 'menu') {
      results.hidden = !query;
      if (links) links.hidden = Boolean(query);
      if (prefs) prefs.hidden = Boolean(query);
      groups.forEach((group) => {
        group.hidden = Boolean(query);
      });
    }

    if (scope === 'overlay') {
      results.hidden = !query;
    }

    if (!query) {
      results.innerHTML = '';
      return;
    }

    const matches = (this.#searchIndex || []).filter((item) => {
      const hay = [item.title, item.titleEn, item.text, item.textEn, item.kind, item.kindEn]
        .join(' ')
        .toLowerCase();
      return hay.includes(query);
    }).slice(0, 12);

    if (!matches.length) {
      results.innerHTML = `<p class="lh__find-empty">${t('search.empty')}</p>`;
      return;
    }

    results.innerHTML = matches.map((item) => {
      const title = escapeHtml((en && item.titleEn) || item.title || '');
      const text = escapeHtml((en && item.textEn) || item.text || '');
      const kind = escapeHtml((en && item.kindEn) || item.kind || '');
      const href = escapeHtml(`${this.#basePath()}${item.href || '/'}`);
      const snippet = text ? `<span class="lh__find-text">${text}</span>` : '';
      return `<a class="lh__find-item" href="${href}"><span class="lh__find-kind">${kind}</span><span class="lh__find-name">${title}</span>${snippet}</a>`;
    }).join('');
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

  #scrollToTarget(selector, smooth) {
    scrollToBlock(selector, smooth);
  }

  #goToHomeAnchor(selector) {
    const key = keyForSelector(selector);
    window.location.href = hashUrl(key);
  }
}

export function initHeader(root) {
  return new SiteHeader(root || document.getElementById('lux-header')).init();
}

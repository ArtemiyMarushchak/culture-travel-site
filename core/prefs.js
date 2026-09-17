/**
 * Настройки темы и языка. Хранятся в localStorage.
 */

import { applyI18n, getLang, setLang, t } from './i18n.js';

const THEME_KEY = 'ct-theme';
const CHROME_DARK = '#0d0d0d'; // должен совпадать с --color-header
const CHROME_LIGHT = '#F6F6F6';

export function getTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

/** Оттенок URL-бара Safari / Chrome. */
export function setThemeColor(color) {
  document.querySelectorAll('meta[name="theme-color"]').forEach((el) => {
    el.setAttribute('content', color);
  });
}

/**
 * Тёмный chrome только над hero-видео на главной (и при открытом меню/modal).
 * Иначе Safari совпадает со светлой страницей (#F6F6F6).
 * color-scheme реально красит нижний URL-бар iOS Safari.
 */
export function syncSafariChrome() {
  const root = document.documentElement;
  const header = document.getElementById('lux-header');
  const menuOpen = Boolean(header?.classList.contains('menu-open'));
  const modalOpen = root.classList.contains('is-modal-open');
  const isHome = root.getAttribute('data-page') === 'home';

  let overHero = false;
  if (isHome && !menuOpen && !modalOpen) {
    const hero = document.getElementById('avb');
    if (hero) {
      overHero = hero.getBoundingClientRect().bottom > 64;
    } else {
      overHero = window.scrollY <= 40;
    }
  }

  const useDark = menuOpen || modalOpen || overHero;
  const color = useDark ? CHROME_DARK : CHROME_LIGHT;

  setThemeColor(color);
  root.style.colorScheme = useDark ? 'dark' : 'light';
  /* Бумага светлая после hero — у services не должно быть чёрного фона */
  root.style.backgroundColor = isHome && useDark ? CHROME_DARK : CHROME_LIGHT;
  root.classList.toggle('is-safari-dark', useDark);
}

export function setTheme(theme) {
  // Сайт только light — всегда фиксируем light
  const next = 'light';
  document.documentElement.setAttribute('data-theme', next);
  document.documentElement.setAttribute('data-light-only', 'true');
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch (err) {
    /* приватный режим */
  }

  syncSafariChrome();

  syncControls();
  document.dispatchEvent(new CustomEvent('ct:prefs', { detail: { theme: next, lang: getLang() } }));
}

function syncControls() {
  const theme = getTheme();
  const lang = getLang();

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    btn.setAttribute('data-theme-current', theme);
    btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    if (btn.getAttribute('role') === 'switch') {
      btn.setAttribute('aria-checked', theme === 'dark' ? 'true' : 'false');
      btn.setAttribute('aria-label', t('header.themeToDark'));
    } else {
      btn.setAttribute('aria-label', t(nextTheme === 'dark' ? 'header.themeToDark' : 'header.themeToLight'));
    }
  });

  document.querySelectorAll('[data-lang-toggle]').forEach((btn) => {
    const next = lang === 'en' ? 'ru' : 'en';
    const code = btn.querySelector('[data-lang-code]');
    if (code) code.textContent = next.toUpperCase();
    else if (!btn.querySelector('[data-lang-current]')) btn.textContent = next.toUpperCase();
    btn.setAttribute('aria-label', t(next === 'en' ? 'header.langToEn' : 'header.langToRu'));
  });

  document.querySelectorAll('[data-lang-current]').forEach((el) => {
    el.textContent = lang.toUpperCase();
  });
}

export function initPrefs() {
  applyI18n(document);
  syncControls();
  syncSafariChrome();

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      // Только light — переключатель отключён
    });
  });

  document.querySelectorAll('[data-lang-toggle]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      const next = getLang() === 'en' ? 'ru' : 'en';
      setLang(next);
      syncControls();
      document.dispatchEvent(new CustomEvent('ct:prefs', { detail: { theme: getTheme(), lang: next } }));
    });
  });
}

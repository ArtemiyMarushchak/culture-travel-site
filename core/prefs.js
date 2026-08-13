/**
 * Theme + language preferences. Persisted in localStorage.
 */

import { applyI18n, getLang, setLang, t } from './i18n.js';

const THEME_KEY = 'ct-theme';

export function getTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export function setTheme(theme) {
  const next = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  document.documentElement.style.colorScheme = next;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch (err) {
    /* private mode */
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', next === 'dark' ? '#0d0d0d' : '#F6F6F6');

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

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      setTheme(getTheme() === 'dark' ? 'light' : 'dark');
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

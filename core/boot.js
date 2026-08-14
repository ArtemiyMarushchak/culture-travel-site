/**
 * Apply stored theme/lang before first paint.
 * Classic script (not module) so CSP script-src 'self' allows it.
 */
(function () {
  var root = document.documentElement;
  var theme = 'dark';
  var lang = 'ru';

  try {
    var storedTheme = localStorage.getItem('ct-theme');
    if (storedTheme === 'dark' || storedTheme === 'light') theme = storedTheme;
    var storedLang = localStorage.getItem('ct-lang');
    if (storedLang === 'en' || storedLang === 'ru') lang = storedLang;
  } catch (err) {
    /* private mode */
  }

  root.setAttribute('data-theme', theme);
  root.setAttribute('data-lang', lang);
  root.setAttribute('lang', lang);
  root.style.colorScheme = theme;
  root.style.backgroundColor = theme === 'dark' ? '#0d0d0d' : '#F6F6F6';
})();

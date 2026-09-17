/**
 * Ранний boot (обычный script, не type=module).
 *
 * До первой отрисовки:
 * - ставит theme/lang на <html>
 * - показывает прелоадер, чтобы скрыть FOUC (вспышку нестилизованного контента)
 * - открывает страницу, когда шрифты/DOM готовы
 *
 * Не module: CSP script-src 'self' всегда пропускает этот файл.
 */
(function () {
  var root = document.documentElement;
  var theme = 'light';
  var lang = 'ru';
  var finished = false;

  try {
    var storedLang = localStorage.getItem('ct-lang');
    if (storedLang === 'en' || storedLang === 'ru') lang = storedLang;
    localStorage.setItem('ct-theme', 'light');
  } catch (err) {
    /* приватный режим */
  }

  root.setAttribute('data-theme', theme);
  root.setAttribute('data-lang', lang);
  root.setAttribute('lang', lang);
  root.setAttribute('data-light-only', 'true');
  /* Затемнение до reveal; на главной — тёмный Safari chrome */
  root.style.backgroundColor = '#0d0d0d';
  if (root.getAttribute('data-page') === 'home') {
    root.style.colorScheme = 'dark';
    root.classList.add('is-safari-dark');
  } else {
    root.style.colorScheme = theme;
  }

  var reduce = false;
  try {
    reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (err2) { /* */ }

  if (reduce) {
    root.classList.remove('is-preloading', 'is-preloaded');
  } else {
    root.classList.add('is-preloading');
  }

  function clearCover() {
    root.classList.remove('is-preloading', 'is-preloaded');
    if (root.getAttribute('data-page') !== 'home') {
      root.style.backgroundColor = '#F6F6F6';
    }
    var el = document.getElementById('ct-preloader');
    if (el) el.remove();
    try {
      document.dispatchEvent(new CustomEvent('ct:preloader-done'));
    } catch (err3) { /* */ }
  }

  function done() {
    if (finished || !root.classList.contains('is-preloading')) return;
    finished = true;
    /* Показать страницу под крышкой, затем плавно убрать крышку */
    root.classList.add('is-preloaded');
    window.setTimeout(clearCover, reduce ? 0 : 420);
  }

  function afterPaint(cb) {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(function () {
        requestAnimationFrame(cb);
      });
    } else {
      window.setTimeout(cb, 32);
    }
  }

  function whenAssetsReady(cb) {
    var minMs = 320;
    var started = Date.now();

    function finish() {
      var left = Math.max(0, minMs - (Date.now() - started));
      window.setTimeout(function () {
        afterPaint(cb);
      }, left);
    }

    var loadP = new Promise(function (resolve) {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', resolve, { once: true });
    });

    var fontsP =
      document.fonts && document.fonts.ready
        ? document.fonts.ready.catch(function () {})
        : Promise.resolve();

    Promise.all([loadP, fontsP]).then(finish, finish);
  }

  if (reduce) {
    clearCover();
  } else {
    whenAssetsReady(done);
    /* Страховка: не держать дольше 2.4 с */
    window.setTimeout(done, 2400);
  }
})();

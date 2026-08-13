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
  root.classList.add('is-preloading');

  function hidePreloader() {
    var layer = document.getElementById('ct-preloader');
    root.classList.remove('is-preloading');
    if (layer) {
      layer.classList.add('is-done');
      window.setTimeout(function () {
        if (layer.parentNode) layer.parentNode.removeChild(layer);
      }, 500);
    }
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function handEase(t) {
    return 1 - Math.pow(1 - t, 1.55);
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  }

  function measurePath(d, svg) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    el.setAttribute('d', d);
    svg.appendChild(el);
    var len = el.getTotalLength();
    svg.removeChild(el);
    return len;
  }

  function paintSignature(ctx, img, strokes, scale, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.scale(scale, scale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#fff';
    strokes.forEach(function (stroke) {
      if (stroke.progress <= 0) return;
      ctx.lineWidth = stroke.width;
      ctx.setLineDash([stroke.length * stroke.progress, stroke.length]);
      ctx.lineDashOffset = 0;
      ctx.stroke(stroke.path);
    });
    ctx.restore();
    ctx.globalCompositeOperation = 'source-in';
    ctx.drawImage(img, 0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }

  function writeSignature(layer) {
    var canvas = layer.querySelector('.ct-preloader__canvas');
    var svg = layer.querySelector('.ct-preloader__paths');
    if (!canvas || !svg || !canvas.getContext) return Promise.resolve();

    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    var scale = w / 257;
    var nodes = svg.querySelectorAll('path');
    var timings = [560, 110, 420, 540, 300, 780, 260, 340, 600];
    var pauses = [80, 100, 40, 70, 70, 40, 50, 50, 0];
    var strokes = [];
    var i;

    for (i = 0; i < nodes.length; i += 1) {
      strokes.push({
        path: new Path2D(nodes[i].getAttribute('d')),
        width: parseFloat(nodes[i].getAttribute('data-width')) || 12,
        length: measurePath(nodes[i].getAttribute('d'), svg),
        progress: 0,
        dur: timings[i] || 400,
        pause: pauses[i] || 0
      });
    }

    return loadImage(canvas.getAttribute('data-sign')).then(function (img) {
      function drawStroke(stroke) {
        return new Promise(function (resolve) {
          var start = performance.now();
          function frame(now) {
            var t = Math.min(1, (now - start) / stroke.dur);
            stroke.progress = handEase(t);
            paintSignature(ctx, img, strokes, scale, w, h);
            if (t < 1) window.requestAnimationFrame(frame);
            else resolve();
          }
          window.requestAnimationFrame(frame);
        });
      }

      return strokes.reduce(function (chain, stroke) {
        return chain.then(function () {
          return drawStroke(stroke).then(function () {
            return wait(stroke.pause);
          });
        });
      }, Promise.resolve()).then(function () {
        var start = performance.now();
        return new Promise(function (resolve) {
          function frame(now) {
            var t = Math.min(1, (now - start) / 240);
            paintSignature(ctx, img, strokes, scale, w, h);
            ctx.globalAlpha = t;
            ctx.drawImage(img, 0, 0, w, h);
            ctx.globalAlpha = 1;
            if (t < 1) window.requestAnimationFrame(frame);
            else resolve();
          }
          window.requestAnimationFrame(frame);
        });
      });
    });
  }

  function startPreloader() {
    var layer = document.getElementById('ct-preloader');
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!layer) {
      hidePreloader();
      return;
    }
    if (reduced) {
      var canvas = layer.querySelector('.ct-preloader__canvas');
      if (canvas) {
        loadImage(canvas.getAttribute('data-sign')).then(function (img) {
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }).catch(function () {});
      }
      window.setTimeout(hidePreloader, 220);
      return;
    }

    writeSignature(layer).then(function () {
      return wait(360);
    }).then(hidePreloader).catch(hidePreloader);
  }

  if (document.readyState === 'complete') startPreloader();
  else window.addEventListener('load', startPreloader);
})();

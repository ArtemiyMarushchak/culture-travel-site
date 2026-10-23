/**
 * /typography/ — подписывает под каждой ролью реальные computed-значения.
 */

const round = (n, d = 2) => Number(n.toFixed(d));

function describe(el) {
  const cs = getComputedStyle(el);
  const size = parseFloat(cs.fontSize);
  const lhPx = parseFloat(cs.lineHeight);
  const lh = Number.isFinite(lhPx) ? `${round(lhPx, 1)}px (${round(lhPx / size)})` : 'normal';
  const lsPx = parseFloat(cs.letterSpacing);
  const ls = Number.isFinite(lsPx) && lsPx !== 0 ? `${round(lsPx / size, 3)}em` : '0';
  return `${round(size, 1)}px · вес ${cs.fontWeight}\nинтерлиньяж ${lh}\nтрекинг ${ls}`;
}

export function initTypeSpecimen(root) {
  if (!root || root.dataset.ready === 'true') return;
  root.dataset.ready = 'true';

  const vw = root.querySelector('[data-tsp-vw]');

  const update = () => {
    if (vw) vw.textContent = `${window.innerWidth} × ${window.innerHeight}px`;
    root.querySelectorAll('.tsp__row').forEach((row) => {
      const out = row.querySelector('[data-tsp-val]');
      const sample = row.querySelector('[data-tsp-measure]') || row.querySelector('.tsp__sample');
      if (out && sample) out.textContent = describe(sample);
    });
  };

  root.addEventListener('click', (e) => {
    if (e.target.closest('a[href="#"]')) e.preventDefault();
  });

  let raf = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(update);
  });

  (document.fonts?.ready || Promise.resolve()).then(update);
  update();
}

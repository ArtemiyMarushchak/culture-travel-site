/**
 * Аккордеон направлений круизов.
 * Первое (или data-open) открыто; клик переключает, одновременно одно.
 */
export function initCruisesPage(root) {
  if (!root || root.dataset.ready === 'true') return;
  root.dataset.ready = 'true';

  const accordion = root.querySelector('[data-cruises-accordion]');
  if (!accordion) return;

  const regions = [...accordion.querySelectorAll('[data-cruise-region]')];

  function setOpen(target, open) {
    const btn = target.querySelector('[data-cruise-toggle]');
    const panel = target.querySelector('[data-cruise-panel]');
    target.classList.toggle('is-open', open);
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (panel) {
      if (open) panel.removeAttribute('hidden');
      else panel.setAttribute('hidden', '');
    }
  }

  accordion.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-cruise-toggle]');
    if (!btn || !accordion.contains(btn)) return;
    const region = btn.closest('[data-cruise-region]');
    if (!region) return;

    const willOpen = !region.classList.contains('is-open');
    regions.forEach((item) => setOpen(item, willOpen && item === region));
  });
}

/**
 * Аккордеон направлений круизов.
 * Первое (или data-open) открыто; клик переключает, одновременно одно.
 * Hash `#region-id` открывает нужный регион (поиск / прямые ссылки).
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

  function openFromHash() {
    const id = (location.hash || '').replace(/^#/, '');
    if (!id) return false;
    const target = regions.find((item) => item.id === id);
    if (!target) return false;
    regions.forEach((item) => setOpen(item, item === target));
    return true;
  }

  accordion.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-cruise-toggle]');
    if (!btn || !accordion.contains(btn)) return;
    const region = btn.closest('[data-cruise-region]');
    if (!region) return;

    const willOpen = !region.classList.contains('is-open');
    regions.forEach((item) => setOpen(item, willOpen && item === region));
  });

  window.addEventListener('hashchange', () => {
    openFromHash();
  });

  openFromHash();
}

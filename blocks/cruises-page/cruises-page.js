/**
 * Круизы: аккордеон направлений + reveal.
 */
export function initCruisesPage(root) {
  if (!root || root.dataset.ready === 'true') return;
  root.dataset.ready = 'true';

  const accordion = root.querySelector('[data-cruises-accordion]');
  const regions = accordion
    ? [...accordion.querySelectorAll('[data-cruise-region]')]
    : [];

  function setOpen(target, open) {
    const btn = target.querySelector('[data-cruise-toggle]');
    const panel = target.querySelector('[data-cruise-panel]');
    target.classList.toggle('is-open', open);
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (panel) {
      if (open) panel.removeAttribute('hidden');
      else panel.setAttribute('hidden', '');
    }
    if (open) {
      const media = target.querySelector('video[data-cruise-region-video]');
      if (media) media.play().catch(() => {});
    }
  }

  function openFromHash() {
    const id = (location.hash || '').replace(/^#/, '');
    if (!id || id === 'cruises-catalog') return false;
    const target = regions.find((item) => item.id === id);
    if (!target) return false;
    regions.forEach((item) => setOpen(item, item === target));
    return true;
  }

  if (accordion) {
    accordion.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-cruise-toggle]');
      if (!btn || !accordion.contains(btn)) return;
      const region = btn.closest('[data-cruise-region]');
      if (!region) return;
      const willOpen = !region.classList.contains('is-open');
      regions.forEach((item) => setOpen(item, willOpen && item === region));
    });
  }

  window.addEventListener('hashchange', () => {
    openFromHash();
  });

  openFromHash();

  const revealNodes = [...root.querySelectorAll('[data-cruise-reveal]')];
  if (revealNodes.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-inview');
          io.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
    revealNodes.forEach((node) => io.observe(node));
  } else {
    revealNodes.forEach((node) => node.classList.add('is-inview'));
  }
}

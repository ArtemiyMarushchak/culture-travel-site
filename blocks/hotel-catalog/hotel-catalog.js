export function initHotelCatalog(root) {
  const filters = root.querySelectorAll('.hotel-catalog__filter');
  const cards = root.querySelectorAll('.hotel-card');

  filters.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      filters.forEach((b) => b.classList.toggle('is-active', b === btn));

      cards.forEach((card) => {
        if (filter === 'all') {
          card.hidden = false;
          return;
        }
        const themes = (card.dataset.themes || '').split(',');
        card.hidden = !themes.includes(filter);
      });
    });
  });

  root.querySelectorAll('[data-hotel-gallery]').forEach((btn) => {
    btn.addEventListener('click', () => {
      try {
        const media = JSON.parse(btn.dataset.media || '[]');
        window.openHotelGallery?.({ name: btn.dataset.name, media });
      } catch {
        console.error('Invalid hotel media JSON');
      }
    });
  });
}

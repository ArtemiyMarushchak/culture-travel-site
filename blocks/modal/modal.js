export function initModal(root) {
  const dialog = root.querySelector('.modal:not([data-modal-type])');
  const galleryDialog = root.querySelector('[data-modal-type="gallery"]');
  if (!dialog) return;

  root.removeAttribute('hidden');

  const titleEl = dialog.querySelector('.modal__title');
  const bodyEl = dialog.querySelector('.modal__body');

  function openModal(id) {
    const tpl = document.getElementById(`modal-${id}`);
    if (!tpl) return;

    titleEl.textContent = id === 'company' ? 'Реквизиты компании' : 'Авторские права';
    bodyEl.innerHTML = '';
    bodyEl.appendChild(tpl.content.cloneNode(true));
    dialog.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeModal(el = dialog) {
    el.hidden = true;
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-modal-open]').forEach((btn) => {
    btn.addEventListener('click', () => openModal(btn.dataset.modalOpen));
  });

  root.querySelectorAll('[data-modal-close]').forEach((el) => {
    el.addEventListener('click', () => {
      closeModal(dialog);
      closeModal(galleryDialog);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal(dialog);
      closeModal(galleryDialog);
    }
  });

  // Hotel gallery modal
  window.openHotelGallery = (data) => {
    if (!galleryDialog) return;
    const title = galleryDialog.querySelector('#gallery-title');
    const gallery = galleryDialog.querySelector('.modal__gallery');
    title.textContent = data.name || 'Галерея';
    gallery.innerHTML = '';

    (data.media || []).forEach((item) => {
      if (item.type === 'video') {
        const video = document.createElement('video');
        video.controls = true;
        video.src = item.src;
        gallery.appendChild(video);
      } else {
        const img = document.createElement('img');
        img.src = item.src;
        img.alt = item.alt || data.name || '';
        img.loading = 'lazy';
        gallery.appendChild(img);
      }
    });

    galleryDialog.hidden = false;
    document.body.style.overflow = 'hidden';
  };
}

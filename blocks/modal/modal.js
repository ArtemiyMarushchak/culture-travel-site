function buildVCard({ name, org, title, phone, email, url }) {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${name || ''}`,
    org ? `ORG:${org}` : '',
    title ? `TITLE:${title}` : '',
    phone ? `TEL;TYPE=CELL:${phone}` : '',
    email ? `EMAIL;TYPE=INTERNET:${email}` : '',
    url ? `URL:${url}` : '',
    'END:VCARD',
  ].filter(Boolean);
  return `${lines.join('\r\n')}\r\n`;
}

function downloadVCard(btn) {
  if (!btn) return;
  const card = buildVCard({
    name: btn.dataset.name,
    org: btn.dataset.org,
    title: btn.dataset.title,
    phone: btn.dataset.phone,
    email: btn.dataset.email,
    url: btn.dataset.url,
  });
  const blob = new Blob([card], { type: 'text/vcard;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = 'anna-baglay.vcf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

export function initModal(root) {
  const dialog = root.querySelector('.modal:not([data-modal-type])');
  const galleryDialog = root.querySelector('[data-modal-type="gallery"]');
  const aboutDrawer = root.querySelector('[data-modal-type="about-drawer"]');
  if (!dialog) return;

  root.removeAttribute('hidden');

  const titleEl = dialog.querySelector('.modal__title');
  const bodyEl = dialog.querySelector('.modal__body');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function anyOpen() {
    return [dialog, galleryDialog, aboutDrawer].some((el) => el && !el.hidden);
  }

  function lockScroll(on) {
    document.body.style.overflow = on ? 'hidden' : '';
  }

  function openModal(id) {
    const tpl = document.getElementById(`modal-${id}`);
    if (!tpl) return;

    titleEl.textContent = id === 'company' ? 'Реквизиты компании' : 'Авторские права';
    bodyEl.innerHTML = '';
    bodyEl.appendChild(tpl.content.cloneNode(true));
    dialog.hidden = false;
    lockScroll(true);
  }

  function openAboutDrawer() {
    if (!aboutDrawer) return;
    closeModal(dialog);
    closeModal(galleryDialog);
    aboutDrawer.hidden = false;
    lockScroll(true);
    aboutDrawer.querySelector('.about-drawer__close')?.focus({ preventScroll: true });
  }

  function closeModal(el = dialog) {
    if (!el) return;
    el.hidden = true;
    if (!anyOpen()) lockScroll(false);
  }

  function closeAll() {
    closeModal(dialog);
    closeModal(galleryDialog);
    closeModal(aboutDrawer);
  }

  window.openAboutDrawer = openAboutDrawer;

  document.querySelectorAll('[data-modal-open]').forEach((btn) => {
    btn.addEventListener('click', () => openModal(btn.dataset.modalOpen));
  });

  root.querySelectorAll('[data-modal-close]').forEach((el) => {
    el.addEventListener('click', () => closeAll());
  });

  root.querySelector('[data-save-contact]')?.addEventListener('click', (e) => {
    downloadVCard(e.currentTarget);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });

  // Open about drawer from hash on load (optional deep-link)
  window.addEventListener('load', () => {
    if (window.location.hash.replace('#', '') !== 'about') return;
    window.setTimeout(
      () => openAboutDrawer(),
      reducedMotion.matches ? 0 : 180,
    );
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
    lockScroll(true);
  };
}

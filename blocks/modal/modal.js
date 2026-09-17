import { syncSafariChrome } from '../../core/prefs.js';

function normalizePhone(phone = '') {
  const raw = String(phone).trim();
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (raw.startsWith('+')) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith('7')) return `+${digits}`;
  if (digits.length === 10) return `+7${digits}`;
  return digits;
}

function buildVCard({ name, org, phone, email, url, telegram }) {
  const tel = normalizePhone(phone);
  const siteUrl = String(url || 'https://culture-travel.ru').trim().replace(/\/$/, '');
  const tg = String(telegram || '').trim();
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'N:Баглай;Анна;;;',
    `FN:${name || 'Анна Баглай'}`,
    org ? `ORG:${org}` : 'ORG:Культура Путешествий',
    tel ? `TEL;TYPE=CELL:${tel}` : '',
    email ? `EMAIL;TYPE=INTERNET:${email}` : '',
    // Один URL сайта без TYPE=WORK — иначе iOS дублирует в «рабочий»
    siteUrl ? `URL:${siteUrl}` : '',
    // Telegram только как подписанная ссылка (без IMPP / X-SOCIALPROFILE — иначе пустые дубли)
    tg ? `item1.URL:${tg}` : '',
    tg ? 'item1.X-ABLabel:Telegram' : '',
    'END:VCARD',
  ].filter(Boolean);
  return `${lines.join('\r\n')}\r\n`;
}

function downloadVCard(btn) {
  if (!btn) return;
  const card = buildVCard({
    name: btn.dataset.name,
    org: btn.dataset.org,
    phone: btn.dataset.phone,
    email: btn.dataset.email,
    url: btn.dataset.url,
    telegram: btn.dataset.telegram,
  });
  const blob = new Blob([card], { type: 'text/vcard;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = 'Anna_Baglay.vcf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

function getFocusable(container) {
  if (!container) return [];
  return [...container.querySelectorAll(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
  )].filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
}

export function initModal(root) {
  const dialog = root.querySelector('.modal:not([data-modal-type])');
  const galleryDialog = root.querySelector('[data-modal-type="gallery"]');
  const aboutDrawer = root.querySelector('[data-modal-type="about-drawer"]');
  const serviceDialog = root.querySelector('[data-modal-type="service"]');
  if (!dialog && !aboutDrawer) return;

  root.removeAttribute('hidden');

  const titleEl = dialog?.querySelector('.modal__title');
  const bodyEl = dialog?.querySelector('.modal__body');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let lastFocus = null;
  let closing = false;

  const layered = [dialog, galleryDialog, aboutDrawer, serviceDialog];

  function anyOpen() {
    return layered.some((el) => el && !el.hidden);
  }

  function lockScroll(on) {
    document.documentElement.classList.toggle('is-modal-open', on);
    document.body.classList.toggle('is-modal-open', on);
    document.documentElement.style.overflow = on ? 'hidden' : '';
    document.body.style.overflow = on ? 'hidden' : '';
    syncSafariChrome();
  }

  function openModal(id) {
    if (!dialog || !titleEl || !bodyEl) return;
    const tpl = document.getElementById(`modal-${id}`);
    if (!tpl) return;

    lastFocus = document.activeElement;
    titleEl.textContent = id === 'company' ? 'Реквизиты компании' : 'Авторские права';
    bodyEl.innerHTML = '';
    bodyEl.appendChild(tpl.content.cloneNode(true));
    dialog.hidden = false;
    lockScroll(true);
    dialog.querySelector('.modal__close')?.focus({ preventScroll: true });
  }

  function openAboutDrawer() {
    if (!aboutDrawer || closing) return;
    closeModal(dialog, true);
    closeModal(galleryDialog, true);
    closeModal(serviceDialog, true);
    lastFocus = document.activeElement;
    aboutDrawer.classList.remove('is-closing');
    aboutDrawer.hidden = false;
    lockScroll(true);
    aboutDrawer.querySelector('.sheet-close')?.focus({ preventScroll: true });
  }

  function openServiceModal(data = {}) {
    if (!serviceDialog) return;
    closeModal(dialog, true);
    closeModal(galleryDialog, true);
    closeModal(aboutDrawer, true);

    lastFocus = document.activeElement;
    const img = serviceDialog.querySelector('[data-service-modal-image]');
    const indexEl = serviceDialog.querySelector('[data-service-modal-index]');
    const title = serviceDialog.querySelector('[data-service-modal-title]');
    const text = serviceDialog.querySelector('[data-service-modal-text]');

    if (img) {
      img.src = data.image || '';
      img.alt = data.title || '';
    }
    if (indexEl) indexEl.textContent = data.index || '';
    if (title) title.textContent = data.title || '';
    if (text) text.textContent = data.text || '';

    serviceDialog.hidden = false;
    lockScroll(true);
    serviceDialog.querySelector('.sheet-close')?.focus({ preventScroll: true });
  }

  function finishClose(el) {
    if (!el) return;
    el.classList.remove('is-closing');
    el.hidden = true;
    if (!anyOpen()) {
      lockScroll(false);
      if (lastFocus && typeof lastFocus.focus === 'function') {
        lastFocus.focus({ preventScroll: true });
      }
      lastFocus = null;
    }
  }

  function closeModal(el, immediate = false) {
    if (!el || el.hidden) return;

    if (immediate || reducedMotion.matches || el !== aboutDrawer) {
      el.classList.remove('is-closing');
      finishClose(el);
      closing = false;
      return;
    }

    if (el.classList.contains('is-closing')) return;
    closing = true;
    el.classList.add('is-closing');

    const panel = el.querySelector('.about-sheet');
    let done = false;
    const onEnd = () => {
      if (done) return;
      done = true;
      panel?.removeEventListener('animationend', onEnd);
      closing = false;
      finishClose(el);
    };

    if (panel) {
      panel.addEventListener('animationend', onEnd);
      window.setTimeout(onEnd, 400);
    } else {
      onEnd();
    }
  }

  function closeAll() {
    const aboutWasOpen = aboutDrawer && !aboutDrawer.hidden;
    closeModal(dialog, true);
    closeModal(galleryDialog, true);
    closeModal(serviceDialog, true);
    closeModal(aboutDrawer);

    if (aboutWasOpen && window.location.hash.replace('#', '') === 'about') {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  window.openAboutDrawer = openAboutDrawer;
  window.openServiceModal = openServiceModal;

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
    if (e.key === 'Escape' && anyOpen()) {
      e.preventDefault();
      closeAll();
      return;
    }

    const trapRoot = [aboutDrawer, serviceDialog].find((el) => el && !el.hidden);
    if (e.key !== 'Tab' || !trapRoot) return;

    const focusable = getFocusable(trapRoot);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  function maybeOpenAboutFromHash() {
    if (window.location.hash.replace('#', '') !== 'about') return;
    window.setTimeout(
      () => openAboutDrawer(),
      reducedMotion.matches ? 0 : 180,
    );
  }

  if (document.readyState === 'complete') maybeOpenAboutFromHash();
  else window.addEventListener('load', maybeOpenAboutFromHash);

  window.openHotelGallery = (data) => {
    if (!galleryDialog) return;
    lastFocus = document.activeElement;
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

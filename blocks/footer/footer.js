/**
 * Карточка разработчика в подвале.
 * Живёт на document.body: у #lux-footer overflow-x: clip, внутри подвала её обрежет.
 */

const COPY = {
  ru: {
    name: 'Марущак Артемий Игоревич',
    role: 'Веб-разработчик',
    note: 'Если ты из России — сайт открывай через VPN.',
    close: 'Закрыть',
    phone: 'Телефон',
    mail: 'Почта',
    site: 'Сайт',
  },
  en: {
    name: 'Marushchak Artemiy Igorevich',
    role: 'Web developer',
    note: 'If you are in Russia, open the site through a VPN.',
    close: 'Close',
    phone: 'Phone',
    mail: 'Email',
    site: 'Website',
  },
};

function icon(paths) {
  return `<span class="ct-credit__ico" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true">${paths}</svg></span>`;
}

export function initFooter(root) {
  if (!root || root.dataset.creditReady === 'true') return;
  const btn = root.querySelector('[data-ct-credit]');
  if (!btn) return;
  root.dataset.creditReady = 'true';

  const card = document.createElement('div');
  card.className = 'ct-credit';
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-label', 'Марущак Артемий Игоревич');
  card.hidden = true;
  const bp = (document.documentElement.dataset.basePath || '').replace(/\/$/, '');
  card.innerHTML = `
    <button type="button" class="ct-credit__x" data-ct-credit-close aria-label="Закрыть">×</button>
    <div class="ct-credit__head">
      <img src="${bp}/assets/images/developer/artemiy-face.jpg" alt="" width="72" height="72" data-ct-photo>
      <div><b data-ct-name>Марущак Артемий Игоревич</b><span class="ct-credit__role" data-ct-role>Веб-разработчик</span></div>
    </div>
    <div class="ct-credit__actions">
      <a href="https://t.me/ArtemiyMarushchak" target="_blank" rel="noopener noreferrer">${icon('<path d="M15 10.5 11 14.5l6 5.5 4-16-18 7 4 2 2 6 3-4"/>')}<span><b>Telegram</b><small>@ArtemiyMarushchak</small></span></a>
      <a href="tel:+79800893606">${icon('<rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M10.5 18h3"/>')}<span><b data-ct-label="phone">Телефон</b><small>+7 980 089-36-06</small></span></a>
      <a href="mailto:artemiymarushchak@icloud.com">${icon('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>')}<span><b data-ct-label="mail">Почта</b><small>artemiymarushchak@icloud.com</small></span></a>
      <a class="ct-credit__site" href="https://artemiy.dev/" target="_blank" rel="noopener noreferrer">${icon('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 13h6M7 16h10"/><path d="M6.5 6.5h.01M9 6.5h.01"/>')}<span><b data-ct-label="site">Сайт</b><small>artemiy.dev</small></span></a>
    </div>
    <p class="ct-credit__note" data-ct-note>Если ты из России — сайт открывай через VPN.</p>
  `;
  document.body.appendChild(card);

  const roleEl = card.querySelector('[data-ct-role]');
  const nameEl = card.querySelector('[data-ct-name]');
  const photoEl = card.querySelector('[data-ct-photo]');
  const noteEl = card.querySelector('[data-ct-note]');
  const closeBtn = card.querySelector('[data-ct-credit-close]');

  function lang() {
    return document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'ru';
  }

  function syncCopy() {
    const copy = COPY[lang()];
    nameEl.textContent = copy.name;
    photoEl.alt = copy.name;
    card.setAttribute('aria-label', copy.name);
    roleEl.textContent = copy.role;
    noteEl.textContent = copy.note;
    closeBtn.setAttribute('aria-label', copy.close);
    card.querySelectorAll('[data-ct-label]').forEach((el) => {
      el.textContent = copy[el.getAttribute('data-ct-label')];
    });
  }

  function place() {
    const shell = root.querySelector('.lf__shell');
    const anchor = root.querySelector('[data-ct-credit-anchor]') || btn;
    const sr = shell.getBoundingClientRect();
    const cs = getComputedStyle(shell);
    const contentLeft = sr.left + (parseFloat(cs.paddingLeft) || 0);
    const contentRight = sr.right - (parseFloat(cs.paddingRight) || 0);
    const ar = anchor.getBoundingClientRect();
    const left = ar.left;
    const room = Math.min(contentRight, window.innerWidth) - left;
    const width = Math.min(400, Math.max(0, room));
    card.style.width = `${width}px`;
    const height = card.offsetHeight;
    let top = ar.top - height - 10;
    if (top < 12) top = Math.min(ar.bottom + 10, window.innerHeight - height - 12);
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
    card.dataset.boundLeft = String(contentLeft);
    card.dataset.boundRight = String(contentRight);
  }

  let openTimer = 0;
  let closeTimer = 0;
  let pinned = false;

  function show() {
    card.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    syncCopy();
    place();
  }

  function hide() {
    pinned = false;
    card.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  }

  btn.addEventListener('mouseenter', () => {
    clearTimeout(closeTimer);
    openTimer = setTimeout(show, 160);
  });
  btn.addEventListener('mouseleave', () => {
    clearTimeout(openTimer);
    if (pinned) return;
    closeTimer = setTimeout(hide, 220);
  });
  card.addEventListener('mouseenter', () => clearTimeout(closeTimer));
  card.addEventListener('mouseleave', () => {
    if (pinned) return;
    closeTimer = setTimeout(hide, 220);
  });
  btn.addEventListener('click', (event) => {
    event.preventDefault();
    if (!card.hidden && pinned) hide();
    else {
      pinned = true;
      show();
    }
  });
  closeBtn.addEventListener('click', hide);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') hide();
  });
  document.addEventListener('click', (event) => {
    if (card.hidden) return;
    if (event.target === btn || btn.contains(event.target) || card.contains(event.target)) return;
    hide();
  });
  window.addEventListener('resize', () => {
    if (!card.hidden) place();
  });
  window.addEventListener('scroll', () => {
    if (!card.hidden) place();
  }, true);

  new MutationObserver(syncCopy).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-lang'],
  });
  syncCopy();
}

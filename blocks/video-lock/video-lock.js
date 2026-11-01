/**
 * Закрытая страница видео. Код плееров с Тильды /video.
 * Ролики попадают в страницу только после пароля.
 */
import { getLang } from '../../core/i18n.js';

const PASS_HASH = '10fff5c657eee9c8517cf13093c785b26725c7ebc4fad089c8fd6dae541877fb';
const SESSION_KEY = 'ct-video-gate';

const VIDEOS = [
  { group: 'seychelles', src: 'https://vk.com/video_ext.php?oid=-211094991&id=456241371&hash=67138c15cda5b181' },
  { group: 'seychelles', src: 'https://vkvideo.ru/video_ext.php?oid=-211094991&id=456241373&hash=6b4b558f561c3a9e' },
  { group: 'seychelles', src: 'https://vkvideo.ru/video_ext.php?oid=-211094991&id=456241375&hash=050590b42fad6fbc' },
  { group: 'seychelles', src: 'https://vkvideo.ru/video_ext.php?oid=-211094991&id=456241381&hash=aef3de4da991cced' },
  { group: 'seychelles', src: 'https://vkvideo.ru/video_ext.php?oid=-211094991&id=456241390&hash=f687aab520028623' },
  { group: 'seychelles', src: 'https://vkvideo.ru/video_ext.php?oid=-211094991&id=456241395&hash=22418d466e423050' },
  { group: 'seychelles', src: 'https://vkvideo.ru/video_ext.php?oid=-211094991&id=456241397&hash=52b436dbfb3cb7a8' },
  { group: 'seychelles', src: 'https://vkvideo.ru/video_ext.php?oid=-211094991&id=456241398&hash=904d69ce960eb8b5' },
  { group: 'seychelles', src: 'https://vkvideo.ru/video_ext.php?oid=-211094991&id=456241403&hash=8d8fb26da39c8ad7' },
  { group: 'seychelles', src: 'https://vkvideo.ru/video_ext.php?oid=-211094991&id=456241406&hash=8ad87536ac313eef' },
  { group: 'seychelles', src: 'https://vkvideo.ru/video_ext.php?oid=-211094991&id=456241407&hash=0dd935e23aa9acbf' },
];

async function digest(value) {
  const bytes = new TextEncoder().encode(value);
  const buf = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(buf)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function titleFor(index) {
  const n = String(index + 1);
  return {
    ru: `Видео ${n}`,
    en: `Video ${n}`,
    current: getLang() === 'en' ? `Video ${n}` : `Видео ${n}`,
  };
}

function renderVideos(grid) {
  if (grid.childElementCount) return;
  VIDEOS.forEach((item, index) => {
    const names = titleFor(index);
    const article = document.createElement('article');
    article.className = 'video-lock__item';
    article.dataset.videoCard = '';
    article.dataset.group = item.group;
    const frame = document.createElement('div');
    frame.className = 'video-lock__frame';
    const iframe = document.createElement('iframe');
    iframe.src = item.src;
    iframe.title = names.current;
    iframe.allowFullscreen = true;
    iframe.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    frame.append(iframe);
    const heading = document.createElement('h2');
    heading.className = 'video-lock__title';
    heading.setAttribute('data-i18n-src', '');
    heading.dataset.ru = names.ru;
    heading.dataset.en = names.en;
    heading.textContent = names.current;
    article.append(frame, heading);
    grid.append(article);
  });
}

function applyFilter(root) {
  const checked = new Set(
    [...root.querySelectorAll('[data-video-group]:checked')].map((input) => input.getAttribute('data-video-group')),
  );
  const cards = [...root.querySelectorAll('[data-video-card]')];
  let shown = 0;
  cards.forEach((card) => {
    const on = checked.has(card.dataset.group);
    card.hidden = !on;
    if (on) shown += 1;
  });
  const empty = root.querySelector('[data-video-empty]');
  if (empty) empty.hidden = shown > 0;
}

export function initVideoLock(root) {
  if (!root || root.dataset.ready === 'true') return;
  root.dataset.ready = 'true';

  const form = root.querySelector('[data-video-gate]');
  const input = root.querySelector('#video-lock-password');
  const error = root.querySelector('[data-video-error]');
  const stage = root.querySelector('[data-video-stage]');
  const grid = root.querySelector('[data-video-grid]');
  if (!form || !input || !stage || !grid) return;

  function open() {
    root.classList.add('is-open');
    if (error) error.hidden = true;
    stage.hidden = false;
    renderVideos(grid);
    applyFilter(root);
  }

  root.querySelectorAll('[data-video-group]').forEach((box) => {
    box.addEventListener('change', () => applyFilter(root));
  });

  if (sessionStorage.getItem(SESSION_KEY) === PASS_HASH) open();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const hash = await digest(input.value);
    if (hash !== PASS_HASH) {
      if (error) error.hidden = false;
      input.select();
      return;
    }
    sessionStorage.setItem(SESSION_KEY, PASS_HASH);
    open();
  });
}

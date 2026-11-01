/**
 * Закрытая страница видео. Код плееров с Тильды /video.
 * Ролики попадают в страницу только после пароля.
 */
const PASS_HASH = '10fff5c657eee9c8517cf13093c785b26725c7ebc4fad089c8fd6dae541877fb';
const SESSION_KEY = 'ct-video-gate';

const VIDEOS = [
  { title: "Название видео 1", src: "https://vk.com/video_ext.php?oid=-211094991&id=456241371&hash=67138c15cda5b181" },
  { title: "Название видео 2", src: "https://vkvideo.ru/video_ext.php?oid=-211094991&id=456241373&hash=6b4b558f561c3a9e" },
  { title: "Название видео 3", src: "https://vkvideo.ru/video_ext.php?oid=-211094991&id=456241375&hash=050590b42fad6fbc" },
  { title: "Название видео 4", src: "https://vkvideo.ru/video_ext.php?oid=-211094991&id=456241381&hash=aef3de4da991cced" },
  { title: "Название видео 5", src: "https://vkvideo.ru/video_ext.php?oid=-211094991&id=456241390&hash=f687aab520028623" },
  { title: "Название видео 6", src: "https://vkvideo.ru/video_ext.php?oid=-211094991&id=456241395&hash=22418d466e423050" },
  { title: "Название видео 7", src: "https://vkvideo.ru/video_ext.php?oid=-211094991&id=456241397&hash=52b436dbfb3cb7a8" },
  { title: "Название видео 8", src: "https://vkvideo.ru/video_ext.php?oid=-211094991&id=456241398&hash=904d69ce960eb8b5" },
  { title: "Название видео 9", src: "https://vkvideo.ru/video_ext.php?oid=-211094991&id=456241403&hash=8d8fb26da39c8ad7" },
  { title: "Название видео 10", src: "https://vkvideo.ru/video_ext.php?oid=-211094991&id=456241406&hash=8ad87536ac313eef" },
  { title: "Название видео 11", src: "https://vkvideo.ru/video_ext.php?oid=-211094991&id=456241407&hash=0dd935e23aa9acbf" },
];

async function digest(value) {
  const bytes = new TextEncoder().encode(value);
  const buf = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(buf)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function renderVideos(stage) {
  const grid = document.createElement('div');
  grid.className = 'video-lock__grid';
  for (const item of VIDEOS) {
    const article = document.createElement('article');
    article.className = 'video-lock__item';
    const frame = document.createElement('div');
    frame.className = 'video-lock__frame';
    const iframe = document.createElement('iframe');
    iframe.src = item.src;
    iframe.title = item.title;
    iframe.allowFullscreen = true;
    iframe.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    frame.append(iframe);
    const heading = document.createElement('h2');
    heading.className = 'video-lock__title';
    heading.textContent = item.title;
    article.append(frame, heading);
    grid.append(article);
  }
  stage.replaceChildren(grid);
  stage.hidden = false;
}

export function initVideoLock(root) {
  if (!root || root.dataset.ready === 'true') return;
  root.dataset.ready = 'true';

  const form = root.querySelector('[data-video-gate]');
  const input = root.querySelector('input');
  const error = root.querySelector('[data-video-error]');
  const stage = root.querySelector('[data-video-stage]');
  if (!form || !input || !stage) return;

  function open() {
    root.classList.add('is-open');
    error.hidden = true;
    renderVideos(stage);
  }

  if (sessionStorage.getItem(SESSION_KEY) === PASS_HASH) open();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const hash = await digest(input.value);
    if (hash !== PASS_HASH) {
      error.hidden = false;
      input.select();
      return;
    }
    sessionStorage.setItem(SESSION_KEY, PASS_HASH);
    open();
  });
}

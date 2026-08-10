export function initVideoOverlay() {
  const first = document.querySelector('.uc-video');
  const second = document.querySelector('.uc-about');

  if (!first || !second) return;
  if (first.parentElement?.classList.contains('video-overlay-stage')) return;

  const stage = document.createElement('div');
  stage.className = 'video-overlay-stage';

  const placeholder = document.createElement('div');
  placeholder.className = 'video-overlay-placeholder';

  first.parentNode.insertBefore(stage, first);
  stage.appendChild(first);
  stage.appendChild(placeholder);
  stage.appendChild(second);

  function getHeight(el) {
    const h = el.offsetHeight;
    return !h || h < 200 ? window.innerHeight : h;
  }

  function syncStage() {
    const firstH = getHeight(first);
    const secondH = getHeight(second);
    placeholder.style.height = `${firstH}px`;
    stage.style.height = `${firstH + secondH}px`;
  }

  function update() {
    syncStage();

    const firstH = getHeight(first);
    const rect = stage.getBoundingClientRect();
    const start = rect.top;
    const end = rect.bottom - firstH;

    first.classList.remove('is-video-fixed', 'is-video-absolute');

    if (start <= 0 && end > 0) {
      first.classList.add('is-video-fixed');
    }

    if (end <= 0) {
      first.classList.add('is-video-absolute');
    }

    document.dispatchEvent(new CustomEvent('page:layout'));
  }

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  setTimeout(update, 300);
  setTimeout(update, 900);
  setTimeout(update, 1600);
}

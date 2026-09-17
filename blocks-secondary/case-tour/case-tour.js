const TARGET_ROW_HEIGHT = 280;
const MOBILE_MQ = '(max-width: 640px)';

const LB_I18N = {
  ru: {
    gallery: 'Галерея',
    close: 'Закрыть',
    prev: 'Предыдущее фото',
    next: 'Следующее фото',
  },
  en: {
    gallery: 'Gallery',
    close: 'Close',
    prev: 'Previous photo',
    next: 'Next photo',
  },
};

function currentLang() {
  return document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'ru';
}

function readGalleryGap(gallery) {
  const raw = getComputedStyle(gallery).getPropertyValue('--tour-gallery-gap').trim();
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n >= 0 ? n : 20;
}

function isHiddenPanel(el) {
  const panel = el.closest('[data-lang-panel]');
  return Boolean(panel && getComputedStyle(panel).display === 'none');
}

export function initCaseTour(root) {
  const scope = root && root.querySelectorAll ? root : document;
  const galleries = scope.querySelectorAll('[data-tour-gallery]');
  if (!galleries.length) return;

  const lb = createLightbox();
  document.body.appendChild(lb.root);

  const controllers = [];

  galleries.forEach(function (gallery) {
    const shots = Array.from(gallery.querySelectorAll('.tour-day__shot'));
    if (!shots.length) return;

    gallery.setAttribute('data-count', String(shots.length));

    shots.forEach(function (shot, index) {
      shot.addEventListener('click', function () {
        openLightbox(lb, shots, index);
      });
    });

    controllers.push(createGalleryController(gallery, shots));
  });

  function relayoutVisible() {
    lb.syncLabels();
    controllers.forEach(function (c) {
      c.layout();
    });
  }

  let resizeTimer = 0;
  window.addEventListener(
    'resize',
    function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(relayoutVisible, 120);
    },
    { passive: true }
  );

  document.addEventListener('ct:prefs', function () {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(relayoutVisible);
    });
  });
}

function createGalleryController(gallery, shots) {
  let layoutTimer = 0;
  wrapGalleryTrack(gallery, shots);

  function readRatio(shot) {
    const img = shot.querySelector('img');
    if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
      return img.naturalWidth / img.naturalHeight;
    }
    const stored = Number(shot.dataset.ratio);
    return stored > 0.2 && Number.isFinite(stored) ? stored : 4 / 3;
  }

  function clearInline() {
    gallery.classList.remove('is-justified');
    gallery.style.height = '';
    shots.forEach(function (shot) {
      shot.style.left = '';
      shot.style.top = '';
      shot.style.width = '';
      shot.style.height = '';
    });
  }

  function layoutJustified() {
    const width = gallery.clientWidth;
    if (!width) return;

    const gap = readGalleryGap(gallery);
    gallery.classList.add('is-justified');

    const ratios = shots.map(readRatio);
    let index = 0;
    let top = 0;

    while (index < shots.length) {
      const row = [];
      let ratioSum = 0;

      while (index < shots.length) {
        row.push(index);
        ratioSum += ratios[index];
        index += 1;

        const gaps = gap * (row.length - 1);
        const rowHeight = (width - gaps) / ratioSum;
        if (rowHeight <= TARGET_ROW_HEIGHT) break;
      }

      const gaps = gap * (row.length - 1);
      let rowHeight =
        (width - gaps) /
        row.reduce(function (sum, i) {
          return sum + ratios[i];
        }, 0);

      const isLast = index >= shots.length;
      if (isLast && row.length === 1 && rowHeight > TARGET_ROW_HEIGHT * 1.35) {
        rowHeight = TARGET_ROW_HEIGHT * 1.2;
      }

      let left = 0;
      row.forEach(function (shotIndex, i) {
        const shot = shots[shotIndex];
        const w = ratios[shotIndex] * rowHeight;
        shot.style.left = left + 'px';
        shot.style.top = top + 'px';
        shot.style.width = w + 'px';
        shot.style.height = rowHeight + 'px';
        left += w + (i < row.length - 1 ? gap : 0);
      });

      top += rowHeight + (index < shots.length ? gap : 0);
    }

    gallery.style.height = top + 'px';
  }

  function layout() {
    if (isHiddenPanel(gallery)) return;
    if (window.matchMedia(MOBILE_MQ).matches) {
      clearInline();
      return;
    }
    layoutJustified();
  }

  function scheduleLayout() {
    window.clearTimeout(layoutTimer);
    layoutTimer = window.setTimeout(layout, 16);
  }

  shots.forEach(function (shot) {
    const img = shot.querySelector('img');
    if (!img) return;

    // Оставить HTML lazy loading; только async decode. Eager грузил обе lang-панели.
    img.decoding = 'async';

    const onReady = function () {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        shot.dataset.ratio = String(img.naturalWidth / img.naturalHeight);
      }
      scheduleLayout();
    };

    if (img.complete && img.naturalWidth > 0) onReady();
    else {
      img.addEventListener('load', onReady);
      img.addEventListener('error', scheduleLayout);
    }
  });

  scheduleLayout();

  return { layout: layout };
}

function wrapGalleryTrack(gallery, shots) {
  let track = gallery.querySelector('.tour-day__gallery-track');
  if (track) return track;

  track = document.createElement('div');
  track.className = 'tour-day__gallery-track';
  shots.forEach(function (shot) {
    track.appendChild(shot);
  });
  gallery.insertBefore(track, gallery.firstChild);
  return track;
}

function createLightbox() {
  const root = document.createElement('div');
  root.className = 'tour-lb';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.hidden = true;

  root.innerHTML =
    '<button type="button" class="tour-lb__close">' +
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
    '</button>' +
    '<div class="tour-lb__figure"><img class="tour-lb__img" alt=""></div>' +
    '<div class="tour-lb__nav">' +
    '<button type="button" class="tour-lb__prev">' +
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 5 8 12l7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
    '</button>' +
    '<div class="tour-lb__count" aria-live="polite"></div>' +
    '<button type="button" class="tour-lb__next">' +
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 5 7 7-7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
    '</button>' +
    '</div>';

  const img = root.querySelector('.tour-lb__img');
  const count = root.querySelector('.tour-lb__count');
  const closeBtn = root.querySelector('.tour-lb__close');
  const prevBtn = root.querySelector('.tour-lb__prev');
  const nextBtn = root.querySelector('.tour-lb__next');

  function syncLabels() {
    const t = LB_I18N[currentLang()];
    root.setAttribute('aria-label', t.gallery);
    closeBtn.setAttribute('aria-label', t.close);
    prevBtn.setAttribute('aria-label', t.prev);
    nextBtn.setAttribute('aria-label', t.next);
  }

  syncLabels();

  const state = {
    root: root,
    img: img,
    count: count,
    shots: [],
    index: 0,
    lastFocus: null,
    syncLabels: syncLabels,
  };

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function render() {
    const shot = state.shots[state.index];
    const source = shot && shot.querySelector('img');
    if (!source) return;
    state.img.src = source.currentSrc || source.src;
    state.img.alt = source.alt || '';
    state.count.textContent = pad(state.index + 1) + ' / ' + pad(state.shots.length);
  }

  function close() {
    state.root.classList.remove('is-open');
    state.root.hidden = true;
    document.documentElement.style.removeProperty('overflow');
    document.removeEventListener('keydown', onKey);
    if (state.lastFocus && typeof state.lastFocus.focus === 'function') {
      state.lastFocus.focus();
    }
  }

  function onKey(event) {
    if (event.key === 'Escape') close();
    if (event.key === 'ArrowLeft') prev();
    if (event.key === 'ArrowRight') next();
  }

  function prev() {
    if (!state.shots.length) return;
    state.index = state.index <= 0 ? state.shots.length - 1 : state.index - 1;
    render();
  }

  function next() {
    if (!state.shots.length) return;
    state.index = state.index >= state.shots.length - 1 ? 0 : state.index + 1;
    render();
  }

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  root.addEventListener('click', function (event) {
    if (event.target === root) close();
  });

  let touchX = null;
  root.addEventListener(
    'touchstart',
    function (event) {
      touchX = event.changedTouches[0].clientX;
    },
    { passive: true }
  );
  root.addEventListener(
    'touchend',
    function (event) {
      if (touchX == null) return;
      const dx = event.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) < 40) return;
      if (dx > 0) prev();
      else next();
    },
    { passive: true }
  );

  state.open = function (shots, index) {
    syncLabels();
    state.shots = shots;
    state.index = index;
    state.lastFocus = document.activeElement;
    state.root.hidden = false;
    requestAnimationFrame(function () {
      state.root.classList.add('is-open');
    });
    document.documentElement.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    render();
    closeBtn.focus();
  };

  return state;
}

function openLightbox(lb, shots, index) {
  lb.open(shots, index);
}

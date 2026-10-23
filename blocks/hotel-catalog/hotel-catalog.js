/**
 * Каталог отелей: hero, фильтры, сетка карточек, fullscreen sheet.
 */
import { applyI18n, t } from '../../core/i18n.js';

const STAR_PATH = 'M12 2.6l2.62 5.72 6.28.78-4.64 4.36 1.24 6.22L12 16.7 6.5 19.68l1.24-6.22L3.1 9.1l6.28-.78L12 2.6z';
const STAR_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR_PATH}"/></svg>`;
const MORE_ARROW = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const PLACEHOLDER = '/assets/images/placeholder.svg';
const MOBILE_MQ = '(max-width: 900px)';

export function initHotelCatalog(root) {
  if (!root || root.dataset.ready === 'true') return;
  root.dataset.ready = 'true';

  const dataEl = root.querySelector('#hotel-catalog-data');
  let cfg = {};
  try {
    cfg = JSON.parse((dataEl?.textContent || '').trim() || '{}');
  } catch (err) {
    console.error('hotel-catalog-data parse error', err);
    return;
  }

  const categories = cfg.categories || [];
  const hotels = cfg.hotels || [];
  const countryList = Array.isArray(cfg.countries) ? cfg.countries : [];
  const bp = (document.documentElement.dataset.basePath || '').replace(/\/$/, '');
  const lang = () => (
    (document.documentElement.lang || 'ru').toLowerCase().startsWith('en') ? 'en' : 'ru'
  );

  const navHost = root.querySelector('[data-hotel-nav]');
  const countriesHost = root.querySelector('[data-hotel-countries]');
  const gridHost = root.querySelector('[data-hotel-grid]');
  const emptyEl = root.querySelector('[data-hotel-empty]');
  const searchInput = root.querySelector('[data-hotel-search]');
  const asideTop = root.querySelector('.hotel-catalog__aside-top');
  const filtersEl = root.querySelector('[data-hotel-filters]');
  const filtersPanel = filtersEl?.querySelector('.hotel-catalog__filters-panel');
  const filtersOpenBtn = root.querySelector('[data-hotel-filters-open]');
  const filtersCountEl = root.querySelector('[data-hotel-filters-count]');
  const resetBtns = root.querySelectorAll('[data-hotel-reset]');
  const sheet = root.querySelector('[data-hotel-sheet]');
  const sheetBar = root.querySelector('[data-hotel-sheet-bar]');
  const sheetTitle = root.querySelector('[data-hotel-sheet-title]');
  const sheetCountry = root.querySelector('[data-hotel-sheet-country]');
  const sheetFlag = root.querySelector('[data-hotel-sheet-flag]');
  const sheetStars = root.querySelector('[data-hotel-sheet-stars]');
  const sheetText = root.querySelector('[data-hotel-sheet-text]');
  const sheetStage = root.querySelector('[data-hotel-sheet-stage]');
  const sheetNav = root.querySelector('[data-hotel-sheet-nav]');
  const sheetCount = root.querySelector('[data-hotel-sheet-count]');
  const sheetUpdated = root.querySelector('[data-hotel-sheet-updated]');
  const sheetPrev = root.querySelector('[data-hotel-sheet-prev]');
  const sheetNext = root.querySelector('[data-hotel-sheet-next]');

  if (!navHost || !gridHost || !sheet) return;

  const selectedCategories = new Set();
  const selectedCountries = new Set();
  let query = '';
  let sheetOpen = false;
  let filtersOpen = false;
  let activeHotel = null;
  let sheetIndex = 0;
  let playerCleanups = [];

  const sheetHome = sheet.parentNode;
  const filtersHome = filtersEl?.parentNode || null;
  const filtersNext = filtersEl?.nextSibling || null;
  const mobileMq = window.matchMedia(MOBILE_MQ);

  const ICON_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="7" y="5.5" width="3" height="13" rx="1.5"/><rect x="14" y="5.5" width="3" height="13" rx="1.5"/></svg>';
  const ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M9 6.5v11l9-5.5-9-5.5z"/></svg>';
  const ICON_MUTE = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M16 9.5l5 5M21 9.5l-5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
  const ICON_SOUND = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
  const ICON_FS = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_FS_EXIT = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 9h5V4M20 9h-5V4M4 15h5v5M20 15h-5v5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const PLAYER_IDLE_MS = 5000;

  function absUrl(path) {
    const src = path || PLACEHOLDER;
    if (/^https?:\/\//i.test(src)) return src;
    return `${bp}${src.startsWith('/') ? src : `/${src}`}`;
  }

  function field(hotel, key) {
    if (lang() === 'en') {
      const en = hotel[`${key}En`];
      if (en) return en;
    }
    return hotel[key] || '';
  }

  function catTitle(cat) {
    if (lang() === 'en' && cat.titleEn) return cat.titleEn;
    return cat.title || cat.id;
  }

  function countryKey(hotel) {
    return (hotel.countryEn || hotel.country || hotel.id || '').toLowerCase();
  }

  function uniqueCountries() {
    const map = new Map();
    const source = countryList.length
      ? countryList
      : hotels.map((h) => ({ country: h.country, countryEn: h.countryEn }));
    source.forEach((item) => {
      const key = (item.countryEn || item.country || '').toLowerCase();
      if (!key || map.has(key)) return;
      map.set(key, {
        key,
        label: lang() === 'en' && item.countryEn ? item.countryEn : (item.country || item.countryEn || ''),
      });
    });
    return Array.from(map.values()).sort((a, b) => (
      a.label.localeCompare(b.label, lang() === 'en' ? 'en' : 'ru')
    ));
  }

  function fillStars(host, n) {
    if (!host) return;
    const count = Math.max(0, Math.min(5, Number(n) || 5));
    host.setAttribute('aria-label', `${count} ★`);
    host.innerHTML = STAR_SVG.repeat(count);
  }

  function cardStars(n) {
    const wrap = document.createElement('span');
    wrap.className = 'mcs__days hotel-card__stars';
    wrap.setAttribute('role', 'img');
    fillStars(wrap, n);
    return wrap;
  }

  function activeFilterCount() {
    return selectedCategories.size + selectedCountries.size;
  }

  function updateFilterChrome() {
    const idle = activeFilterCount() === 0;
    resetBtns.forEach((btn) => {
      btn.disabled = idle;
      btn.classList.toggle('is-idle', idle);
      if (btn.classList.contains('hotel-catalog__search-clear')) {
        btn.setAttribute('aria-hidden', idle ? 'true' : 'false');
        btn.tabIndex = idle ? -1 : 0;
      }
    });
    if (filtersCountEl) {
      filtersCountEl.hidden = idle;
      filtersCountEl.textContent = idle ? '' : String(activeFilterCount());
    }
    filtersOpenBtn?.setAttribute('aria-expanded', filtersOpen ? 'true' : 'false');
  }

  function clearDialogAttrs() {
    filtersPanel?.removeAttribute('role');
    filtersPanel?.removeAttribute('aria-modal');
    filtersPanel?.removeAttribute('aria-labelledby');
  }

  function syncFiltersMode() {
    if (!filtersEl || !filtersPanel) return;
    if (!mobileMq.matches) {
      if (filtersOpen) closeFilters({ keepScroll: true });
      filtersEl.classList.remove('is-open');
      filtersEl.setAttribute('aria-hidden', 'false');
      clearDialogAttrs();
      return;
    }
    if (!filtersOpen) {
      filtersEl.setAttribute('aria-hidden', 'true');
      clearDialogAttrs();
    }
  }

  function lockPageScroll(on) {
    const method = on ? 'add' : 'remove';
    document.documentElement.classList[method]('is-modal-open');
    document.body.classList[method]('is-modal-open');
    document.documentElement.style.overflow = on ? 'hidden' : '';
    document.body.style.overflow = on ? 'hidden' : '';
  }

  function filteredHotels() {
    const q = query.trim().toLowerCase();
    return hotels.filter((h) => {
      if (selectedCategories.size && !selectedCategories.has(h.category)) return false;
      if (selectedCountries.size && !selectedCountries.has(countryKey(h))) return false;
      if (!q) return true;
      const hay = [
        h.name, h.nameEn, h.country, h.countryEn,
        h.excerpt, h.excerptEn, h.description, h.descriptionEn, h.id,
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

  function makeCheck({ id, label, emoji, checked, onChange }) {
    const row = document.createElement('label');
    row.className = 'hotel-catalog__check';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = !!checked;
    input.id = id;
    input.tabIndex = -1;

    const box = document.createElement('span');
    box.className = 'hotel-catalog__box';
    box.setAttribute('aria-hidden', 'true');

    const text = document.createElement('span');
    text.className = 'hotel-catalog__check-text';
    text.textContent = emoji ? `${emoji} ${label}` : label;

    input.addEventListener('change', () => onChange(input.checked));
    row.addEventListener('mousedown', (e) => e.preventDefault());

    row.append(input, box, text);
    return row;
  }

  function onFilterChange() {
    updateFilterChrome();
    renderGrid();
  }

  function renderNav() {
    navHost.innerHTML = '';
    categories.forEach((cat) => {
      navHost.appendChild(makeCheck({
        id: `hc-cat-${cat.id}`,
        label: catTitle(cat),
        checked: selectedCategories.has(cat.id),
        onChange: (on) => {
          if (on) selectedCategories.add(cat.id);
          else selectedCategories.delete(cat.id);
          onFilterChange();
        },
      }));
    });
  }

  function renderCountries() {
    if (!countriesHost) return;
    countriesHost.innerHTML = '';
    uniqueCountries().forEach((c) => {
      countriesHost.appendChild(makeCheck({
        id: `hc-country-${c.key.replace(/\s+/g, '-')}`,
        label: c.label,
        checked: selectedCountries.has(c.key),
        onChange: (on) => {
          if (on) selectedCountries.add(c.key);
          else selectedCountries.delete(c.key);
          onFilterChange();
        },
      }));
    });
  }

  function clearFilters() {
    selectedCategories.clear();
    selectedCountries.clear();
    (filtersEl || root).querySelectorAll('.hotel-catalog__check input').forEach((input) => {
      input.checked = false;
    });
    if (asideTop) asideTop.scrollTop = 0;
    onFilterChange();
  }

  function renderGrid() {
    const scrollY = window.scrollY;
    const list = filteredHotels();
    gridHost.innerHTML = '';
    if (emptyEl) emptyEl.hidden = list.length > 0;

    list.forEach((hotel) => {
      const name = field(hotel, 'name');
      const countryName = field(hotel, 'country');

      const card = document.createElement('article');
      card.className = 'mcs__card hotel-card';

      const media = document.createElement('button');
      media.type = 'button';
      media.className = 'mcs__media';
      media.setAttribute('aria-label', name);

      const img = document.createElement('img');
      img.src = absUrl(hotel.cover || PLACEHOLDER);
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.setAttribute('aria-hidden', 'true');

      const badge = document.createElement('span');
      badge.className = 'mcs__badge';
      const flag = document.createElement('span');
      flag.className = 'mcs__flag';
      flag.setAttribute('aria-hidden', 'true');
      flag.textContent = hotel.flagEmoji || '';
      const country = document.createElement('span');
      country.textContent = countryName;
      badge.append(flag, country);
      if (!countryName) badge.hidden = true;

      media.append(img, badge, cardStars(hotel.stars ?? 5));

      const body = document.createElement('div');
      body.className = 'mcs__body';

      const title = document.createElement('h3');
      title.className = 'mcs__card-title type-card';
      title.textContent = name;

      const text = document.createElement('p');
      text.className = 'mcs__card-text type-card-text';
      text.textContent = field(hotel, 'excerpt');

      const foot = document.createElement('div');
      foot.className = 'mcs__card-foot';

      const more = document.createElement('button');
      more.type = 'button';
      more.className = 'mcs__more';
      more.innerHTML = `<span>${t('hotels.more')}</span>${MORE_ARROW}`;

      const open = () => openSheet(hotel);
      media.addEventListener('click', open);
      more.addEventListener('click', open);

      foot.appendChild(more);
      body.append(title, text, foot);
      card.append(media, body);
      gridHost.appendChild(card);
    });

    window.scrollTo(0, scrollY);
  }

  function splitMedia(list, fallbackCover, name) {
    const items = (list && list.length)
      ? list.slice()
      : [{ type: 'image', src: fallbackCover || PLACEHOLDER, alt: name }];
    const videos = [];
    const images = [];
    items.forEach((item) => {
      const isVideo = item.type === 'video' || /\.(mp4|webm)(\?|$)/i.test(item.src || '');
      (isVideo ? videos : images).push({ ...item, type: isVideo ? 'video' : 'image' });
    });
    if (!images.length && !videos.length && fallbackCover) {
      images.push({ type: 'image', src: fallbackCover, alt: name });
    }
    return { video: videos[0] || null, photos: images, videos };
  }

  function padIndex(n) {
    return String(n).padStart(2, '0');
  }

  function clearPlayerBindings() {
    while (playerCleanups.length) {
      const off = playerCleanups.pop();
      try { off(); } catch (_) { /* ignore */ }
    }
  }

  function stopHostMedia(host) {
    clearPlayerBindings();
    host?.querySelectorAll('video').forEach((v) => {
      try {
        v.pause();
        v.removeAttribute('src');
        v.load();
      } catch (_) { /* ignore */ }
    });
  }

  function bindPlayer(rootEl, vid) {
    const toggleBtn = rootEl.querySelector('[data-player-toggle]');
    const muteBtn = rootEl.querySelector('[data-player-mute]');
    const fsBtn = rootEl.querySelector('[data-player-fs]');
    const track = rootEl.querySelector('[data-player-track]');
    const fill = rootEl.querySelector('[data-player-fill]');
    const thumb = rootEl.querySelector('[data-player-thumb]');
    const timeEl = rootEl.querySelector('[data-player-time]');
    let dragging = false;
    let idleTimer = null;

    const wake = () => {
      rootEl.classList.remove('is-idle');
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (!vid.paused && !dragging) rootEl.classList.add('is-idle');
      }, PLAYER_IDLE_MS);
    };

    const sleep = () => {
      clearTimeout(idleTimer);
      if (!vid.paused && !dragging) rootEl.classList.add('is-idle');
    };

    const syncToggle = () => {
      if (!toggleBtn) return;
      const paused = vid.paused;
      rootEl.classList.toggle('is-playing', !paused);
      if (paused) rootEl.classList.remove('is-idle');
      else wake();
      toggleBtn.innerHTML = paused ? ICON_PLAY : ICON_PAUSE;
      toggleBtn.setAttribute('aria-label', paused ? 'Play' : 'Pause');
    };

    const syncMute = () => {
      if (!muteBtn) return;
      const muted = vid.muted || vid.volume === 0;
      muteBtn.innerHTML = muted ? ICON_MUTE : ICON_SOUND;
      muteBtn.classList.toggle('is-on', !muted);
      muteBtn.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
    };

    const syncFs = () => {
      if (!fsBtn) return;
      const on = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
      fsBtn.innerHTML = on ? ICON_FS_EXIT : ICON_FS;
      fsBtn.classList.toggle('is-on', on);
      fsBtn.setAttribute('aria-label', on ? 'Exit fullscreen' : 'Fullscreen');
    };

    const fmt = (sec) => {
      const s = Math.max(0, Math.floor(sec || 0));
      return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    };

    const syncProgress = () => {
      const dur = vid.duration || 0;
      const pct = dur ? Math.max(0, Math.min(100, (vid.currentTime / dur) * 100)) : 0;
      if (fill) fill.style.width = `${pct}%`;
      if (thumb) thumb.style.left = `${pct}%`;
      if (track) track.setAttribute('aria-valuenow', String(Math.round(pct)));
      if (timeEl) timeEl.textContent = `${fmt(vid.currentTime)} / ${fmt(dur)}`;
    };

    const seekTo = (clientX) => {
      if (!vid.duration || !track) return;
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      vid.currentTime = ratio * vid.duration;
      syncProgress();
    };

    const onToggle = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (vid.paused) {
        const play = vid.play();
        if (play && typeof play.catch === 'function') play.catch(() => {});
      } else {
        vid.pause();
      }
      syncToggle();
    };

    const onMute = (e) => {
      e.preventDefault();
      e.stopPropagation();
      vid.muted = !vid.muted;
      if (!vid.muted && vid.volume === 0) vid.volume = 1;
      syncMute();
    };

    const onFs = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        const active = document.fullscreenElement || document.webkitFullscreenElement;
        if (active) {
          if (document.exitFullscreen) await document.exitFullscreen();
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        } else if (rootEl.requestFullscreen) {
          await rootEl.requestFullscreen();
        } else if (vid.webkitEnterFullscreen) {
          vid.webkitEnterFullscreen();
        } else if (rootEl.webkitRequestFullscreen) {
          rootEl.webkitRequestFullscreen();
        }
      } catch (_) { /* ignore */ }
      syncFs();
    };

    const onSeekDown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragging = true;
      track.classList.add('is-dragging');
      track.setPointerCapture?.(e.pointerId);
      seekTo(e.clientX);
    };

    const onSeekMove = (e) => {
      if (!dragging) return;
      seekTo(e.clientX);
    };

    const onSeekUp = (e) => {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('is-dragging');
      track.releasePointerCapture?.(e.pointerId);
      wake();
    };

    const onSeekKey = (e) => {
      if (!vid.duration) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        vid.currentTime = Math.max(0, Math.min(vid.duration, vid.currentTime + (e.key === 'ArrowLeft' ? -5 : 5)));
        syncProgress();
      }
    };

    const onStage = (e) => {
      if (e.target.closest('[data-player-bar], [data-player-toggle]')) return;
      onToggle(e);
    };

    toggleBtn?.addEventListener('click', onToggle);
    muteBtn?.addEventListener('click', onMute);
    fsBtn?.addEventListener('click', onFs);
    track?.addEventListener('pointerdown', onSeekDown);
    track?.addEventListener('pointermove', onSeekMove);
    track?.addEventListener('pointerup', onSeekUp);
    track?.addEventListener('pointercancel', onSeekUp);
    track?.addEventListener('keydown', onSeekKey);
    rootEl.addEventListener('click', onStage);
    rootEl.addEventListener('pointermove', wake);
    rootEl.addEventListener('pointerdown', wake);
    rootEl.addEventListener('focusin', wake);
    rootEl.addEventListener('pointerleave', sleep);
    vid.addEventListener('play', syncToggle);
    vid.addEventListener('pause', syncToggle);
    vid.addEventListener('timeupdate', syncProgress);
    vid.addEventListener('loadedmetadata', syncProgress);
    vid.addEventListener('volumechange', syncMute);
    document.addEventListener('fullscreenchange', syncFs);
    document.addEventListener('webkitfullscreenchange', syncFs);

    playerCleanups.push(() => {
      toggleBtn?.removeEventListener('click', onToggle);
      muteBtn?.removeEventListener('click', onMute);
      fsBtn?.removeEventListener('click', onFs);
      track?.removeEventListener('pointerdown', onSeekDown);
      track?.removeEventListener('pointermove', onSeekMove);
      track?.removeEventListener('pointerup', onSeekUp);
      track?.removeEventListener('pointercancel', onSeekUp);
      track?.removeEventListener('keydown', onSeekKey);
      rootEl.removeEventListener('click', onStage);
      rootEl.removeEventListener('pointermove', wake);
      rootEl.removeEventListener('pointerdown', wake);
      rootEl.removeEventListener('focusin', wake);
      rootEl.removeEventListener('pointerleave', sleep);
      clearTimeout(idleTimer);
      vid.removeEventListener('play', syncToggle);
      vid.removeEventListener('pause', syncToggle);
      vid.removeEventListener('timeupdate', syncProgress);
      vid.removeEventListener('loadedmetadata', syncProgress);
      vid.removeEventListener('volumechange', syncMute);
      document.removeEventListener('fullscreenchange', syncFs);
      document.removeEventListener('webkitfullscreenchange', syncFs);
    });

    syncToggle();
    syncMute();
    syncFs();
    syncProgress();
  }

  function makePlayerEl(item, name) {
    const wrap = document.createElement('div');
    wrap.className = 'hotel-player';

    const vid = document.createElement('video');
    vid.src = absUrl(item.src);
    vid.controls = false;
    vid.playsInline = true;
    vid.setAttribute('playsinline', '');
    vid.muted = true;
    vid.loop = true;
    vid.preload = 'metadata';
    vid.disablePictureInPicture = true;
    vid.setAttribute('disablepictureinpicture', '');
    vid.className = 'hotel-player__video';
    vid.setAttribute('aria-label', item.alt || name || 'Video');

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'hotel-player__toggle';
    toggle.setAttribute('data-player-toggle', '');
    toggle.setAttribute('aria-label', 'Pause');
    toggle.innerHTML = ICON_PAUSE;

    const bar = document.createElement('div');
    bar.className = 'hotel-player__bar';
    bar.setAttribute('data-player-bar', '');

    const time = document.createElement('span');
    time.className = 'hotel-player__time';
    time.setAttribute('data-player-time', '');
    time.textContent = '0:00 / 0:00';

    const track = document.createElement('div');
    track.className = 'hotel-player__seek';
    track.setAttribute('data-player-track', '');
    track.setAttribute('role', 'slider');
    track.setAttribute('tabindex', '0');
    track.setAttribute('aria-label', 'Seek');
    track.setAttribute('aria-valuemin', '0');
    track.setAttribute('aria-valuemax', '100');
    track.setAttribute('aria-valuenow', '0');
    track.innerHTML = '<span class="hotel-player__seek-fill" data-player-fill></span><span class="hotel-player__seek-thumb" data-player-thumb></span>';

    const tools = document.createElement('div');
    tools.className = 'hotel-player__tools';

    const mute = document.createElement('button');
    mute.type = 'button';
    mute.className = 'hotel-player__tool';
    mute.setAttribute('data-player-mute', '');
    mute.setAttribute('aria-label', 'Unmute');
    mute.innerHTML = ICON_MUTE;

    const fs = document.createElement('button');
    fs.type = 'button';
    fs.className = 'hotel-player__tool';
    fs.setAttribute('data-player-fs', '');
    fs.setAttribute('aria-label', 'Fullscreen');
    fs.innerHTML = ICON_FS;

    tools.appendChild(mute);
    tools.appendChild(fs);

    bar.appendChild(time);
    bar.appendChild(track);
    bar.appendChild(tools);

    wrap.appendChild(vid);
    wrap.appendChild(toggle);
    wrap.appendChild(bar);
    bindPlayer(wrap, vid);

    const play = vid.play();
    if (play && typeof play.catch === 'function') play.catch(() => {});

    return wrap;
  }

  function makeImageEl(item, name) {
    const img = document.createElement('img');
    img.src = absUrl(item.src || PLACEHOLDER);
    img.alt = item.alt || name || '';
    img.className = 'hotel-sheet__asset';
    img.decoding = 'async';
    return img;
  }

  function currentSlides() {
    if (!activeHotel) return [];
    const name = field(activeHotel, 'name');
    const { video, photos } = splitMedia(activeHotel.media, activeHotel.cover, name);
    return video ? [video, ...photos] : photos;
  }

  function setSheetIndex(next) {
    const slides = currentSlides();
    if (!slides.length) return;
    const total = slides.length;
    sheetIndex = ((next % total) + total) % total;
    renderSheetStage();
    syncSheetChrome();
  }

  function renderSheetStage() {
    if (!sheetStage || !activeHotel) return;
    stopHostMedia(sheetStage);
    sheetStage.innerHTML = '';
    const slides = currentSlides();
    const item = slides[sheetIndex];
    if (!item) return;
    const name = field(activeHotel, 'name');

    if (item.type === 'video') {
      sheetStage.appendChild(makePlayerEl(item, name));
      return;
    }

    sheetStage.appendChild(makeImageEl(item, name));
  }

  function formatUpdated(iso) {
    if (!iso) return '';
    const d = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return '';
    try {
      return new Intl.DateTimeFormat(lang() === 'en' ? 'en-GB' : 'ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d);
    } catch (_) {
      return iso;
    }
  }

  function syncSheetChrome() {
    const slides = currentSlides();
    const total = slides.length;
    const hasMedia = total > 0;
    const multi = total > 1;

    if (sheetNav) sheetNav.hidden = !hasMedia;
    if (sheetPrev) sheetPrev.disabled = !multi;
    if (sheetNext) sheetNext.disabled = !multi;
    if (sheetCount) {
      sheetCount.textContent = hasMedia
        ? `${padIndex(sheetIndex + 1)} / ${padIndex(Math.max(total, 1))}`
        : '';
    }
  }

  function fillSheetFlag(hotel) {
    if (!sheetFlag) return;
    sheetFlag.innerHTML = '';
    if (hotel.flag) {
      const img = document.createElement('img');
      img.src = absUrl(hotel.flag);
      img.alt = '';
      img.decoding = 'async';
      sheetFlag.appendChild(img);
      return;
    }
    if (hotel.flagEmoji) sheetFlag.textContent = hotel.flagEmoji;
  }

  function fillSheet(hotel) {
    const name = field(hotel, 'name');
    const countryName = field(hotel, 'country');
    if (sheetBar) sheetBar.textContent = name;
    if (sheetTitle) sheetTitle.textContent = name;
    if (sheetCountry) sheetCountry.textContent = countryName;
    fillSheetFlag(hotel);
    fillStars(sheetStars, hotel.stars ?? 5);

    if (sheetText) {
      sheetText.innerHTML = '';
      String(field(hotel, 'description') || field(hotel, 'excerpt'))
        .split(/\n+/)
        .filter(Boolean)
        .forEach((para) => {
          const p = document.createElement('p');
          p.textContent = para;
          sheetText.appendChild(p);
        });
    }

    sheetIndex = 0;
    renderSheetStage();
    syncSheetChrome();

    if (sheetUpdated) {
      const label = t('hotels.sheetUpdated');
      const date = formatUpdated(cfg.updatedAt || hotel.updatedAt || '');
      sheetUpdated.textContent = date ? `${label} ${date}` : '';
    }
  }

  function closeSheet() {
    if (!sheetOpen) return;
    sheetOpen = false;
    activeHotel = null;
    sheetIndex = 0;
    sheet.classList.remove('is-open');
    sheet.setAttribute('aria-hidden', 'true');
    if (!filtersOpen) lockPageScroll(false);
    stopHostMedia(sheetStage);
    if (sheetStage) sheetStage.innerHTML = '';
    if (sheetNav) sheetNav.hidden = true;
    if (sheetCount) sheetCount.textContent = '';
    if (sheetUpdated) sheetUpdated.textContent = '';
    if (sheetHome && sheet.parentNode !== sheetHome) sheetHome.appendChild(sheet);
  }

  function openSheet(hotel) {
    if (filtersOpen) closeFilters({ keepScroll: true });
    sheetOpen = true;
    activeHotel = hotel;
    if (sheet.parentNode !== document.body) document.body.appendChild(sheet);
    sheet.classList.add('is-open');
    sheet.setAttribute('aria-hidden', 'false');
    lockPageScroll(true);
    fillSheet(hotel);
  }

  function openFilters() {
    if (!filtersEl || !filtersPanel || !mobileMq.matches) return;
    filtersOpen = true;
    if (filtersEl.parentNode !== document.body) document.body.appendChild(filtersEl);
    filtersEl.classList.add('is-open');
    filtersEl.setAttribute('aria-hidden', 'false');
    filtersPanel.setAttribute('role', 'dialog');
    filtersPanel.setAttribute('aria-modal', 'true');
    filtersPanel.setAttribute('aria-labelledby', 'hotel-filters-title');
    lockPageScroll(true);
    updateFilterChrome();
  }

  function closeFilters({ keepScroll = false } = {}) {
    if (!filtersEl || !filtersOpen) {
      syncFiltersMode();
      return;
    }
    filtersOpen = false;
    filtersEl.classList.remove('is-open');
    if (filtersHome) {
      if (filtersNext && filtersNext.parentNode === filtersHome) {
        filtersHome.insertBefore(filtersEl, filtersNext);
      } else {
        filtersHome.appendChild(filtersEl);
      }
    }
    if (!keepScroll && !sheetOpen) lockPageScroll(false);
    syncFiltersMode();
    updateFilterChrome();
  }

  function refreshLocale() {
    applyI18n(root);
    if (filtersEl && !root.contains(filtersEl)) applyI18n(filtersEl);
    if (!root.contains(sheet)) applyI18n(sheet);
    renderNav();
    renderCountries();
    updateFilterChrome();
    renderGrid();
    if (sheetOpen && activeHotel) fillSheet(activeHotel);
  }

  searchInput?.addEventListener('input', () => {
    query = searchInput.value || '';
    renderGrid();
  });

  root.querySelector('.hotel-catalog__search-pill')?.addEventListener('click', () => {
    searchInput?.focus({ preventScroll: true });
  });

  resetBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!btn.disabled) clearFilters();
    });
  });

  filtersOpenBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    openFilters();
  });

  filtersEl?.querySelectorAll('[data-hotel-filters-close]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      closeFilters();
    });
  });

  sheet.querySelectorAll('[data-hotel-sheet-close]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      closeSheet();
    });
  });

  sheetPrev?.addEventListener('click', (e) => {
    e.preventDefault();
    setSheetIndex(sheetIndex - 1);
  });

  sheetNext?.addEventListener('click', (e) => {
    e.preventDefault();
    setSheetIndex(sheetIndex + 1);
  });

  let touchX = null;
  sheetStage?.addEventListener('touchstart', (e) => {
    touchX = e.changedTouches?.[0]?.clientX ?? null;
  }, { passive: true });

  sheetStage?.addEventListener('touchend', (e) => {
    if (touchX == null || currentSlides().length < 2) return;
    const x = e.changedTouches?.[0]?.clientX;
    if (x == null) return;
    const dx = x - touchX;
    touchX = null;
    if (Math.abs(dx) < 40) return;
    setSheetIndex(sheetIndex + (dx < 0 ? 1 : -1));
  }, { passive: true });

  document.addEventListener('keydown', (e) => {
    if (!sheetOpen) {
      if (e.key === 'Escape' && filtersOpen) closeFilters();
      return;
    }
    if (e.key === 'Escape') {
      closeSheet();
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSheetIndex(sheetIndex - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSheetIndex(sheetIndex + 1);
    }
  });

  document.addEventListener('ct:prefs', refreshLocale);

  function onMobileMqChange() {
    syncFiltersMode();
  }

  if (typeof mobileMq.addEventListener === 'function') {
    mobileMq.addEventListener('change', onMobileMqChange);
  } else if (typeof mobileMq.addListener === 'function') {
    mobileMq.addListener(onMobileMqChange);
  }

  renderNav();
  renderCountries();
  updateFilterChrome();
  syncFiltersMode();
  renderGrid();
}

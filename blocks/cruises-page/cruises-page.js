/**
 * Круизы: панель направлений, программы аккордеоном. Без перехода на другую страницу.
 */
import { applyI18n } from '../../core/i18n.js';

const MOBILE_MQ = '(max-width: 900px)';

export function initCruisesPage(root) {
  if (!root || root.dataset.ready === 'true') return;
  root.dataset.ready = 'true';

  const navHost = root.querySelector('[data-cruise-nav]');
  const emptyEl = root.querySelector('[data-cruise-empty]');
  const searchInput = root.querySelector('[data-cruise-search]');
  const asideTop = root.querySelector('.hotel-catalog__aside-top');
  const filtersEl = root.querySelector('[data-cruise-filters]');
  const filtersPanel = filtersEl?.querySelector('.hotel-catalog__filters-panel');
  const filtersOpenBtn = root.querySelector('[data-cruise-filters-open]');
  const filtersCountEl = root.querySelector('[data-cruise-filters-count]');
  const resetBtns = root.querySelectorAll('[data-cruise-reset]');
  const items = [...root.querySelectorAll('[data-cruise-item]')];

  if (!navHost || !items.length) return;

  const regions = [...new Map(items.map((item) => [item.dataset.region, item.querySelector('.news-list__date')?.textContent || item.dataset.region])).entries()]
    .map(([id, label]) => ({ id, label }));

  const selectedRegions = new Set();
  let query = '';
  let filtersOpen = false;

  const filtersHome = filtersEl?.parentNode || null;
  const filtersNext = filtersEl?.nextSibling || null;
  const mobileMq = window.matchMedia(MOBILE_MQ);

  const hashId = location.hash.replace('#', '');
  if (regions.some((region) => region.id === hashId)) selectedRegions.add(hashId);

  function makeCheck({ id, label, checked, onChange }) {
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

    const name = document.createElement('span');
    name.className = 'hotel-catalog__check-text';
    name.textContent = label;

    input.addEventListener('change', () => onChange(input.checked));
    row.addEventListener('mousedown', (event) => event.preventDefault());
    row.append(input, box, name);
    return row;
  }

  function activeFilterCount() {
    return selectedRegions.size;
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
      if (filtersOpen) closeFilters();
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

  function applyList() {
    const q = query.trim().toLowerCase();
    let shown = 0;
    items.forEach((item) => {
      const regionOk = !selectedRegions.size || selectedRegions.has(item.dataset.region);
      const textOk = !q || item.textContent.toLowerCase().includes(q);
      const on = regionOk && textOk;
      item.hidden = !on;
      if (on) shown += 1;
    });
    if (emptyEl) emptyEl.hidden = shown > 0;
  }

  function renderNav() {
    navHost.innerHTML = '';
    regions.forEach((region) => {
      const label = root.querySelector(`[data-cruise-item][data-region="${region.id}"] .news-list__date`);
      navHost.appendChild(makeCheck({
        id: `cruise-region-${region.id}`,
        label: label?.textContent || region.label,
        checked: selectedRegions.has(region.id),
        onChange: (on) => {
          if (on) selectedRegions.add(region.id);
          else selectedRegions.delete(region.id);
          onFilterChange();
        },
      }));
    });
  }

  function setOpen(row, on) {
    row.classList.toggle('is-open', on);
    const panel = row.querySelector('.cruise-row__panel');
    const button = row.querySelector('.cruise-row__toggle');
    if (panel) panel.hidden = !on;
    if (button) button.setAttribute('aria-expanded', on ? 'true' : 'false');
  }

  function toggleRow(row) {
    const next = !row.classList.contains('is-open');
    items.forEach((item) => setOpen(item, item === row && next));
    if (next) {
      const id = row.id;
      if (id && location.hash !== `#${id}`) history.replaceState(null, '', `#${id}`);
    }
  }

  function clearFilters() {
    selectedRegions.clear();
    (filtersEl || root).querySelectorAll('.hotel-catalog__check input').forEach((input) => {
      input.checked = false;
    });
    if (asideTop) asideTop.scrollTop = 0;
    if (location.hash) history.replaceState(null, '', `${location.pathname}${location.search}`);
    onFilterChange();
  }

  function openFilters() {
    if (!filtersEl || !filtersPanel || !mobileMq.matches) return;
    filtersOpen = true;
    if (filtersEl.parentNode !== document.body) document.body.appendChild(filtersEl);
    filtersEl.classList.add('is-open');
    filtersEl.setAttribute('aria-hidden', 'false');
    filtersPanel.setAttribute('role', 'dialog');
    filtersPanel.setAttribute('aria-modal', 'true');
    filtersPanel.setAttribute('aria-labelledby', 'cruise-filters-title');
    lockPageScroll(true);
    updateFilterChrome();
  }

  function closeFilters() {
    if (!filtersEl || !filtersOpen) {
      syncFiltersMode();
      return;
    }
    filtersOpen = false;
    filtersEl.classList.remove('is-open');
    if (filtersHome) {
      if (filtersNext && filtersNext.parentNode === filtersHome) filtersHome.insertBefore(filtersEl, filtersNext);
      else filtersHome.appendChild(filtersEl);
    }
    lockPageScroll(false);
    syncFiltersMode();
    updateFilterChrome();
  }

  function onFilterChange() {
    updateFilterChrome();
    applyList();
  }

  function refreshLocale() {
    applyI18n(root);
    if (filtersEl && !root.contains(filtersEl)) applyI18n(filtersEl);
    renderNav();
    updateFilterChrome();
  }

  searchInput?.addEventListener('input', () => {
    query = searchInput.value || '';
    applyList();
  });

  root.querySelector('.hotel-catalog__search-pill')?.addEventListener('click', () => {
    searchInput?.focus({ preventScroll: true });
  });

  resetBtns.forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!btn.disabled) clearFilters();
    });
  });

  filtersOpenBtn?.addEventListener('click', (event) => {
    event.preventDefault();
    openFilters();
  });

  filtersEl?.querySelectorAll('[data-cruise-filters-close]').forEach((el) => {
    el.addEventListener('click', (event) => {
      event.preventDefault();
      closeFilters();
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && filtersOpen) closeFilters();
  });

  document.addEventListener('ct:prefs', refreshLocale);

  if (typeof mobileMq.addEventListener === 'function') {
    mobileMq.addEventListener('change', () => syncFiltersMode());
  }

  items.forEach((row) => {
    row.querySelector('.cruise-row__toggle')?.addEventListener('click', () => toggleRow(row));
  });

  renderNav();
  updateFilterChrome();
  syncFiltersMode();
  applyList();

  const hashed = items.find((row) => row.id === hashId);
  if (hashed && !hashed.hidden) setOpen(hashed, true);
}

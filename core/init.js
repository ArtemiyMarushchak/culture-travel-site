/**
 * Запуск страницы (после разбора HTML).
 *
 * Шаги:
 * 1. Применить сохранённый язык
 * 2. Инициализировать каждый [data-block] через registry (header, services, cases-slider, …)
 * 3. Подключить якоря, video overlay, общий modal
 *
 * Зачем: одна точка входа вместо разрозненных script-тегов у блоков.
 */
import { blockInits, coreFeatures } from './registry.js';
import { initAnchors } from './anchors.js';
import { initVideoOverlay } from './video-overlay.js';
import { initModal } from '../blocks/modal/modal.js';
import { initPrefs } from './prefs.js';

let headerApi = null;

initPrefs();

document.querySelectorAll('[data-block]').forEach((el) => {
  const type = el.dataset.block;
  /* Modal инициализируется ниже (портал в <body>) — без двойных слушателей */
  if (type === 'modal') return;

  const init = blockInits[type];
  if (!init) return;

  try {
    const result = init(el);
    if (type === 'header') headerApi = result;
  } catch (err) {
    console.error(`Block init failed: ${type}`, err);
  }
});

if (coreFeatures.anchors) initAnchors();

window.addEventListener('load', () => {
  setTimeout(() => {
    if (coreFeatures.videoOverlay) initVideoOverlay();
    headerApi?.updateHeader?.();
  }, 120);
});

document.addEventListener('page:layout', () => headerApi?.updateHeader?.());

const modalRoot = document.querySelector('[data-block="modal"]');
if (modalRoot && blockInits.modal) {
  if (modalRoot.parentElement !== document.body) {
    document.body.appendChild(modalRoot);
  }
  initModal(modalRoot);
}

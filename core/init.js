import { blockInits, coreFeatures } from './registry.js';
import { initAnchors } from './anchors.js';
import { initVideoOverlay } from './video-overlay.js';
import { initModal } from '../blocks/modal/modal.js';
import { initPrefs } from './prefs.js';

let headerApi = null;

initPrefs();

document.querySelectorAll('[data-block]').forEach((el) => {
  const type = el.dataset.block;
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

if (blockInits.modal) initModal(document.body);

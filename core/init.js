import { initHeader } from '../blocks/header/header.js';
import { initHeroVideo } from '../blocks/hero-video/hero-video.js';
import { initCasesSlider } from '../blocks/cases-slider/cases-slider.js';
import { initHotelCatalog } from '../blocks/hotel-catalog/hotel-catalog.js';
import { initModal } from '../blocks/modal/modal.js';

const registry = {
  header: initHeader,
  'hero-video': initHeroVideo,
  'cases-slider': initCasesSlider,
  'hotel-catalog': initHotelCatalog,
  modal: initModal,
};

document.querySelectorAll('[data-block]').forEach((el) => {
  const type = el.dataset.block;
  if (registry[type]) {
    try {
      registry[type](el);
    } catch (err) {
      console.error(`Block init failed: ${type}`, err);
    }
  }
});

// Global modals (footer triggers)
initModal(document.body);

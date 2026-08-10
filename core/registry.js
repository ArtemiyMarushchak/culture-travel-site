/**
 * Реестр JS-инициализаторов блоков.
 * Метаданные (css, dataSource) — core/blocks.registry.json
 * Build читает registry.json; браузер — blockInits ниже.
 */

import { initHeader } from '../blocks/header/header.js';
import { initHeroVideo } from '../blocks/hero-video/hero-video.js';
import { initCasesSlider } from '../blocks/cases-slider/cases-slider.js';
import { initHotelCatalog } from '../blocks/hotel-catalog/hotel-catalog.js';
import { initModal } from '../blocks/modal/modal.js';
import { initContactCard } from '../blocks-secondary/contact-card/contact-card.js';

/** @type {Record<string, (root: Element) => unknown>} */
export const blockInits = {
  header: initHeader,
  'hero-video': initHeroVideo,
  'cases-slider': initCasesSlider,
  'hotel-catalog': initHotelCatalog,
  modal: initModal,
  'contact-card': initContactCard,
};

export const coreFeatures = {
  anchors: true,
  videoOverlay: true,
};

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
import { initCaseTour } from '../blocks-secondary/case-tour/case-tour.js';
import { initNewsList } from '../blocks/news-list/news-list.js';
import { initReviews } from '../blocks/reviews/reviews.js';
import { initServices } from '../blocks/services/services.js';
import { initFooter } from '../blocks/footer/footer.js';

/** @type {Record<string, (root: Element) => unknown>} */
export const blockInits = {
  header: initHeader,
  footer: initFooter,
  'hero-video': initHeroVideo,
  'cases-slider': initCasesSlider,
  'hotel-catalog': initHotelCatalog,
  modal: initModal,
  'contact-card': initContactCard,
  'case-tour': initCaseTour,
  'news-list': initNewsList,
  reviews: initReviews,
  services: initServices,
};

export const coreFeatures = {
  anchors: true,
  videoOverlay: false,
};

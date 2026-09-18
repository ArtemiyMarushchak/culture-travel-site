#!/usr/bin/env node
/**
 * Culture Travel — сборщик статического сайта
 *
 * Что делает:
 * - Читает страницы (pages/*.page.json) и контент (news, cases, hotels)
 * - Оборачивает каждую страницу в header/footer из core/page-layout.json
 * - Пишет чистые URL в dist/ (пример: /cases/slug/ → dist/cases/slug/index.html)
 * - Копирует assets/styles и генерирует robots.txt, sitemap.xml, llms.txt, 404.html
 *
 * Зачем: правите JSON/HTML в репозитории, одна команда — и деплой dist/ (или push в main).
 *
 * Локально: node tools/build.mjs
 * Превью:   node tools/preview.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, statSync, existsSync, watch } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const isWatch = process.argv.includes('--watch');

const site = JSON.parse(readFileSync(join(ROOT, 'core/site.json'), 'utf8'));

/* GitHub Pages: для project-сайта нужен basePath /repo; свой домен — пути от корня. */
if (process.env.GITHUB_PAGES === 'true' && process.env.GITHUB_REPOSITORY) {
  const [, repoName] = process.env.GITHUB_REPOSITORY.split('/');
  const owner = process.env.GITHUB_REPOSITORY_OWNER || '';
  const isUserSite = repoName.toLowerCase() === `${owner.toLowerCase()}.github.io`;
  const useCustomDomain = process.env.CUSTOM_DOMAIN === 'true';
  if (!isUserSite && !useCustomDomain) {
    site.url = `https://${owner}.github.io`;
    site.basePath = `/${repoName}`;
  }
}
const seoDefaults = {
  ...JSON.parse(readFileSync(join(ROOT, 'seo/defaults.json'), 'utf8')),
  ...(site.seo || {}),
};
const blockRegistry = JSON.parse(readFileSync(join(ROOT, 'core/blocks.registry.json'), 'utf8'));
const pageLayout = JSON.parse(readFileSync(join(ROOT, 'core/page-layout.json'), 'utf8'));
const layoutTemplate = readFileSync(join(ROOT, 'layouts/default.html'), 'utf8');
const headTemplate = readFileSync(join(ROOT, 'seo/templates/head.html'), 'utf8');
const BUILD_ID = new Date().toISOString().replace(/\D/g, '').slice(0, 14);

const PAGE_TEMPLATES = {
  case: JSON.parse(readFileSync(join(ROOT, 'templates/case.page.json'), 'utf8')),
  news: JSON.parse(readFileSync(join(ROOT, 'templates/news.page.json'), 'utf8')),
  hotel: JSON.parse(readFileSync(join(ROOT, 'templates/hotel.page.json'), 'utf8')),
};

/** @type {{ slug: string, title: string, lastmod?: string }[]} */
const sitemapEntries = [];

function read(filePath) {
  return readFileSync(join(ROOT, filePath), 'utf8');
}

function readJson(filePath) {
  return JSON.parse(read(filePath));
}

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function writeOut(relativePath, content) {
  const full = join(DIST, relativePath);
  ensureDir(dirname(full));
  writeFileSync(full, content, 'utf8');
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function interpolate(template, data, rawFields = new Set()) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = data[key] ?? '';
    if (rawFields.has(key)) return String(val);
    return escapeHtml(val);
  });
}

function fullUrl(path) {
  const base = site.url.replace(/\/$/, '');
  const bp = site.basePath.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  // Единый trailing slash на публичных URL (sitemap / canonical)
  if (p === '/') return `${base}${bp}/`;
  return `${base}${bp}${p}`.replace(/([^:]\/)\/+/g, '$1');
}

function slugToDistPath(slug) {
  const clean = slug.replace(/^\/|\/$/g, '');
  if (!clean) return 'index.html';
  return join(clean, 'index.html');
}

function listContentJson(contentDir) {
  const dir = join(ROOT, contentDir);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
    .map((f) => readJson(join(contentDir, f)));
}

function formatDate(dateStr, locale = 'ru-RU') {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateBadge(dateStr, locale = 'ru-RU') {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
    .replace(/\s?г\.?$/u, '')
    .replace(/\.$/u, '');
}

function normalizeContentData(data) {
  const cover = data.cover?.image || data.cover || '';
  let body = data.body || '';

  if (data.bodyFile) {
    const bodyPath = data.bodyFile.startsWith('content/') ? data.bodyFile : join('content', data.bodyFile);
    if (existsSync(join(ROOT, bodyPath))) {
      body = read(bodyPath);
    } else {
      console.warn(`  ⚠ bodyFile not found: ${bodyPath}`);
    }
  }

  let bodyEn = data.bodyEn || '';
  if (data.bodyFileEn) {
    const bodyEnPath = data.bodyFileEn.startsWith('content/') ? data.bodyFileEn : join('content', data.bodyFileEn);
    if (existsSync(join(ROOT, bodyEnPath))) {
      bodyEn = read(bodyEnPath);
    } else {
      console.warn(`  ⚠ bodyFileEn not found: ${bodyEnPath}`);
    }
  }

  const basePath = site.basePath || '';
  const bodyTokens = {
    basePath,
    email: site.contacts?.email || 'info@culture-travel.ru',
    telegram: site.contacts?.telegram || site.social?.telegram || '',
    phone: site.contacts?.phone || '',
    phoneRaw: (site.contacts?.phone || '').replace(/\s/g, ''),
    phoneDisplay: formatPhoneDisplay(site.contacts?.phone || ''),
    telegramHandle: telegramHandle(site.contacts?.telegram || site.social?.telegram || ''),
  };
  const applyBodyTokens = (html) => html.replace(/\{\{(\w+)\}\}/g, (_, key) => (
    Object.prototype.hasOwnProperty.call(bodyTokens, key) ? String(bodyTokens[key]) : `{{${key}}}`
  ));
  body = applyBodyTokens(body);
  bodyEn = applyBodyTokens(bodyEn);

  if (bodyEn && !String(body).includes('data-lang-panel=')) {
    const uniquifyEnIds = (html) => html
      .replace(/\bid="([^"]+)"/g, 'id="$1-en"')
      .replace(/\baria-labelledby="([^"]+)"/g, 'aria-labelledby="$1-en"')
      .replace(/\baria-controls="([^"]+)"/g, 'aria-controls="$1-en"');
    body = [
      `<div class="lang-panel" data-lang-panel="ru">${body}</div>`,
      `<div class="lang-panel" data-lang-panel="en">${uniquifyEnIds(bodyEn)}</div>`,
    ].join('\n');
  }
  return {
    ...data,
    body,
    cover,
    coverImage: data.coverImage || cover,
    coverHtml: cover
      ? `<div class="news-layout__cover"><img src="${escapeHtml(`${basePath}${cover.startsWith('/') ? cover : `/${cover}`}`)}" alt="" width="1600" height="1067" loading="eager" decoding="async"></div>`
      : '',
    dateIso: data.date || data.published || '',
    dateFormatted: formatDate(data.date || data.published),
    dateFormattedEn: formatDate(data.date || data.published, 'en-GB'),
    excerptEn: data.excerptEn || data.excerpt || '',
    subtitleEn: data.subtitleEn || data.subtitle || '',
    email: bodyTokens.email,
    year: String(new Date().getFullYear()),
    basePath,
    title: data.seo?.title?.replace(/\s*\|\s*Culture Travel$/, '') || data.title,
    titleEn: data.titleEn || data.title,
    contentTitle: data.title,
    contentTitleEn: data.titleEn || data.title,
    crumbTitle: data.crumbTitle || data.meta?.country || data.title,
    crumbTitleEn: data.crumbTitleEn || data.meta?.countryEn || data.titleEn || data.title,
    crumbsMiddleHtml: data.privateTour
      ? ''
      : `<li class="tour-crumbs__item">
        <a class="tour-crumbs__link" href="${basePath}/#cases" data-i18n="nav.cases">Кейсы</a>
      </li>`,
    description: data.seo?.description || data.excerpt || data.subtitle || '',
  };
}

function prepareHotelsCatalog() {
  return listContentJson('content/hotels').map((hotel) => {
    const cover = (hotel.media || []).find((item) => item.type === 'image' && item.src)?.src
      || '/assets/images/placeholder.svg';
    return {
      ...hotel,
      cover,
      themes: (hotel.themes || []).join(','),
      mediaJson: JSON.stringify(hotel.media || []).replace(/'/g, '&#39;'),
    };
  });
}

function prepareCasesFeatured() {
  return listContentJson('content/cases')
    .filter((c) => c.featured !== false)
    .map((c) => ({
      slug: c.slug,
      title: c.title,
      titleEn: c.titleEn || c.title,
      subtitle: c.subtitle || '',
      subtitleEn: c.subtitleEn || c.subtitle || '',
      cover: c.cover?.image || c.cover || '/assets/images/placeholder.svg',
    }));
}

function cruiseRouteMapSvg(regionId, stops = []) {
  const labels = (stops || []).slice(0, 5);
  const n = Math.max(labels.length, 2);
  const pts = [];
  for (let i = 0; i < n; i += 1) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const x = 48 + t * 544;
    const wave = Math.sin(t * Math.PI) * (regionId === 'antarctica' ? 36 : 28);
    const y = regionId === 'far-east' ? 110 - wave : 100 + (i % 2 === 0 ? -wave : wave * 0.35);
    pts.push({ x, y, label: labels[i] || '' });
  }
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const land =
    regionId === 'antarctica'
      ? '<path class="cruises-page__map-land" d="M80 48 C180 28 280 36 360 58 C440 82 520 70 560 92 L540 150 C460 130 360 155 260 148 C160 140 90 120 70 95 Z"/>'
      : regionId === 'africa'
        ? '<path class="cruises-page__map-land" d="M220 30 C280 40 310 90 300 150 C290 200 250 230 210 220 C160 205 150 150 160 100 C170 55 190 35 220 30 Z"/>'
        : '<path class="cruises-page__map-land" d="M60 40 C200 20 420 30 580 55 L570 160 C400 140 220 155 70 130 Z"/>';

  const dots = pts.map((p) => {
    const label = p.label
      ? `<text class="cruises-page__map-label" x="${p.x.toFixed(1)}" y="${(p.y - 12).toFixed(1)}" text-anchor="middle">${escapeHtml(p.label)}</text>`
      : '';
    return `<circle class="cruises-page__map-dot" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5"/>${label}`;
  }).join('');

  return `<div class="cruises-page__map" aria-hidden="true">
  <svg viewBox="0 0 640 200" role="presentation">
    <rect class="cruises-page__map-sea" width="640" height="200" rx="8"/>
    ${land}
    <path class="cruises-page__map-route" d="${pathD}"/>
    ${dots}
  </svg>
</div>`;
}

function prepareCruisesCatalog() {
  const catalog = readJson('content/cruises/catalog.json');
  const bp = (site.basePath || '').replace(/\/$/, '');
  const openFirst = catalog.openFirst || (catalog.regions?.[0]?.id) || '';
  const poster = catalog.heroPoster || '/assets/images/services/cruises.jpg';
  const videoPath = catalog.heroVideo || '';
  const videoAbs = videoPath ? join(ROOT, videoPath.replace(/^\//, '')) : '';
  const hasVideo = videoAbs && existsSync(videoAbs);

  const heroVideoHtml = hasVideo
    ? `<video class="cruises-page__hero-video" src="${escapeHtml(`${bp}${videoPath}`)}" poster="${escapeHtml(`${bp}${poster}`)}" autoplay muted loop playsinline preload="metadata" aria-hidden="true" tabindex="-1"></video>`
    : '';

  const telegram = site.contacts?.telegram || site.social?.telegram || '#';

  const regions = (catalog.regions || []).map((region) => {
    const cruises = region.cruises || [];
    const isOpen = region.id === openFirst;
    const mapStops = cruises[0]?.stops || [];
    const cruisesHtml = `<ul class="cruises-page__list">${cruises.map((cruise) => {
      const note = cruise.note
        ? `<p class="cruises-page__item-note" data-i18n-src data-ru="${escapeHtml(cruise.note)}" data-en="${escapeHtml(cruise.noteEn || cruise.note)}">${escapeHtml(cruise.note)}</p>`
        : '';
      return `<li class="cruises-page__item">
  <h3 class="cruises-page__item-title" data-i18n-src data-ru="${escapeHtml(cruise.title)}" data-en="${escapeHtml(cruise.titleEn || cruise.title)}">${escapeHtml(cruise.title)}</h3>
  <p class="cruises-page__item-route" data-i18n-src data-ru="${escapeHtml(cruise.route || '')}" data-en="${escapeHtml(cruise.routeEn || cruise.route || '')}">${escapeHtml(cruise.route || '')}</p>
  <p class="cruises-page__item-meta">
    <span>${escapeHtml(cruise.ship || '')}</span>
    <span data-i18n-src data-ru="${escapeHtml(cruise.duration || '')}" data-en="${escapeHtml(cruise.durationEn || cruise.duration || '')}">${escapeHtml(cruise.duration || '')}</span>
    <span data-i18n-src data-ru="${escapeHtml(cruise.season || '')}" data-en="${escapeHtml(cruise.seasonEn || cruise.season || '')}">${escapeHtml(cruise.season || '')}</span>
  </p>
  ${note}
  <a class="cruises-page__ask" href="${escapeHtml(telegram)}" target="_blank" rel="noopener noreferrer">Запросить даты</a>
</li>`;
    }).join('')}</ul>`;

    return {
      id: region.id,
      title: region.title,
      titleEn: region.titleEn || region.title,
      intro: region.intro || '',
      introEn: region.introEn || region.intro || '',
      cruiseCount: String(cruises.length),
      openClass: isOpen ? ' is-open' : '',
      expanded: isOpen ? 'true' : 'false',
      hiddenAttr: isOpen ? '' : ' hidden',
      mapHtml: cruiseRouteMapSvg(region.id, mapStops),
      cruisesHtml,
    };
  });

  return {
    partner: catalog.partner || 'Swan Hellenic',
    heroTitle: catalog.heroTitle || catalog.title || 'Круизы',
    heroTitleEn: catalog.heroTitleEn || catalog.titleEn || 'Cruises',
    heroLead: catalog.heroLead || catalog.lead || '',
    heroLeadEn: catalog.heroLeadEn || catalog.leadEn || '',
    heroPoster: poster,
    heroVideoHtml,
    catalogTitle: catalog.catalogTitle || 'Направления',
    catalogTitleEn: catalog.catalogTitleEn || 'Destinations',
    ctaTitle: catalog.ctaTitle || '',
    ctaTitleEn: catalog.ctaTitleEn || '',
    ctaText: catalog.ctaText || '',
    ctaTextEn: catalog.ctaTextEn || '',
    regions,
  };
}

function prepareServicesCatalog() {
  const catalog = readJson('content/services/catalog.json');
  const bp = (site.basePath || '').replace(/\/$/, '');
  const items = (catalog.items || []).map((item, index) => {
    const image = item.image || '';
    const imageMobile = item.imageMobile || image;
    const desktopSrc = image ? `${bp}${image}` : '';
    const mobileSrc = imageMobile ? `${bp}${imageMobile}` : desktopSrc;
    return {
      ...item,
      indexPad: String(index + 1).padStart(2, '0'),
      short: item.short || item.title || '',
      shortEn: item.shortEn || item.titleEn || '',
      image,
      imageMobile,
      imageSrc: desktopSrc,
      imageMobileSrc: mobileSrc,
      photoHtml: desktopSrc
        ? `<img src="${escapeHtml(desktopSrc)}" alt="" width="2400" height="1350" loading="${index === 0 ? 'eager' : 'lazy'}" decoding="async">`
        : '',
      activeClass: index === 0 ? ' is-active' : '',
      coverClass: item.cover ? ' is-cover' : '',
      expanded: index === 0 ? 'true' : 'false',
      ariaHidden: index === 0 ? 'false' : 'true',
    };
  });
  const hasPhotos = items.some((item) => item.image);
  const first = items[0] || {};
  return {
    overline: catalog.overline || '',
    overlineEn: catalog.overlineEn || '',
    title: catalog.title || '',
    titleEn: catalog.titleEn || '',
    mediaAttr: hasPhotos ? 'photos' : 'placeholder',
    items,
    itemCount: items.length,
    firstTitle: first.title || '',
    firstTitleEn: first.titleEn || '',
    firstText: first.text || '',
    firstTextEn: first.textEn || '',
    firstImage: first.image || '',
  };
}

function reviewAvatarHtml(item = {}) {
  const bp = (site.basePath || '').replace(/\/$/, '');
  const photo = item.photo || item.proof || '';
  if (photo) {
    const src = photo.startsWith('/') ? `${bp}${photo}` : photo;
    return `<img src="${escapeHtml(src)}" alt="" loading="lazy" decoding="async">`;
  }
  const country = String(item.country || '').trim().toLowerCase();
  if (country) {
    const src = `${bp}/assets/images/flags/${country}.svg`;
    return `<img class="rv__flag" src="${escapeHtml(src)}" alt="" width="40" height="40" loading="lazy" decoding="async">`;
  }
  return '<svg class="rv__avatar-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="3.25" stroke="currentColor" stroke-width="1.5"/><path d="M5.2 19.2c1.2-3.15 3.7-4.95 6.8-4.95s5.6 1.8 6.8 4.95" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
}

function prepareReviewsCatalog() {
  const catalog = readJson('content/reviews/catalog.json');
  const pageSize = Number(catalog.pageSize || 4);
  const items = (catalog.items || []).map((item, index) => ({
    ...item,
    avatarHtml: reviewAvatarHtml(item),
    indexRu: `${index + 1} отзыв`,
    indexEn: `${index + 1} review`,
    hiddenClass: index >= pageSize ? ' is-hidden' : '',
  }));
  return {
    title: catalog.title || '',
    titleEn: catalog.titleEn || '',
    pageSize: String(pageSize),
    moreHiddenAttr: items.length <= pageSize ? ' hidden' : '',
    items,
  };
}

function prepareCasesSlider(basePath = '') {
  const catalog = readJson('content/cases-slider/catalog.json');
  const bp = basePath.replace(/\/$/, '');
  const cases = {};
  const regionLabels = Object.fromEntries(
    (catalog.regions || []).map((region) => [region.id, region.label])
  );

  for (const [region, items] of Object.entries(catalog.cases || {})) {
    cases[region] = (items || []).map((item) => {
      const imagePath = item.image || '/assets/images/placeholder.svg';
      const image = imagePath.startsWith('/') ? `${bp}${imagePath}` : imagePath;
      const link = item.slug ? `${bp}/cases/${item.slug}/`.replace(/([^:]\/)\/+/g, '$1') : '';
      const gallery = Array.isArray(item.gallery) && item.gallery.length
        ? item.gallery.map((src) => (src.startsWith('/') ? `${bp}${src}` : src))
        : [image];
      return {
        title: item.title || '',
        titleEn: item.titleEn || '',
        text: item.text || '',
        textEn: item.textEn || '',
        image,
        gallery,
        link,
        badge: item.badge || '',
        country: item.country || item.badge || '',
        countryEn: item.countryEn || '',
        flag: item.flag || '',
        days: Number(item.days) || 0,
        rating: item.rating || '5.0',
        regionId: region,
        regionLabel: regionLabels[region] || '',
      };
    });
  }

  const regions = (catalog.regions || []).map((region, index) => ({
    id: region.id,
    label: region.label,
    tabClass: index === 0 ? ' is-active' : '',
    ariaSelected: index === 0 ? 'true' : 'false',
  }));

  return {
    regions,
    casesJson: JSON.stringify({ cases, regions }).replace(/</g, '\\u003c'),
  };
}

function prepareNewsList() {
  return listContentJson('content/news')
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .map((n) => ({
      slug: n.slug,
      title: n.title,
      titleEn: n.titleEn || n.title,
      excerpt: n.excerpt || '',
      excerptEn: n.excerptEn || n.excerpt || '',
      cover: n.cover?.image || n.cover || '/assets/images/placeholder.svg',
      dateIso: n.date,
      dateFormatted: formatDate(n.date),
      dateBadge: formatDateBadge(n.date),
      dateBadgeEn: formatDateBadge(n.date, 'en-GB'),
    }));
}

function resolveBlockData(block, pageData) {
  const data = { ...pageData, ...(block.data || {}) };
  const meta = blockRegistry.blocks[block.type] || {};
  const source = block.data?.source || meta.dataSource;
  const prepare = meta.dataPrepare;

  if (prepare === 'casesSlider' || block.type === 'cases-slider') {
    Object.assign(data, prepareCasesSlider(site.basePath || ''));
  }
  if (prepare === 'servicesCatalog' || block.type === 'services') {
    Object.assign(data, prepareServicesCatalog());
  }
  if (prepare === 'cruisesCatalog' || block.type === 'cruises-page') {
    Object.assign(data, prepareCruisesCatalog());
  }
  if (prepare === 'reviewsCatalog' || block.type === 'reviews') {
    Object.assign(data, prepareReviewsCatalog());
  }
  if (prepare === 'casesFeatured' || source === 'content/cases') {
    data.items = prepareCasesFeatured();
  }
  if (prepare === 'newsList' || source === 'content/news' || block.type === 'news-list') {
    const isHome = Boolean(block.data?.home || data.home);
    const pageSize = Number(block.data?.pageSize || data.pageSize || (isHome ? 4 : 999));
    const items = prepareNewsList().map((item, index) => ({
      ...item,
      hiddenClass: isHome && index >= pageSize ? ' is-hidden' : '',
    }));
    data.items = items;
    data.homeClass = isHome ? ' news-list--home' : '';
    data.sectionId = isHome ? 'news' : 'news-archive';
    data.titleId = isHome ? 'news-home-title' : 'news-archive-title';
    data.pageSize = String(pageSize);
    data.moreHiddenAttr = !isHome || items.length <= pageSize ? ' hidden' : '';
    const titleTag = isHome ? 'h2' : 'h1';
    data.headingHtml = `<${titleTag} class="section__title" id="${data.titleId}" data-i18n="news.title">Новости</${titleTag}>`;
    data.crumbsHtml = isHome
      ? ''
      : `<nav class="crumbs" aria-label="Хлебные крошки" data-i18n-aria="legal.crumbs"><ol class="crumbs__list"><li class="crumbs__item"><a class="crumbs__link" href="${site.basePath || ''}/" data-i18n="nav.home">Главная</a></li><li class="crumbs__item"><span class="crumbs__current" data-i18n="news.title">Новости</span></li></ol></nav>`;
  }
  if (prepare === 'hotelsCatalog' || source === 'content/hotels' || block.type === 'hotel-catalog') {
    data.items = prepareHotelsCatalog();
    data.hotelsJson = JSON.stringify(listContentJson('content/hotels'));
  }

  if (block.type === 'hotel-layout' && Array.isArray(data.media)) {
    data.images = data.media.filter((item) => item.type === 'image');
    data.videos = data.media.filter((item) => item.type === 'video');
  }

  return normalizeContentData(data);
}

function resolvePageBlocks(pageConfig) {
  if (pageConfig.layout === 'minimal') {
    return pageConfig.blocks || [];
  }

  const middle = (pageConfig.blocks || []).filter(
    (block) => !['header', 'footer', 'modal'].includes(block.type),
  );

  return [...(pageLayout.before || []), ...middle, ...(pageLayout.after || [])];
}

function blockFolder(type) {
  const meta = blockRegistry.blocks[type] || {};
  return meta.group === 'secondary' ? 'blocks-secondary' : 'blocks';
}

function formatPhoneDisplay(phone = '') {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('7')) {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  }
  return phone;
}

function telegramHandle(url = '') {
  const match = url.match(/t\.me\/([^/?]+)/);
  return match ? `@${match[1]}` : url;
}

function instagramHandle(url = '') {
  const match = url.match(/instagram\.com\/([^/?#]+)/);
  return match ? `@${match[1]}` : url;
}

function loadBlockHtml(blockType, blockData = {}) {
  const folder = blockFolder(blockType);
  const htmlPath = join(ROOT, folder, blockType, `${blockType}.html`);
  if (!existsSync(htmlPath)) {
    console.warn(`  ⚠ Block not found: ${blockType}`);
    return `<!-- нет блока: ${blockType} -->`;
  }
  let html = readFileSync(htmlPath, 'utf8');

  const merged = {
    ...blockData,
    basePath: site.basePath || '',
    telegram: site.contacts?.telegram || site.social?.telegram || '',
    instagram: site.social?.instagram || '',
    instagramHandle: instagramHandle(site.social?.instagram || ''),
    phone: site.contacts?.phone || '',
    phoneRaw: (site.contacts?.phone || '').replace(/\s/g, ''),
    phoneDisplay: formatPhoneDisplay(site.contacts?.phone || ''),
    whatsapp:
      site.contacts?.whatsapp ||
      (site.contacts?.phone
        ? `https://wa.me/${String(site.contacts.phone).replace(/\D/g, '')}`
        : ''),
    telegramHandle: telegramHandle(site.contacts?.telegram || site.social?.telegram || ''),
    email: site.contacts?.email || '',
    url: (site.url || 'https://culture-travel.ru').replace(/\/$/, ''),
    registryUrl: site.legal?.registryUrl || '',
    legalCompanyName: site.legal?.companyName || '',
    inn: site.legal?.inn || '',
    ogrn: site.legal?.ogrn || '',
    developerName: site.developer?.name || '',
    developerInitials: site.developer?.initials || site.developer?.name || '',
    developerUrl: site.developer?.url || '',
    year: String(new Date().getFullYear()),
    nav: blockData.nav,
  };

  if (blockType === 'header' || blockType === 'footer') {
    const navAll = readJson('core/nav.json');
    const dividerAt = navAll.findIndex((item) => item.divider);
    const primary = (dividerAt >= 0 ? navAll.slice(0, dividerAt) : navAll).filter((item) => !item.divider);
    const secondary = (dividerAt >= 0 ? navAll.slice(dividerAt + 1) : []).filter((item) => !item.divider);
    merged.nav = primary;
    merged.navPrimary = primary;
    merged.navSecondary = secondary;
    merged.navAll = [...primary, ...secondary];
    merged.navAside = [];
  }

  if (blockType === 'header') {
    const isHomePage = blockData.pageKind === 'home' || blockData.slug === '/';
    merged.headerIsHome = isHomePage ? 'true' : 'false';
    merged.headerModifier = isHomePage ? '' : ' is-inner';
  }

  if (blockType === 'footer') {
    const partners = Array.isArray(site.partners) ? site.partners : [];
    merged.partners = partners;
    merged.partnersLoop = [...partners, ...partners];
    merged.registryNumber = site.legal?.registryNumber || '';
    merged.registryNumberHtml = site.legal?.registryNumber
      ? `<span class="lf__registry-num">№ ${escapeHtml(String(site.legal.registryNumber))}</span>`
      : '';
  }
  const rawFields = ['body', 'content', 'coverHtml', 'photoHtml', 'casesJson', 'hotelsJson', 'mediaJson', 'headingHtml', 'crumbsHtml', 'crumbsMiddleHtml', 'registryNumberHtml', 'avatarHtml', 'cruisesHtml', 'mapHtml', 'heroVideoHtml', 'hiddenAttr', 'openClass'];
  html = html.replace(/\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, key, itemTpl) => {
    const arr = merged[key];
    if (!Array.isArray(arr)) return '';
    return arr.map((item, i) => {
      const ctx = typeof item === 'object' ? { ...merged, ...item, index: i } : { ...merged, item, index: i };
      return itemTpl.replace(/\{\{(\w+)\}\}/g, (__, k) => {
        if (rawFields.includes(k) && ctx[k]) return String(ctx[k]);
        return escapeHtml(String(ctx[k] ?? ''));
      });
    }).join('');
  });

  // Простая подстановка {{key}}
  html = html.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (rawFields.includes(key) && merged[key]) return String(merged[key]);
    return escapeHtml(String(merged[key] ?? ''));
  });

  return html;
}

function renderBlocks(blocks, pageData = {}) {
  return blocks.map((block) => {
    const type = block.type;
    const data = resolveBlockData(block, pageData);
    return loadBlockHtml(type, data);
  }).join('\n');
}

function buildHead(meta) {
  const bp = site.basePath || '';
  const title = meta.title || site.name;
  const description = meta.description || seoDefaults.defaultDescription;
  const canonicalPath = meta.slug || '/';
  const canonical = fullUrl(canonicalPath.endsWith('/') ? canonicalPath : `${canonicalPath}/`);
  const isHome = canonicalPath === '/' || meta.pageKind === 'home';
  /* Главная: тёмный chrome под видео. Внутренние: светлая бумага. */
  const themeColor = meta.themeColor || (isHome ? '#0d0d0d' : '#F6F6F6');

  let jsonLd = '';
  if (meta.jsonLd) {
    const schemas = Array.isArray(meta.jsonLd) ? meta.jsonLd : [meta.jsonLd];
    jsonLd = schemas.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n');
  }

  return interpolate(headTemplate, {
    lang: site.language || 'ru',
    title,
    description,
    canonical,
    author: site.author?.name || site.name,
    robots: meta.robots || 'index, follow',
    ogType: meta.ogType || 'website',
    siteName: site.name,
    ogTitle: meta.ogTitle || title,
    ogDescription: meta.ogDescription || description,
    ogUrl: canonical,
    ogImage: fullUrl(meta.ogImage || seoDefaults.defaultOgImage),
    locale: site.locale || 'ru_RU',
    basePath: bp,
    buildId: BUILD_ID,
    themeColor,
    jsonLd,
  }, new Set(['jsonLd']));
}

function buildPage(pageConfig, contentData = {}) {
  const normalized = normalizeContentData({
    ...contentData,
    ...(pageConfig.data || {}),
  // title из contentData — для крошек/H1; SEO-title применяется в normalizeContentData
    description: contentData.seo?.description || contentData.excerpt || contentData.subtitle || pageConfig.description,
  });

  const slug = pageConfig.slug || contentData.slugPath || '/';
  const normalizedSlug = slug.startsWith('/') ? slug : `/${slug}`;
  const slugPath = normalizedSlug.endsWith('/') || normalizedSlug === '/' ? normalizedSlug : `${normalizedSlug}/`;

  const title = normalized.title || pageConfig.title || site.name;
  const description = normalized.description || pageConfig.description || seoDefaults.defaultDescription;

  const blocks = resolvePageBlocks(pageConfig);
  const pageKind = slugPath === '/' ? 'home' : 'inner';
  const content = renderBlocks(blocks, { ...normalized, slug: slugPath, pageKind });

  const jsonLd = buildJsonLd(pageConfig, contentData, slugPath);

  const head = buildHead({
    title: title.includes('Culture Travel') || title.includes('Культура') ? title : `${title}${seoDefaults.titleSuffix || ''}`,
    description,
    slug: slugPath,
    pageKind,
    robots: pageConfig.robots === 'noindex' ? 'noindex, follow' : 'index, follow',
    ogImage: normalized.ogImage || normalized.coverImage || normalized.cover || seoDefaults.defaultOgImage,
    ogType: pageConfig.ogType || 'website',
    jsonLd,
  });

  const bp = site.basePath || '';
  const scripts = `<script type="module" src="${bp}/core/init.js?v=${BUILD_ID}"></script>`;

  const html = layoutTemplate
    .replace('{{lang}}', site.language || 'ru')
    .replace('{{basePath}}', site.basePath || '')
    .replace('{{pageKind}}', pageKind)
    .replace('{{head}}', head)
    .replace('{{content}}', `<main id="main">${content}</main>`)
    .replace('{{scripts}}', scripts);

  const outPath = slugToDistPath(slugPath);
  writeOut(outPath, html);

  sitemapEntries.push({
    slug: slugPath,
    title,
    lastmod: contentData.published || contentData.date || new Date().toISOString().slice(0, 10),
    noindex: pageConfig.robots === 'noindex' || slugPath === '/404/',
  });

  return outPath;
}

function buildJsonLd(pageConfig, contentData, slugPath) {
  const schemas = [seoDefaults.organization];

  // Главная: Person schema для «Обо мне» (drawer в DOM + structured data)
  if (slugPath === '/' && seoDefaults.person) {
    const person = {
      ...seoDefaults.person,
      email: site.contacts?.email || undefined,
      telephone: site.contacts?.phone || undefined,
    };
    schemas.push(person);
  }

  if (pageConfig.template === 'case' || pageConfig.type === 'case') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: contentData.title,
      description: contentData.subtitle || contentData.description,
      url: fullUrl(slugPath),
      datePublished: contentData.published,
      author: { '@type': 'Person', name: site.author?.name },
    });
  }

  if (pageConfig.template === 'news' || pageConfig.type === 'news') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: contentData.title,
      description: contentData.excerpt,
      url: fullUrl(slugPath),
      datePublished: contentData.date,
      author: { '@type': 'Person', name: site.author?.name },
    });
  }

  const crumbs = breadcrumbSchema(
    slugPath,
    contentData.crumbTitle || contentData.seo?.title?.replace(/\s*\|\s*Culture Travel$/, '') || contentData.title || pageConfig.title
  );
  if (crumbs) schemas.push(crumbs);

  return schemas;
}

function breadcrumbSchema(slugPath, pageTitle) {
  const parts = slugPath.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
  if (!parts.length) return null;

  const labels = {
    news: 'Новости',
    cases: 'Кейсы',
    hotels: 'Отели',
    cruises: 'Круизы',
    tours: 'Авторские туры',
    services: 'Услуги',
    privacy: 'Политика конфиденциальности',
    contact: 'Контакт',
    notice: 'Правовая информация',
  };
  const sectionHome = {
    cases: '/#cases',
    news: '/#news',
    hotels: '/hotels/',
    cruises: '/cruises/',
    tours: '/tours/',
    services: '/#services',
  };

  const items = [{ '@type': 'ListItem', position: 1, name: 'Главная', item: fullUrl('/') }];

  let acc = '';
  parts.forEach((part, i) => {
    acc += `/${part}`;
    const isLast = i === parts.length - 1;
    const sectionUrl = sectionHome[part];
    items.push({
      '@type': 'ListItem',
      position: i + 2,
      name: isLast ? pageTitle : (labels[part] || part),
      item: fullUrl(isLast ? `${acc}/` : (sectionUrl || `${acc}/`)),
    });
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

function loadContentPages(contentDir, templateName, urlPrefix) {
  const dir = join(ROOT, contentDir);
  if (!existsSync(dir)) return;

  const template = PAGE_TEMPLATES[templateName];
  const files = readdirSync(dir).filter((f) => f.endsWith('.json') && !f.startsWith('_') && f !== 'index.json');

  for (const file of files) {
    const data = readJson(join(contentDir, file));
    const slug = data.slug || file.replace('.json', '');
    const slugPath = `/${urlPrefix}/${slug}/`;

    buildPage(
      {
        ...template,
        slug: slugPath,
        type: templateName,
        blocks: data.blocks || template.blocks,
      },
      {
        ...data,
        slugPath,
        title: data.seo?.title?.replace(/\s*\|\s*Culture Travel$/, '') || data.title || data.name,
      },
    );
    console.log(`  ✓ ${slugPath}`);
  }
}

function loadManualPages() {
  const pagesDir = join(ROOT, 'pages');
  if (!existsSync(pagesDir)) return;

  const files = readdirSync(pagesDir).filter((f) => f.endsWith('.page.json'));
  for (const file of files) {
    const page = readJson(join('pages', file));
    buildPage(page);
    console.log(`  ✓ ${page.slug || '/'}`);
  }
}

/** Список /news/ убран — старый URL редиректит на главную #news */
function writeNewsIndexRedirect() {
  const bp = (site.basePath || '').replace(/\/$/, '');
  const target = `${bp}/#news` || '/#news';
  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=${target}">
  <link rel="canonical" href="${fullUrl('/#news')}">
  <title>Новости</title>
  <script>location.replace(${JSON.stringify(target)});</script>
</head>
<body>
  <p><a href="${target}">Новости</a></p>
</body>
</html>
`;
  writeOut('news/index.html', html);
  console.log('  ✓ /news/ → /#news (redirect)');
}

function copyStaticAssets() {
  const dirs = ['assets', 'styles', 'core'];
  for (const dir of dirs) {
    const src = join(ROOT, dir);
    if (existsSync(src)) {
      cpSync(src, join(DIST, dir), { recursive: true });
    }
  }

  // JS блоков (HTML/CSS не копируем — они инлайнятся/подключаются через styles)
  const blocksDir = join(ROOT, 'blocks');
  if (existsSync(blocksDir)) {
    cpSync(blocksDir, join(DIST, 'blocks'), { recursive: true, filter: (src) => !src.endsWith('.html') });
  }

  const blocksSecondaryDir = join(ROOT, 'blocks-secondary');
  if (existsSync(blocksSecondaryDir)) {
    cpSync(blocksSecondaryDir, join(DIST, 'blocks-secondary'), {
      recursive: true,
      filter: (src) => !src.endsWith('.html'),
    });
  }

  bustModuleImports();
}

function bustModuleImports() {
  const pattern = /(from\s+['"][^'"]+\.js)(['"])/g;
  function walk(dir) {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (!name.endsWith('.js')) continue;
      const text = readFileSync(full, 'utf8');
      const updated = text.replace(pattern, `$1?v=${BUILD_ID}$2`);
      if (updated !== text) writeFileSync(full, updated, 'utf8');
    }
  }
  walk(join(DIST, 'core'));
  walk(join(DIST, 'blocks'));
  walk(join(DIST, 'blocks-secondary'));
}

function generateRobots() {
  /* Для краулеров: что можно индексировать и где лежит sitemap. */
  writeOut('robots.txt', `User-agent: *
Allow: /

Sitemap: ${fullUrl('/sitemap.xml')}
`);
}

function generateSitemap() {
  /* Список публичных URL для поисковиков. Без noindex (закрытая программа, 404). */
  const urls = sitemapEntries
    .filter((entry) => !entry.noindex)
    .map((entry) => {
    const loc = fullUrl(entry.slug);
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.slug === '/' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${entry.slug === '/' ? '1.0' : '0.8'}</priority>
  </url>`;
  }).join('\n');

  writeOut('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`);
}

function generateLlmsTxt() {
  /* Текстовая карта сайта для AI/поисковых ассистентов. Без noindex URL. */
  const sections = sitemapEntries
    .filter((e) => e.slug !== '/' && !e.noindex)
    .map((e) => `- [${e.title}](${fullUrl(e.slug)})`)
    .join('\n');

  const email = site.contacts?.email || '';
  const phone = site.contacts?.phone || '';
  const telegram = site.contacts?.telegram || site.social?.telegram || '';

  let tpl = read('seo/templates/llms.txt.template');
  tpl = tpl
    .replace(/\{\{#if email\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, body) => (email ? body : ''))
    .replace(/\{\{#if phone\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, body) => (phone ? body : ''))
    .replace(/\{\{siteName\}\}/g, site.name)
    .replace(/\{\{tagline\}\}/g, site.tagline)
    .replace(/\{\{defaultDescription\}\}/g, seoDefaults.defaultDescription)
    .replace(/\{\{sections\}\}/g, sections)
    .replace(/\{\{url\}\}/g, site.url.replace(/\/$/, ''))
    .replace(/\{\{email\}\}/g, email)
    .replace(/\{\{phone\}\}/g, phone)
    .replace(/\{\{telegram\}\}/g, telegram)
    .replace(/\{\{registryUrl\}\}/g, site.legal?.registryUrl || '');

  writeOut('llms.txt', tpl);
}

function generateWebManifest() {
  const bp = site.basePath || '';
  writeOut('site.webmanifest', JSON.stringify({
    name: site.name,
    short_name: 'Culture Travel',
    description: site.tagline,
    start_url: `${bp}/`,
    display: 'standalone',
    background_color: '#0d0d0d',
    theme_color: '#0d0d0d',
    lang: site.language,
  }, null, 2));
}

function generateConfigJs() {
  writeOut('core/site-config.js', `export const SITE = ${JSON.stringify(site, null, 2)};\n`);
}

function stripHtml(value = '') {
  return String(value).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function generateSearchIndex() {
  const items = [];
  const seen = new Set();
  const add = (item) => {
    const key = `${item.type}|${item.href}|${item.title}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push(item);
  };

  for (const caseItem of listContentJson('content/cases')) {
    if (!caseItem.slug) continue;
    const meta = caseItem.meta || {};
    const seo = caseItem.seo || {};
    add({
      type: 'case',
      kind: 'Авторский тур',
      kindEn: 'Private tour',
      title: caseItem.title || '',
      titleEn: caseItem.titleEn || '',
      text: [caseItem.subtitle, meta.route, seo.description].filter(Boolean).join(' '),
      textEn: seo.description || '',
      href: `/cases/${caseItem.slug}/`,
    });
  }

  const catalog = readJson('content/cases-slider/catalog.json');
  for (const group of Object.values(catalog.cases || {})) {
    for (const item of group || []) {
      add({
        type: 'case',
        kind: 'Авторский тур',
        kindEn: 'Private tour',
        title: item.title || '',
        titleEn: item.titleEn || '',
        text: item.text || '',
        textEn: item.textEn || '',
        href: item.slug ? `/cases/${item.slug}/` : '/#cases',
      });
    }
  }

  for (const news of listContentJson('content/news')) {
    if (!news.slug) continue;
    add({
      type: 'news',
      kind: 'Новость',
      kindEn: 'News',
      title: news.title || '',
      titleEn: news.titleEn || '',
      text: [news.excerpt, stripHtml(news.body || '')].filter(Boolean).join(' '),
      textEn: [news.excerptEn || news.excerpt, stripHtml(news.bodyEn || '')].filter(Boolean).join(' '),
      href: `/news/${news.slug}/`,
    });
  }

  for (const hotel of listContentJson('content/hotels')) {
    if (!hotel.slug) continue;
    add({
      type: 'hotel',
      kind: 'Отель',
      kindEn: 'Hotel',
      title: hotel.name || hotel.title || '',
      titleEn: hotel.nameEn || '',
      text: [hotel.location, hotel.description].filter(Boolean).join(' '),
      textEn: hotel.description || '',
      href: `/hotels/${hotel.slug}/`,
    });
  }

  const services = readJson('content/services/catalog.json');
  for (const item of services.items || []) {
    add({
      type: 'service',
      kind: 'Услуга',
      kindEn: 'Service',
      title: item.title || '',
      titleEn: item.titleEn || '',
      text: item.text || '',
      textEn: item.textEn || '',
      href: '/#services',
    });
  }

  const cruisesCatalog = readJson('content/cruises/catalog.json');
  for (const region of cruisesCatalog.regions || []) {
    if (!region?.id) continue;
    add({
      type: 'cruise',
      kind: 'Круиз',
      kindEn: 'Cruise',
      title: region.title || '',
      titleEn: region.titleEn || '',
      text: region.intro || '',
      textEn: region.introEn || '',
      href: `/cruises/#${region.id}`,
    });
    for (const cruise of region.cruises || []) {
      add({
        type: 'cruise',
        kind: 'Круиз',
        kindEn: 'Cruise',
        title: cruise.title || '',
        titleEn: cruise.titleEn || '',
        text: [cruise.route, cruise.ship, cruise.duration, cruise.season, cruise.note].filter(Boolean).join(' · '),
        textEn: [cruise.routeEn, cruise.ship, cruise.durationEn, cruise.seasonEn, cruise.noteEn].filter(Boolean).join(' · '),
        href: `/cruises/#${region.id}`,
      });
    }
  }

  [
    { type: 'page', kind: 'Раздел', kindEn: 'Page', title: 'Новости', titleEn: 'News', text: 'Новости и анонсы Culture Travel', textEn: 'News and announcements', href: '/#news' },
    { type: 'page', kind: 'Раздел', kindEn: 'Page', title: 'Круизы', titleEn: 'Cruises', text: 'Экспедиционные круизы Swan Hellenic', textEn: 'Swan Hellenic expedition cruises', href: '/cruises/' },
    { type: 'page', kind: 'Раздел', kindEn: 'Page', title: 'Отели', titleEn: 'Hotels', text: 'Каталог люкс-отелей', textEn: 'Luxury hotels catalogue', href: '/hotels/' },
    { type: 'page', kind: 'Раздел', kindEn: 'Page', title: 'Авторские туры', titleEn: 'Private tours', text: 'Авторские программы Culture Travel', textEn: 'Private Culture Travel programmes', href: '/tours/' },
    { type: 'page', kind: 'Раздел', kindEn: 'Page', title: 'Услуги', titleEn: 'Services', text: 'Премиальный сервис Culture Travel', textEn: 'Culture Travel concierge service', href: '/#services' },
    { type: 'page', kind: 'Раздел', kindEn: 'Page', title: 'Бизнес авиация', titleEn: 'Business aviation', text: 'Чартерные перелёты и VIP-авиация', textEn: 'Private charter flights', href: '/business-aviation/' },
    { type: 'page', kind: 'Раздел', kindEn: 'Page', title: 'Обо мне', titleEn: 'About', text: 'Анна Баглай — люкс-путешествия', textEn: 'Anna Baglay — luxury travel', href: '/#about' },
    { type: 'page', kind: 'Раздел', kindEn: 'Page', title: 'Кейсы', titleEn: 'Cases', text: 'Авторские маршруты и реализованные программы', textEn: 'Private itineraries and completed programmes', href: '/#cases' },
    { type: 'page', kind: 'Раздел', kindEn: 'Page', title: 'Отзывы', titleEn: 'Reviews', text: 'Отзывы гостей', textEn: 'Guest reviews', href: '/#reviews' },
  ].forEach(add);

  writeOut('search.json', `${JSON.stringify({ items }, null, 0)}\n`);
  console.log('  ✓ search.json');
}

function generate404() {
  /*
   * pages/404.page.json один раз собирает /404/index.html через loadManualPages().
   * GitHub Pages ждёт корневой 404.html для неизвестных URL — копируем сюда.
   */
  const gh404 = join(DIST, '404', 'index.html');
  if (existsSync(gh404)) {
    writeOut('404.html', readFileSync(gh404, 'utf8'));
    console.log('  ✓ 404.html (копия для GitHub Pages)');
  }
}

function generateBlocksCss() {
  const lines = [
    '/* Автогенерация tools/build.mjs — не править вручную */',
  ];

  for (const [type, meta] of Object.entries(blockRegistry.blocks)) {
    if (!meta.css) continue;
    const folder = blockFolder(type);
    const cssPath = join(ROOT, folder, type, `${type}.css`);
    if (existsSync(cssPath)) {
      lines.push(`@import url('../${folder}/${type}/${type}.css');`);
    }
  }

  writeFileSync(join(ROOT, 'styles/blocks.css'), `${lines.join('\n')}\n`, 'utf8');
}

function build() {
  console.log('🏗  Culture Travel — сборка сайта...\n');
  sitemapEntries.length = 0;

  generateBlocksCss();
  console.log('  ✓ styles/blocks.css (из registry)');

  if (existsSync(DIST)) rmSync(DIST, { recursive: true });
  ensureDir(DIST);
  writeOut('.nojekyll', '');

  // CNAME только при сборке под свой домен (без /repo basePath)
  if (process.env.CUSTOM_DOMAIN === 'true' && site.url.includes('culture-travel.ru')) {
    writeOut('CNAME', 'culture-travel.ru\n');
  }

  console.log('📄 Страницы:');
  loadManualPages();
  loadContentPages('content/cases', 'case', 'cases');
  loadContentPages('content/news', 'news', 'news');
  loadContentPages('content/hotels', 'hotel', 'hotels');

  writeNewsIndexRedirect();
  generate404();

  console.log('\n📦 Ассеты:');
  copyStaticAssets();
  generateConfigJs();
  generateSearchIndex();

  console.log('\n🔍 SEO:');
  generateRobots();
  generateSitemap();
  generateLlmsTxt();
  generateWebManifest();
  console.log('  ✓ robots.txt, sitemap.xml, llms.txt, site.webmanifest');

  console.log(`\n✅ Сборка завершена → dist/ (${sitemapEntries.length} страниц)\n`);
}

build();

if (isWatch) {
  console.log('👀 Watch mode — отслеживание изменений...\n');
  watch(ROOT, { recursive: true }, (_, filename) => {
    if (!filename || filename.startsWith('dist') || filename.includes('node_modules')) return;
    console.log(`\n🔄 Изменение: ${filename}`);
    try {
      build();
    } catch (err) {
      console.error(err);
    }
  });
}

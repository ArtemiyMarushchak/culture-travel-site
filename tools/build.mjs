#!/usr/bin/env node
/**
 * Culture Travel — static site builder
 * Generates clean URLs: /cases/safari/ → dist/cases/safari/index.html
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, statSync, existsSync, watch } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const isWatch = process.argv.includes('--watch');

const site = JSON.parse(readFileSync(join(ROOT, 'core/site.json'), 'utf8'));

if (process.env.GITHUB_PAGES === 'true' && process.env.GITHUB_REPOSITORY) {
  const [, repoName] = process.env.GITHUB_REPOSITORY.split('/');
  site.url = `https://${process.env.GITHUB_REPOSITORY_OWNER}.github.io`;
  site.basePath = `/${repoName}`;
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
  return `${base}${bp}${p === '/' ? '' : p}`.replace(/([^:]\/)\/+/g, '$1') || base;
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

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
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

  const basePath = site.basePath || '';
  if (body.includes('{{basePath}}')) {
    body = body.replace(/\{\{basePath\}\}/g, basePath);
  }

  return {
    ...data,
    body,
    cover,
    coverImage: data.coverImage || cover,
    dateIso: data.date || data.published || '',
    dateFormatted: formatDate(data.date || data.published),
    email: site.contacts?.email || 'info@culture-travel.ru',
    year: String(new Date().getFullYear()),
    basePath: site.basePath || '',
    title: data.seo?.title?.replace(/\s*\|\s*Culture Travel$/, '') || data.title,
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
      subtitle: c.subtitle || '',
      cover: c.cover?.image || c.cover || '/assets/images/placeholder.svg',
    }));
}

function prepareServicesCatalog() {
  const catalog = readJson('content/services/catalog.json');
  const items = (catalog.items || []).map((item, index) => ({
    ...item,
    indexPad: String(index + 1).padStart(2, '0'),
    short: item.short || item.title || '',
    shortEn: item.shortEn || item.titleEn || '',
    image: item.image || '/assets/images/placeholder.svg',
    activeClass: index === 0 ? ' is-active' : '',
    coverClass: item.cover ? ' is-cover' : '',
    expanded: index === 0 ? 'true' : 'false',
    ariaHidden: index === 0 ? 'false' : 'true',
  }));
  const first = items[0] || {};
  return {
    overline: catalog.overline || '',
    overlineEn: catalog.overlineEn || '',
    title: catalog.title || '',
    titleEn: catalog.titleEn || '',
    lead: catalog.lead || '',
    leadEn: catalog.leadEn || '',
    items,
    itemCount: items.length,
    firstTitle: first.title || '',
    firstTitleEn: first.titleEn || '',
    firstText: first.text || '',
    firstTextEn: first.textEn || '',
    firstImage: first.image || '/assets/images/placeholder.svg',
  };
}

function prepareReviewsCatalog() {
  const catalog = readJson('content/reviews/catalog.json');
  const yandexUrl = catalog.platforms?.yandex?.reviewUrl || site.reviews?.yandexUrl || '';
  return {
    overline: catalog.overline || '',
    overlineEn: catalog.overlineEn || '',
    title: catalog.title || '',
    titleEn: catalog.titleEn || '',
    lead: catalog.lead || '',
    leadEn: catalog.leadEn || '',
    tabSiteLabel: catalog.tabs?.site || 'Отзывы гостей',
    tabSiteLabelEn: catalog.tabs?.siteEn || 'Guest reviews',
    tabYandexLabel: catalog.tabs?.yandex || 'Яндекс',
    tabYandexLabelEn: catalog.tabs?.yandexEn || 'Yandex',
    siteNote: catalog.siteNote || '',
    siteNoteEn: catalog.siteNoteEn || '',
    items: catalog.items || [],
    ctaTitle: catalog.cta?.title || '',
    ctaTitleEn: catalog.cta?.titleEn || '',
    ctaText: catalog.cta?.text || '',
    ctaTextEn: catalog.cta?.textEn || '',
    ctaButton: catalog.cta?.button || '',
    ctaButtonEn: catalog.cta?.buttonEn || '',
    widgetNote: catalog.platforms?.yandex?.widgetNote || '',
    widgetNoteEn: catalog.platforms?.yandex?.widgetNoteEn || '',
    yandexReviewUrl: yandexUrl || '#',
    yandexBtnClass: yandexUrl ? '' : ' rv__btn--soon',
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
      excerpt: n.excerpt || '',
      cover: n.cover?.image || n.cover || '/assets/images/placeholder.svg',
      dateIso: n.date,
      dateFormatted: formatDate(n.date),
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
  if (prepare === 'reviewsCatalog' || block.type === 'reviews') {
    Object.assign(data, prepareReviewsCatalog());
  }
  if (prepare === 'casesFeatured' || source === 'content/cases') {
    data.items = prepareCasesFeatured();
  }
  if (prepare === 'newsList' || source === 'content/news' || block.type === 'news-list') {
    data.items = prepareNewsList();
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
    return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
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
    return `<!-- missing block: ${blockType} -->`;
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
    telegramHandle: telegramHandle(site.contacts?.telegram || site.social?.telegram || ''),
    email: site.contacts?.email || '',
    registryUrl: site.legal?.registryUrl || '',
    legalCompanyName: site.legal?.companyName || '',
    inn: site.legal?.inn || '',
    ogrn: site.legal?.ogrn || '',
    developerName: site.developer?.name || '',
    developerUrl: site.developer?.url || '',
    year: String(new Date().getFullYear()),
    nav: blockData.nav,
  };

  if (blockType === 'header') {
    const navAll = readJson('core/nav.json');
    const newsN = listContentJson('content/news').length;
    const newsCount = newsN ? `+${newsN}` : '';
    merged.newsCount = newsCount;
    merged.nav = navAll.filter((item) => !item.aside);
    merged.navAside = navAll
      .filter((item) => item.aside)
      .map((item) => ({ ...item, newsCount }));
  }
  const rawFields = ['body', 'content', 'casesJson', 'hotelsJson', 'mediaJson'];
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

  // Simple {{key}} replacement
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
    jsonLd,
  }, new Set(['jsonLd']));
}

function buildPage(pageConfig, contentData = {}) {
  const normalized = normalizeContentData({
    ...contentData,
    ...(pageConfig.data || {}),
    title: contentData.seo?.title || contentData.title || pageConfig.title,
    description: contentData.seo?.description || contentData.excerpt || contentData.subtitle || pageConfig.description,
  });

  const slug = pageConfig.slug || contentData.slugPath || '/';
  const normalizedSlug = slug.startsWith('/') ? slug : `/${slug}`;
  const slugPath = normalizedSlug.endsWith('/') || normalizedSlug === '/' ? normalizedSlug : `${normalizedSlug}/`;

  const title = normalized.title || pageConfig.title || site.name;
  const description = normalized.description || pageConfig.description || seoDefaults.defaultDescription;

  const blocks = resolvePageBlocks(pageConfig);
  const content = renderBlocks(blocks, { ...normalized, slug: slugPath });

  const jsonLd = buildJsonLd(pageConfig, contentData, slugPath);

  const head = buildHead({
    title: title.includes('Culture Travel') || title.includes('Культура') ? title : `${title}${seoDefaults.titleSuffix || ''}`,
    description,
    slug: slugPath,
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

  const crumbs = breadcrumbSchema(slugPath, contentData.title || pageConfig.title);
  if (crumbs) schemas.push(crumbs);

  return schemas;
}

function breadcrumbSchema(slugPath, pageTitle) {
  const parts = slugPath.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
  if (!parts.length) return null;

  const labels = { news: 'Новости', cases: 'Кейсы', hotels: 'Отели', privacy: 'Политика конфиденциальности' };

  const items = [{ '@type': 'ListItem', position: 1, name: 'Главная', item: fullUrl('/') }];

  let acc = '';
  parts.forEach((part, i) => {
    acc += `/${part}`;
    const isLast = i === parts.length - 1;
    items.push({
      '@type': 'ListItem',
      position: i + 2,
      name: isLast ? pageTitle : (labels[part] || part),
      item: fullUrl(`${acc}/`),
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

function copyStaticAssets() {
  const dirs = ['assets', 'styles', 'core'];
  for (const dir of dirs) {
    const src = join(ROOT, dir);
    if (existsSync(src)) {
      cpSync(src, join(DIST, dir), { recursive: true });
    }
  }

  // Blocks JS (not HTML/CSS — those are inlined/bundled via styles)
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
  writeOut('robots.txt', `User-agent: *
Allow: /

Sitemap: ${fullUrl('/sitemap.xml')}
`);
}

function generateSitemap() {
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
  const sections = sitemapEntries
    .filter((e) => e.slug !== '/')
    .map((e) => `- ${fullUrl(e.slug)} — ${e.title}`)
    .join('\n');

  let tpl = read('seo/templates/llms.txt.template');
  tpl = tpl
    .replace(/\{\{siteName\}\}/g, site.name)
    .replace(/\{\{tagline\}\}/g, site.tagline)
    .replace(/\{\{defaultDescription\}\}/g, seoDefaults.defaultDescription)
    .replace(/\{\{sections\}\}/g, sections)
    .replace(/\{\{url\}\}/g, site.url)
    .replace(/\{\{email\}\}/g, site.contacts?.email || '')
    .replace(/\{\{phone\}\}/g, site.contacts?.phone || '')
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
      textEn: news.excerpt || '',
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

  [
    { type: 'page', kind: 'Раздел', kindEn: 'Page', title: 'Новости', titleEn: 'News', text: 'Новости и анонсы Culture Travel', textEn: 'News and announcements', href: '/news/' },
    { type: 'page', kind: 'Раздел', kindEn: 'Page', title: 'Отели', titleEn: 'Hotels', text: 'Каталог люкс-отелей', textEn: 'Luxury hotels catalogue', href: '/hotels/' },
    { type: 'page', kind: 'Раздел', kindEn: 'Page', title: 'Авторские туры', titleEn: 'Private tours', text: 'Авторские программы Culture Travel', textEn: 'Private Culture Travel programmes', href: '/tours/' },
    { type: 'page', kind: 'Раздел', kindEn: 'Page', title: 'Услуги', titleEn: 'Services', text: 'Премиальный сервис Culture Travel', textEn: 'Culture Travel concierge service', href: '/#services' },
    { type: 'page', kind: 'Раздел', kindEn: 'Page', title: 'Круизы', titleEn: 'Cruises', text: 'Морские и речные программы', textEn: 'Sea and river programmes', href: '/cruises/' },
    { type: 'page', kind: 'Раздел', kindEn: 'Page', title: 'Бизнес авиация', titleEn: 'Business aviation', text: 'Чартерные перелёты и VIP-авиация', textEn: 'Private charter flights', href: '/business-aviation/' },
    { type: 'page', kind: 'Раздел', kindEn: 'Page', title: 'Обо мне', titleEn: 'About', text: 'Анна Баглай — люкс-путешествия', textEn: 'Anna Baglay — luxury travel', href: '/#about' },
    { type: 'page', kind: 'Раздел', kindEn: 'Page', title: 'Кейсы', titleEn: 'Cases', text: 'Авторские маршруты и реализованные программы', textEn: 'Private itineraries and completed programmes', href: '/#cases' },
    { type: 'page', kind: 'Раздел', kindEn: 'Page', title: 'Отзывы', titleEn: 'Reviews', text: 'Отзывы гостей', textEn: 'Guest reviews', href: '/#reviews' },
  ].forEach(add);

  writeOut('search.json', `${JSON.stringify({ items }, null, 0)}\n`);
  console.log('  ✓ search.json');
}

function generate404() {
  const page = existsSync(join(ROOT, 'pages/404.page.json'))
    ? readJson('pages/404.page.json')
    : {
        slug: '/404/',
        title: 'Страница не найдена',
        description: 'Запрашиваемая страница не существует.',
        blocks: [{ type: 'error-404' }],
      };
  buildPage(page);

  // GitHub Pages и nginx ищут 404.html в корне
  const gh404 = join(DIST, '404', 'index.html');
  if (existsSync(gh404)) {
    writeOut('404.html', readFileSync(gh404, 'utf8'));
  }
}

function generateBlocksCss() {
  const lines = [
    '/* Auto-generated by tools/build.mjs — do not edit manually */',
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

  // CNAME for custom domain (GitHub Pages)
  if (site.url.includes('culture-travel.ru')) {
    writeOut('CNAME', 'culture-travel.ru');
  }

  console.log('📄 Страницы:');
  loadManualPages();
  loadContentPages('content/cases', 'case', 'cases');
  loadContentPages('content/news', 'news', 'news');
  loadContentPages('content/hotels', 'hotel', 'hotels');

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

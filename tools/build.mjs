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
const seoDefaults = JSON.parse(readFileSync(join(ROOT, 'seo/defaults.json'), 'utf8'));
const layoutTemplate = readFileSync(join(ROOT, 'layouts/default.html'), 'utf8');
const headTemplate = readFileSync(join(ROOT, 'seo/templates/head.html'), 'utf8');

const PAGE_TEMPLATES = {
  case: JSON.parse(readFileSync(join(ROOT, 'templates/case.page.json'), 'utf8')),
  news: JSON.parse(readFileSync(join(ROOT, 'templates/news.page.json'), 'utf8')),
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

function interpolate(template, data) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => escapeHtml(data[key] ?? ''));
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
  return {
    ...data,
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
  return listContentJson('content/hotels').map((hotel) => ({
    ...hotel,
    themes: (hotel.themes || []).join(','),
    mediaJson: JSON.stringify(hotel.media || []).replace(/'/g, '&#39;'),
  }));
}

function prepareCasesFeatured() {
  return listContentJson('content/cases')
    .filter((c) => c.featured !== false)
    .map((c) => ({
      slug: c.slug,
      title: c.title,
      subtitle: c.subtitle || '',
      cover: c.cover?.image || c.cover || '/assets/images/placeholder.webp',
    }));
}

function prepareNewsList() {
  return listContentJson('content/news')
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .map((n) => ({
      slug: n.slug,
      title: n.title,
      excerpt: n.excerpt || '',
      dateIso: n.date,
      dateFormatted: formatDate(n.date),
    }));
}

function resolveBlockData(block, pageData) {
  const data = { ...pageData, ...(block.data || {}) };

  if (block.data?.source === 'content/cases' || block.type === 'cases-slider') {
    data.items = prepareCasesFeatured();
  }
  if (block.data?.source === 'content/news' || block.type === 'news-list') {
    data.items = prepareNewsList();
  }
  if (block.data?.source === 'content/hotels' || block.type === 'hotel-catalog') {
    data.items = prepareHotelsCatalog();
    data.hotelsJson = JSON.stringify(listContentJson('content/hotels'));
  }

  return normalizeContentData(data);
}

function loadBlockHtml(blockType, blockData = {}) {
  const htmlPath = join(ROOT, 'blocks', blockType, `${blockType}.html`);
  if (!existsSync(htmlPath)) {
    console.warn(`  ⚠ Block not found: ${blockType}`);
    return `<!-- missing block: ${blockType} -->`;
  }
  let html = readFileSync(htmlPath, 'utf8');

  const merged = { ...blockData, basePath: site.basePath || '' };
  const rawFields = ['body', 'content'];

  // Simple {{key}} replacement
  html = html.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (rawFields.includes(key) && merged[key]) return String(merged[key]);
    return escapeHtml(String(merged[key] ?? ''));
  });

  // {{#each array}}...{{/each}}
  html = html.replace(/\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, key, itemTpl) => {
    const arr = merged[key];
    if (!Array.isArray(arr)) return '';
    return arr.map((item, i) => {
      const ctx = typeof item === 'object' ? { ...merged, ...item, index: i } : { ...merged, item, index: i };
      return itemTpl.replace(/\{\{(\w+)\}\}/g, (__, k) => escapeHtml(String(ctx[k] ?? '')));
    }).join('');
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
    ogType: meta.ogType || 'website',
    siteName: site.name,
    ogTitle: meta.ogTitle || title,
    ogDescription: meta.ogDescription || description,
    ogUrl: canonical,
    ogImage: fullUrl(meta.ogImage || seoDefaults.defaultOgImage),
    locale: site.locale || 'ru_RU',
    basePath: bp,
    jsonLd,
  });
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

  const blocks = pageConfig.blocks || [];
  const content = renderBlocks(blocks, { ...normalized, slug: slugPath });

  const jsonLd = buildJsonLd(pageConfig, contentData, slugPath);

  const head = buildHead({
    title: title.includes('Culture Travel') ? title : `${title}${seoDefaults.titleSuffix || ''}`,
    description,
    slug: slugPath,
    ogImage: normalized.ogImage || normalized.coverImage || normalized.cover || seoDefaults.defaultOgImage,
    ogType: pageConfig.ogType || 'website',
    jsonLd,
  });

  const bp = site.basePath || '';
  const scripts = `<script type="module" src="${bp}/core/init.js"></script>`;

  const html = layoutTemplate
    .replace('{{lang}}', site.language || 'ru')
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
      { ...template, slug: slugPath, type: templateName },
      { ...data, slugPath }
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
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    lang: site.language,
  }, null, 2));
}

function generateConfigJs() {
  writeOut('core/site-config.js', `export const SITE = ${JSON.stringify(site, null, 2)};\n`);
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

function build() {
  console.log('🏗  Culture Travel — сборка сайта...\n');
  sitemapEntries.length = 0;

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

  generate404();

  console.log('\n📦 Ассеты:');
  copyStaticAssets();
  generateConfigJs();

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

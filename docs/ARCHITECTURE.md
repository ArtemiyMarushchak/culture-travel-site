# Архитектура Culture Travel

> Статический сайт: **JSON + блоки + ядро → build → dist/**  
> Без React/Vue. Блочная система как Zero Block в Tilda, но под полный контроль.

---

## Принципы

1. **Блок = независимая папка** — html, css, опционально js
2. **Страница = список блоков** в JSON — не трогаем HTML вручную
3. **Ядро** — один `core/site.json`, реестр блоков, один `init.js`
4. **SEO на этапе сборки** — title, meta, JSON-LD, sitemap, robots
5. **Токены CSS** — только `var(--…)`, см. `styles/tokens/`

---

## Схема сборки

```
core/site.json          ← бренд, контакты, SEO
core/nav.json           ← меню шапки
core/blocks.registry.json ← метаданные всех блоков

pages/*.page.json       ← статические страницы (главная, отели…)
templates/*.page.json   ← шаблон для content (кейс, новость)
content/*/*.json        ← контент (кейсы, новости, отели)

        │
        ▼
  tools/build.mjs   (или tools/build.py)
        │
        ├── inline block HTML в страницу
        ├── head + JSON-LD (raw, без HTML-escape) + canonical
        ├── styles/blocks.css (из registry)
        ├── copy assets / styles / core / blocks/*.js
        └── robots.txt, sitemap.xml, llms.txt

        ▼
      dist/               ← GitHub Pages / хостинг

Браузер:
  styles/main.css  +  core/init.js  →  [data-block] → registry.js
```

---

## Папки

| Папка | Назначение |
|-------|------------|
| `core/` | Ядро: конфиг, реестр, init, anchors |
| `blocks/` | UI-блоки (html + css + js) |
| `pages/` | Конфиг страниц (`*.page.json`) |
| `templates/` | Шаблоны для content-страниц |
| `content/` | JSON-контент (редактор правит здесь) |
| `styles/tokens/` | CSS-переменные (цвета, типографика, spacing) |
| `styles/ui/` | UI-классы (.ui-h1, .ui-stack…) |
| `seo/` | defaults + шаблон head |
| `layouts/` | Оболочка HTML (`default.html`) |
| `tools/` | build.mjs / build.py, preview |
| `dist/` | Результат сборки (не коммитить) |
| `preview/` | Превью дизайн-системы (не в dist) |
| `content/cases-slider/` | Каталог слайдера кейсов на главной |

---

## Блок

```
blocks/header/
  header.html    ← разметка, {{placeholders}}
  header.css     ← стили блока
  header.js      ← export function initHeader(root)
```

**Контракт HTML:**
- Корневой элемент: `data-block="header"` (имя папки)
- Плейсхолдеры: `{{basePath}}`, `{{telegram}}`, `{{#each nav}}…{{/each}}`

**Регистрация:**
1. Добавить запись в `core/blocks.registry.json` (`css`, `js`, `dataSource`…)
2. Если есть JS — добавить `init` в `core/registry.js` → `blockInits`
3. Запустить `node tools/build.mjs` — `styles/blocks.css` обновится сам

---

## Реестр блоков

`core/blocks.registry.json` — единый каталог:

```json
{
  "blocks": {
    "cases-slider": {
      "label": "Кейсы — слайдер",
      "css": true,
      "js": true,
      "dataSource": "content/cases",
      "dataPrepare": "casesFeatured"
    }
  }
}
```

Build автоматически:
- подтягивает `items` из `content/` по `dataSource`
- собирает `@import` в `styles/blocks.css`

---

## Страница

`pages/index.page.json`:

```json
{
  "slug": "/",
  "title": "…",
  "description": "…",
  "blocks": [
    { "type": "header" },
    { "type": "hero-video" },
    { "type": "about" },
    { "type": "cases-slider", "data": { "source": "content/cases" } },
    { "type": "footer" },
    { "type": "modal" }
  ]
}
```

Content-страницы: `content/cases/safari.json` + `templates/case.page.json` → `/cases/safari/`

---

## SEO (быстро и на этапе build)

| Что | Где |
|-----|-----|
| Title, description | `pages/*.page.json` или `content/*` → `seo.title` |
| Суффикс, дефолты | `core/site.json` → `seo` |
| `<head>` | `seo/templates/head.html` |
| JSON-LD | build: Organization + Article/NewsArticle + Breadcrumb |
| `robots` | `pages/404.page.json` → `"robots": "noindex"` |
| sitemap.xml | все страницы кроме noindex |
| robots.txt, llms.txt | генерируются build |

**Правило:** всё SEO — в HTML после сборки. CDN отдаёт готовый статик.

---

## Ядро в браузере

```
core/init.js
  → core/registry.js (blockInits)
  → core/anchors.js (якоря главной)
  → core/video-overlay.js (hero + about scroll)
```

Сканирует `[data-block]` на странице и вызывает нужный `init*`.

---

## Команды

```bash
# Сборка
node tools/build.mjs

# Watch (пересборка при изменениях)
node tools/build.mjs --watch

# Превью dist
node tools/preview.mjs   # → :4173

# Превью дизайн-системы (из корня проекта)
python3 -m http.server 8765
# → http://127.0.0.1:8765/preview/tokens.html
```

---

## Добавить новый блок (чеклист)

- [ ] Папка `blocks/my-block/` (html, css, js?)
- [ ] Запись в `core/blocks.registry.json`
- [ ] JS init в `core/registry.js` (если нужен)
- [ ] Блок в нужный `pages/*.page.json`
- [ ] `node tools/build.mjs`
- [ ] Проверить в dist

---

## Что дальше (завтра+)

- [ ] Починить footer, about под дизайн-систему
- [ ] Валидация JSON страниц/блоков при build
- [ ] Один источник якорей (nav.json ↔ anchors.js)
- [ ] Per-page og:image из content
- [ ] Монорепо / CI — когда будете готовы к деплою

См. также: `docs/EDITING.md`, `docs/TOKENS-CHECKLIST.md`, `styles/README.md`

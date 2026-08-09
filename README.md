# Culture Travel — корпоративный сайт

Статический сайт VIP туристической компании. HTML + CSS + Vanilla JS, без фреймворков.

**Production URL:** [culture-travel.ru](https://culture-travel.ru)

---

## Быстрый старт

```bash
# Сборка (нужен Node.js 18+)
node tools/build.mjs

# Локальный просмотр
node tools/build.mjs && node tools/preview.mjs
# → http://localhost:4173
```

Если Node не установлен глобально — в проекте есть portable-версия в `.tools/` (не коммитится).

---

## Структура проекта

```
blocks/          ← UI-блоки (html + css + js) — как Zero Block в Tilda
content/         ← JSON-контент (кейсы, новости, отели)
pages/           ← конфигурация страниц
templates/       ← шаблоны для JSON-страниц
styles/          ← дизайн-система (токены, reset, base)
core/            ← ядро (config, init.js)
seo/             ← SEO-шаблоны
tools/           ← сборщик build.mjs
dist/            ← результат сборки → GitHub Pages
```

---

## Чистые URL (без index.html)

| URL | Файл |
|-----|------|
| `/` | `dist/index.html` |
| `/news/welcome/` | `dist/news/welcome/index.html` |
| `/cases/example-case/` | `dist/cases/example-case/index.html` |
| `/hotels/` | `dist/hotels/index.html` |

Ссылки **всегда** с trailing slash: `/news/welcome/` — никогда `/index.html`.

---

## Документация

| Файл | Описание |
|------|----------|
| [docs/EDITING.md](docs/EDITING.md) | Как редактировать контент через GitHub |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Деплой на GitHub Pages и свой сервер |
| [docs/SECURITY.md](docs/SECURITY.md) | Безопасность репозитория |

---

## GitHub Pages

- Деплой автоматический при push в `main`
- Workflow: `.github/workflows/deploy.yml`
- **Приватный репозиторий + Pages** — нужен GitHub Pro (или Team)

### Первоначальная настройка Pages

1. GitHub → Settings → Pages
2. Source: **GitHub Actions**
3. После первого push в `main` — сайт соберётся автоматически

### Свой домен

1. DNS: `CNAME culture-travel.ru` → `your-username.github.io`
2. GitHub → Settings → Pages → Custom domain → `culture-travel.ru`
3. Build автоматически создаёт файл `CNAME`

---

## Настройки сайта

Все глобальные настройки: **`core/site.json`**

- Контакты, реквизиты, соцсети
- URL сайта, basePath
- SEO defaults

После изменения — пересобрать: `node tools/build.mjs`

---

## Экосистема (будущее)

| Репозиторий | Статус |
|-------------|--------|
| `culture-travel-site` | **сейчас** |
| `culture-travel-crm` | сентябрь 2026 |
| `culture-travel-client` | позже |
| `culture-travel-docs` | позже |

---

## Лицензия

Proprietary — © Culture Travel. Все права защищены.

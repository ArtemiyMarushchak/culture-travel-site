# Культура Путешествий — culture-travel.ru

Официальный сайт. Статика: **HTML + CSS + JS** → сборка → **GitHub Pages**.  
Код — собственность правообладателя ([LICENSE](LICENSE)).

---

## Как устроен проект (одним взглядом)

```
Правите контент (JSON / HTML / фото)
        ↓
node tools/build.mjs   →   папка dist/
        ↓
push в main   →   GitHub Actions публикует сайт
```

| Папка | Зачем |
|-------|--------|
| `content/` | Отзывы, новости, кейсы, услуги, отели |
| `assets/` | Фото, видео, флаги, логотипы, шрифт |
| `pages/` | Страницы сайта (`*.page.json`) |
| `blocks/` | Вёрстка секций (обычно не трогать) |
| `core/` | Контакты, меню, настройки (`site.json`, `nav.json`) |
| `docs/` | Только 2 файла: как править контент и медиа |
| `tools/` | Сборка и локальный просмотр |
| `dist/` | Готовый сайт — **руками не править** |

---

## Локально: build и preview

Нужен **Node.js 18+** (Python в проекте **нет** и не нужен).

```bash
node tools/build.mjs      # собрать сайт в dist/
node tools/preview.mjs    # открыть локальный просмотр собранного dist/
```

Или одной командой: `npm run preview`.

| Команда | Что делает |
|---------|------------|
| `build.mjs` | Читает `pages` + `content` + блоки → пишет HTML/CSS/JS в `dist/`, плюс `robots.txt`, `sitemap.xml`, `llms.txt` |
| `preview.mjs` | Поднимает простой локальный сервер, чтобы смотреть `dist/` в браузере |

После правок JSON/фото всегда снова `build` (или push — на GitHub соберёт сам).

---

## Куда что класть (админка через GitHub)

| Задача | Файл / папка |
|--------|----------------|
| Телефон, email, Telegram, реквизиты | `core/site.json` |
| Пункты меню | `core/nav.json` |
| Отзывы | `content/reviews/catalog.json` |
| Новости | `content/news/` + фото в `assets/images/news/` |
| Услуги | `content/services/catalog.json` + `assets/images/services/` |
| Слайдер кейсов | `content/cases-slider/catalog.json` |
| Программа тура | `content/cases/...` + `assets/images/cases/` |
| Отели (черновик = имя с `_`) | `content/hotels/` |

Подробно с примерами JSON: **[docs/ADMIN.md](docs/ADMIN.md)**  
Форматы фото / флаги / видео: **[docs/ASSETS.md](docs/ASSETS.md)**

Заглушки `/cruises/`, `/tours/`, `/hotels/` — «в разработке», в поиск не попадают (`noindex`), пока не наполните.

---

## SEO (что уже есть)

- `robots.txt` — разрешает индексацию, указывает sitemap  
- `sitemap.xml` — список публичных страниц  
- `llms.txt` — карта сайта для AI (Markdown + ссылки)  
- У каждой страницы: title, description, Open Graph  
- Канонические URL на `https://culture-travel.ru`

**Почему «Google не нашёл» сразу:** домен только что переехал с Тильды. Поиск обновляется днями/неделями.  
Сделайте в [Google Search Console](https://search.google.com/search-console): добавьте `culture-travel.ru` → отправьте `https://culture-travel.ru/sitemap.xml`.

Проверка у себя:
- https://culture-travel.ru/robots.txt  
- https://culture-travel.ru/sitemap.xml  
- https://culture-travel.ru/llms.txt  

---

## Деплой

1. `git push` в `main`  
2. Actions → workflow **Deploy to GitHub Pages**  
3. Сайт: https://culture-travel.ru  

DNS (Reg.ru): `A`/`AAAA` на IP GitHub, `www` → CNAME `artemiymarushchak.github.io`.  
В Settings → Pages: custom domain + **Enforce HTTPS**.

---

## Контакт «Сохранить в iPhone»

Кнопка сохраняет vCard: **Анна Баглай**, телефон, email, Telegram и **сайт** `https://culture-travel.ru` (не дубль Telegram в поле «сайт компании»).

---

## Чего в репо нет (и не нужно)

- Python / `build.py` — удалены  
- Тильда / CDN — удалены  
- Wiki GitHub — не используем (публична как и репо)  
- Куча старых markdown-аудитов — убраны  

Шрифт сайта: только локальный **Montserrat** (`assets/fonts/montserrat/`).

# Культура Путешествий

Сайт [culture-travel.ru](https://culture-travel.ru): HTML + CSS + JS → сборка → GitHub Pages.  
Код — собственность правообладателя ([LICENSE](LICENSE)).

## Документация

**[docs/README.md](docs/README.md)** — оглавление.

| Нужно | Файл |
|-------|------|
| Править тексты / туры / отзывы | [docs/ADMIN.md](docs/ADMIN.md) |
| Фото, флаги, форматы | [docs/ASSETS.md](docs/ASSETS.md) |
| Папки проекта | [docs/СТРУКТУРА.md](docs/СТРУКТУРА.md) |
| Деплой | [docs/DEPLOY.md](docs/DEPLOY.md) |

## Локально

```bash
node tools/build.mjs
node tools/preview.mjs
```

`dist/` не редактировать.

## Куда класть контент

| Что | Куда |
|-----|------|
| Отзывы | `content/reviews/catalog.json` |
| Новости | `content/news/` + `assets/images/news/` |
| Слайдер кейсов | `content/cases-slider/catalog.json` |
| Программа тура | `content/cases/...` + `assets/images/cases/` |
| Отели | `content/hotels/` (черновик = файл с `_` в начале) |
| Услуги | `content/services/catalog.json` |
| Контакты / SEO-дефолты | `core/site.json` |
| Меню | `core/nav.json` |

Шрифт: только локальный Montserrat (`assets/fonts/montserrat/`).

# План работ — Culture Travel

> Идём шаг за шагом. Не спешим с GitHub и деплоем.

---

## ✅ Шаг 1 — Токены и компоненты

См. `styles/tokens/`, `styles/README.md`, `preview/tokens.html`

---

## ✅ Шаг 2 — Ядро (базовая архитектура)

```
core/
  site.json              ← настройки сайта + SEO
  nav.json               ← меню
  blocks.registry.json   ← каталог блоков (css, js, dataSource)
  registry.js            ← JS init блоков
  init.js                ← boot в браузере
  anchors.js             ← якоря главной
  video-overlay.js       ← hero scroll
```

**Build** читает registry → генерирует `styles/blocks.css` → собирает HTML.

Подробно: **`docs/ARCHITECTURE.md`**

---

## ⏳ Шаг 3 — Блоки (по одному, WIP)

Каждый блок = папка:

```
blocks/header/
  header.html
  header.css
  header.js
```

Порядок:
1. **header** — как на Tilda
2. **hero-video** — видео + УТП
3. **about** — обо мне
4. **cases-slider** — кейсы
5. **services** — услуги
6. **reviews** — отзывы
7. **contact-footer** — связаться
8. **footer** — чёрный подвал

---

## ⏳ Шаг 4 — Контент JSON

```
content/cases/    ← кейсы
content/news/     ← новости
content/hotels/   ← отели (карточка + модалка)
```

---

## ⏳ Шаг 5 — GitHub + деплой

Когда дизайн готов и ты на Pro (или public repo).

---

## Палитра (утверждаем вместе)

| Токен | Значение | Описание |
|-------|----------|----------|
| `--color-black` | `#000000` | Подвал, классика |
| `--color-white` | `#F8F7F4` | Не кипельный, не молочный |
| `--color-white-hover` | `#EEEDE8` | Hover на тёмном |
| `--color-gold` | `#A8865E` | ✅ Утверждено — акцент на paper |
| `--color-gold-hover` | `#A6865D` | Вторичный оттенок |
| `--color-gold-deep` | `#887048` | Тёмный gold |
| `--color-paper` | `#F7F3ED` | Фон светлых секций |
| `--header-bg-top` | transparent + gradient | Шапка на hero |
| `--header-bg-scrolled` | `#000` | Шапка после скролла |
| `--header-link-*-hover` | `#EEEDE8` | Hover на чёрном |

Если золото или белый не то — скажи, подкрутим за 1 минуту.

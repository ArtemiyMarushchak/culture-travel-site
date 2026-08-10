# Шрифты — Culture Travel

## Montserrat (активно)

Подключение **локально** — файл `assets/fonts/montserrat/fonts.local.css`, импорт из `styles/foundation/fonts.css`.

| Weight | Файлы | Где на сайте |
|--------|-------|--------------|
| **400** Regular | `montserrat-regular-*.woff2` | body, длинный текст |
| **500** Medium | `montserrat-medium-*.woff2` | overline («Кейсы», «Обо мне») |
| **600** SemiBold | `montserrat-semibold-*.woff2` | заголовки, nav, кнопки |

Подмножества: **Latin + Cyrillic** (ru + en).

---

## Скачать Montserrat

Если нужно обновить файлы или поставить на другой проект:

**https://gwfh.mranftl.com/fonts/montserrat?subsets=cyrillic,latin**

1. Выбери weights: **400, 500, 600**
2. Скачай `.woff2`
3. Положи в `assets/fonts/montserrat/`
4. Имена должны совпадать с `fonts.local.css` (или обнови `@font-face`)

Альтернатива: [Google Fonts — Montserrat](https://fonts.google.com/specimen/Montserrat) (скачать family → конвертировать в woff2).

---

## CDN (запасной вариант)

`assets/fonts/montserrat/fonts.cdn.css` — Google CDN, если локальные файлы недоступны.

В `styles/foundation/fonts.css` замени импорт:

```css
@import url('../../assets/fonts/montserrat/fonts.cdn.css');
```

---

## Структура

```
assets/fonts/
├── montserrat/
│   ├── fonts.local.css      ← активно (woff2)
│   ├── fonts.cdn.css        ← запасной CDN
│   └── *.woff2              ← 6 файлов (400/500/600 × latin/cyrillic)
├── inter/                   ← резерв
└── cormorant/               ← резерв
```

Никаких установок шрифта на компьютер не требуется — всё self-hosted в репозитории.

# Шрифт Montserrat — Culture Travel

## Статус: ✅ установлено в проекте

Файлы лежат в `assets/fonts/montserrat/` (Latin + Cyrillic, woff2):

```
montserrat-regular-cyrillic.woff2
montserrat-regular-latin.woff2
montserrat-medium-cyrillic.woff2
montserrat-medium-latin.woff2
montserrat-semibold-cyrillic.woff2
montserrat-semibold-latin.woff2
```

Подключение: `styles/fonts.css` → `styles/main.css`

Preview типографики: `preview/typography.html`

---

## Какие начертания нужны (как на culture-travel.ru)

| Weight | Название | Где используется |
|--------|----------|------------------|
| **400** | Regular | Основной текст, параграфы |
| **500** | Medium | Overline (метки секций «Кейсы», «Обо мне») |
| **600** | SemiBold | Заголовки, nav, кнопки, **логотип-текст** |

Другие начертания (100, 700, 900…) **не нужны** — не скачивай лишнее.

---

## Где скачать (бесплатно, легально)

### Способ 1 — Google Fonts (рекомендую)

1. Открой: [https://fonts.google.com/specimen/Montserrat](https://fonts.google.com/specimen/Montserrat)
2. Нажми **Get font** → **Download all**
3. Распакуй ZIP
4. Из папки `static/` возьми файлы и положи в проект:

```
assets/fonts/montserrat/
  montserrat-regular.woff2    ← Montserrat-Regular.ttf → конвертируй в woff2
  montserrat-medium.woff2     ← Montserrat-Medium.ttf
  montserrat-semibold.woff2   ← Montserrat-SemiBold.ttf
```

> Google отдаёт `.ttf`. Для сайта нужен **woff2** (меньше, быстрее).

### Конвертация TTF → WOFF2

Онлайн (без регистрации):
- [https://cloudconvert.com/ttf-to-woff2](https://cloudconvert.com/ttf-to-woff2)
- [https://fontconverter.io/](https://fontconverter.io/)

Или через [Fontsource](https://fontsource.org/fonts/montserrat) — там уже woff2:
```bash
npm install @fontsource/montserrat
# файлы: node_modules/@fontsource/montserrat/files/
```

### Способ 2 — Fontsource (если есть Node)

```bash
cd ~/Projects/culture-travel-site
npm install @fontsource/montserrat
cp node_modules/@fontsource/montserrat/files/montserrat-latin-400-normal.woff2 assets/fonts/montserrat/montserrat-regular.woff2
cp node_modules/@fontsource/montserrat/files/montserrat-latin-500-normal.woff2 assets/fonts/montserrat/montserrat-medium.woff2
cp node_modules/@fontsource/montserrat/files/montserrat-latin-600-normal.woff2 assets/fonts/montserrat/montserrat-semibold.woff2
```

**Важно:** выбирай subset **latin** + **cyrillic** (для русского текста).

---

## Подмножество символов

При конвертации включи:
- **Latin** (английский)
- **Cyrillic** (русский) — обязательно!

Иначе русские буквы не отобразятся.

---

## Логотип и Montserrat

Твой логотип SVG (`logo-white.svg`) содержит:
1. **Знак-компас** (слева) — нарисован вручную
2. **Текст «КУЛЬТУРА ПУТЕШЕСТВИЙ»** — конвертирован из Montserrat в **кривые** (paths)

Текст в SVG — это уже не шрифт, а векторные контуры. Он **не меняется** при смене woff2 на сайте.

### Как добиться идеального совпадения

**Вариант A (сейчас)** — SVG как на Tilda:
- Плюс: pixel-perfect как сейчас
- Минус: текст в SVG не «живой»

**Вариант B (идеальный, позже)** — разделить логотип:
```html
<a class="ui-logo ui-logo--split">
  <img src="/assets/icons/logo-mark.svg" alt="">
  <span class="ui-logo__text">Культура Путешествий</span>
</a>
```
```css
.ui-logo__text {
  font-family: var(--font-main);
  font-weight: 600;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
```
- Плюс: всегда бьётся с nav и заголовками
- Минус: нужно проверить регистр букв (у тебя ALL CAPS в SVG)

Я могу сделать **Вариант B** когда скажешь — вынесу только компас в `logo-mark.svg`, текст будет живым Montserrat 600.

### Про «подогнать толщину» SVG

Текст в SVG уже имеет толщину Montserrat SemiBold на момент экспорта из Figma/Tilda. Менять толщину paths вручную — почти нереально. Проще **Вариант B** или переэкспорт из Figma с нужным weight.

---

## Проверка после установки

1. Положи 3 файла woff2 в `assets/fonts/montserrat/`
2. Открой [preview/tokens.html](http://127.0.0.1:8765/preview/tokens.html)
3. Текст должен быть Montserrat, не Arial

Если видишь Arial — файлы не на месте или не те имена.

# Как редактировать сайт

Сайт собирается из **JSON-файлов** и **блоков**. Вам не нужно трогать HTML — только JSON и изображения.

---

## Добавить новость

1. Откройте папку `content/news/` на GitHub
2. Нажмите **Add file → Create new file**
3. Имя файла: `2026-03-new-route.json` (дата + slug)
4. Скопируйте содержимое из `_template.json` и заполните
5. Commit → сайт обновится через 1–2 минуты

### Шаблон новости

```json
{
  "slug": "2026-03-new-route",
  "title": "Заголовок",
  "date": "2026-03-01",
  "cover": "/assets/images/news/cover.webp",
  "excerpt": "Короткий анонс",
  "body": "<p>Текст новости. HTML: &lt;p&gt;, &lt;h2&gt;, &lt;ul&gt;</p>",
  "seo": {
    "title": "Заголовок | Culture Travel",
    "description": "Meta description до 160 символов"
  }
}
```

**URL новости:** `https://culture-travel.ru/news/2026-03-new-route/`

---

## Добавить кейс

1. `content/cases/` → новый файл `my-case.json`
2. Шаблон: `content/cases/_template.json`
3. `"featured": true` — показывается в слайдере на главной

**URL:** `https://culture-travel.ru/cases/my-case/`

---

## Добавить отель

1. `content/hotels/` → новый файл `hotel-name.json`
2. Шаблон: `content/hotels/_template.json`
3. Отель появится в каталоге `/hotels/` с фильтрами
4. Кнопка «Смотреть фото и видео» открывает модалку

### Темы для фильтров

`beach`, `city`, `mountain`, `safari` — укажите в массиве `"themes"`.

### Медиа в модалке

```json
"media": [
  { "type": "image", "src": "/assets/images/hotels/photo.webp", "alt": "Описание" },
  { "type": "video", "src": "/assets/videos/hotels/hotel.mp4" }
]
```

---

## Добавить фото / видео

| Тип | Папка |
|-----|-------|
| Фото | `assets/images/` |
| Видео hero | `assets/videos/hero.mp4` |
| Видео отелей | `assets/videos/hotels/` |

**Форматы:** WebP, AVIF для фото; MP4 для видео.

**Именование:** латиница, без пробелов: `safari-kenya-cover.webp`

---

## Изменить контакты / реквизиты

Файл: **`core/site.json`** — секции `contacts`, `legal`, `social`.

После изменения — commit и push; деплой обновит сайт автоматически.

> Эти данные **публичные** (отображаются на сайте). Не добавляйте в git пароли и API-ключи.

---

## Изменить тексты на главной

Блоки главной: `blocks/about/`, `blocks/reviews/`, `blocks/hero-video/` и т.д.

Каждый блок — папка с `*.html`, `*.css`, `*.js`.

Порядок блоков на главной: `pages/index.page.json` → массив `"blocks"`.

---

## Изменить цвета / шрифты

Папка: **`styles/tokens/`** (`colors.css`, `typography.css`, `spacing.css`, `layout.css`)

Шрифты: `assets/fonts/montserrat/` — см. [FONTS.md](FONTS.md)

---

## Локальная проверка перед push

```bash
node tools/build.mjs
node tools/preview.mjs
# Откройте http://localhost:4173
```

---

## Частые ошибки

| Проблема | Решение |
|----------|---------|
| Страница 404 | Проверьте `"slug"` в JSON — должен совпадать с именем URL |
| Не видно на главной | Для кейсов: `"featured": true` |
| Сборка упала | Проверьте JSON на ошибки (запятые, кавычки) |
| Фото не грузится | Путь начинается с `/assets/...` |

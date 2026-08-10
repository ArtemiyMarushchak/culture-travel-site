# Кейсы — слайдер на главной

Данные: **`content/cases-slider/catalog.json`**

## Структура

```json
{
  "regions": [
    { "id": "all", "label": "Все" },
    { "id": "africa", "label": "Африка" }
  ],
  "cases": {
    "africa": [
      {
        "title": "Южная Африка",
        "text": "Короткое описание для слайда",
        "image": "/assets/images/cases/south-africa/cover.jpg",
        "slug": "south-africa"
      }
    ]
  }
}
```

- **`slug`** — если указан, кнопка «Подробнее» ведёт на `/cases/{slug}/`
- **`image`** — путь от корня сайта (`/assets/...`)
- Без `slug` — слайд без ссылки (кнопка скрыта)

## Фото

Кладите изображения в `assets/images/cases/` (по папкам регионов или кейсов).  
Placeholder: `/assets/images/placeholder.svg`

Не используйте внешние URL (Tilda, Unsplash) на проде.

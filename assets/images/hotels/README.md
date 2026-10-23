# Отели — фото

Редактирование каталога: `content/hotels/_catalog.json`

```
assets/images/hotels/
  _covers/           ← обложки (cover) по желанию
  {hotel-id}/        ← галерея модалки
    01.jpg
    02.jpg
```

В JSON у отеля:
```json
"cover": "/assets/images/hotels/singita-grumeti/01.jpg",
"media": [
  { "type": "image", "src": "/assets/images/hotels/singita-grumeti/01.jpg", "alt": "…" },
  { "type": "video", "src": "/assets/videos/hotels/singita-grumeti/01.mp4" }
]
```

Видео опционально → `assets/videos/hotels/{hotel-id}/`

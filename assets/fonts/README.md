# Шрифты — Culture Travel

## Сейчас (временно)

Подключение через **Google CDN** — файл:

`assets/fonts/montserrat/fonts.cdn.css`

Импортируется из `styles/foundation/fonts.css`.

**Плюсы:** ничего не качаем, работает сразу локально.  
**Минусы:** нужен интернет при первой загрузке; зависимость от Google (на проде лучше self-host).

---

## Позже (self-hosted woff2)

1. Скачать Montserrat 400 / 500 / 600, Latin + Cyrillic  
   Удобный сервис: https://gwfh.mranftl.com/fonts/montserrat?subsets=cyrillic,latin

2. Положить `.woff2` в эту папку (`assets/fonts/montserrat/`)

3. Раскомментировать `@font-face` в `fonts.local.css`

4. В `styles/foundation/fonts.css` заменить:
   ```css
   @import url('../../assets/fonts/montserrat/fonts.cdn.css');
   ```
   на:
   ```css
   @import url('../../assets/fonts/montserrat/fonts.local.css');
   ```

---

## Структура

```
assets/fonts/
├── montserrat/
│   ├── fonts.cdn.css      ← Google (активно)
│   ├── fonts.local.css    ← woff2 (заготовка)
│   └── *.woff2            ← добавите позже
├── inter/                 ← резерв (не используется)
└── cormorant/             ← резерв (не используется)
```

Никаких установок на компьютер не требуется.

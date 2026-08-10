# Чеклист CSS-токенов — Culture Travel

> Полный список — папка `styles/tokens/`. Точка входа: `styles/tokens/index.css` (shim: `styles/variables.css`).  
> Отмечай ✅ по мере утверждения. Не 12-колоночная сетка — luxury editorial.

---

## 1. Цвета

| # | Токен | Значение | Статус | Назначение |
|---|-------|----------|--------|------------|
| 1.1 | `--color-black` | `#000000` | ✅ | Подвал, scrolled header |
| 1.2 | `--color-white` | `#F8F7F4` | ✅ | Текст на hero (не кипельный) |
| 1.3 | `--color-white-hover` | `#EEEDE8` | ✅ | На paper (legacy) |
| 1.4 | `--color-paper` | `#FAF8F4` | ✅ | Фон страницы |
| 1.4b | `--color-paper-soft` | `#F5F2ED` | ✅ | Контейнеры |
| 1.4c | `--color-paper-deep` | `#F0EDE7` | ✅ | Полосы, блоки |
| 1.5 | `--color-gold` | `#A8865E` | ✅ | Акцент на paper |
| 1.6 | `--color-gold-hover` | `#A6865D` | ✅ | Вторичный gold |
| 1.6b | `--color-gold-deep` | `#887048` | ✅ | Тёмный gold |
| 1.7 | `--color-gold-soft/muted/faint` | rgba | ✅ | Фоны, линии |
| 1.8 | `--text-muted` (paper) | `#6E6B65` | ✅ | Серый на светлом |
| 1.8b | `--text-light-muted` (dark) | `#8E8B85` | ✅ | Серый на чёрном |
| 1.8c | `--text-secondary / soft` | `#504D48` / `#969188` | ✅ | Иерархия на paper |
| 1.9 | `--text-light-secondary / soft` | `#C8C5BF` / `#6A6762` | ✅ | Иерархия на dark |
| 1.10 | `--line-dark / --line-light` | rgba | ✅ | Разделители |

---

## 2. Шрифт

| # | Токен | Статус | Назначение |
|---|-------|--------|------------|
| 2.1 | `--font-main: Montserrat` | ✅ | Единственный шрифт |
| 2.2 | `--font-weight-title: 600` | ✅ | Заголовки |
| 2.3 | `--font-weight-text: 400` | ✅ | Body |
| 2.4 | `--font-weight-ui: 600` | ✅ | Nav, кнопки |
| 2.5 | `--font-weight-overline: 500` | ✅ | Метки секций |
| 2.6 | woff2 локально в `assets/fonts/` | ✅ | Latin + Cyrillic |

---

## 3. Размеры шрифта (пропорционально, с потолком на 4K)

| # | Токен | Min → Max | Статус |
|---|-------|-----------|--------|
| 3.1 | `--font-hero` | 40px → 66px | ✅ |
| 3.2 | `--font-h1` | 36px → 64px | ✅ |
| 3.3 | `--font-h2` | 28px → 54px | ✅ |
| 3.4 | `--font-h3` | 22px → 36px | ✅ |
| 3.5 | `--font-h4` | 18px → 28px | ✅ |
| 3.6 | `--font-body-size` | 15px → 18px | ✅ |
| 3.7 | `--font-nav` | 11px fixed | ✅ |
| 3.8 | `--font-menu` | 15px fixed | ✅ |
| 3.9 | `--font-overline` | 11px fixed | ✅ |
| 3.10 | `--leading-tight / normal` | 1.15 / 1.6 | ✅ |
| 3.11 | `--tracking-wide / nav` | 0.12em / 0.14em | ✅ |

**Правило:** все заголовки через `clamp()` — на 4K не раздуваются.

---

## 4. Отступы от края (luxury, не bootstrap-grid)

| # | Токен | Значение | Статус | Экран |
|---|-------|----------|--------|-------|
| 4.1 | `--edge-mobile` | **15px** | ✅ | Телефон |
| 4.2 | `--edge-desktop` | **40px** | ✅ | Планшет+ |
| 4.3 | `--container-padding` | `clamp(15px, 5vw, 40px)` | ✅ | Авто, max 40px |
| 4.4 | `--container-max-width` | **1440px** | ✅ | Потолок на 4K |
| 4.5 | `--container-wide-max` | 1600px | ✅ | Галереи |
| 4.6 | `--container-narrow-max` | 720px | ✅ | Текстовые блоки |
| 4.7 | `--container-text-max` | 640px | ✅ | Узкая колонка |

**Правило 4K:** контент `max-width: 1440px` + `margin: auto` — на ultrawide/4K не растягивается от края до края.

```
┌────────────────────────────────────────────────── 4K ──┐
│ 40px │      контент max 1440px центр      │ 40px │
└────────────────────────────────────────────────────────┘
```

---

## 5. Вертикальные отступы секций

| # | Токен | Значение | Статус |
|---|-------|----------|--------|
| 5.1 | `--section-space-mobile` | 72px | ✅ |
| 5.2 | `--section-space-tablet` | 96px | ✅ |
| 5.3 | `--section-space-desktop` | 120px | ✅ |
| 5.4 | `--space-section` | clamp(72, 8vw, 120) | ✅ |

---

## 6. Внутренние gap (между элементами)

| # | Токен | px | Статус |
|---|-------|-----|--------|
| 6.1 | `--space-3xs` | 4 | ✅ |
| 6.2 | `--space-2xs` | 8 | ✅ |
| 6.3 | `--space-xs` | 12 | ✅ |
| 6.4 | `--space-sm` | 16 | ✅ |
| 6.5 | `--space-md` | 24 | ✅ |
| 6.6 | `--space-lg` | 32 | ✅ |
| 6.7 | `--space-xl` | 48 | ✅ |
| 6.8 | `--gap-block` | 32 | ✅ |
| 6.9 | `--gap-inline` | 24 | ✅ |

---

## 7. Скругления

| # | Токен | Значение | Статус |
|---|-------|----------|--------|
| 7.1 | `--radius` | **0** | ✅ | Editorial, без скруглений |

---

## 8. Header (прозрачная → чёрная)

| # | Токен | Статус |
|---|-------|--------|
| 8.1 | TOP: прозрачный фон + gradient | ✅ |
| 8.2 | SCROLLED: чёрный `rgba(0,0,0,0.96)` | ✅ |
| 8.3 | Nav на тёмном: белый, hover opacity 70% | ✅ |
| 8.4 | Nav SCROLLED: белый, hover opacity 70% | ✅ |
| 8.5 | Active на paper: золото `#A8865E` | ✅ |
| 8.5b | Active на чёрном: белый (не золото) | ✅ |
| 8.5c | `styles/theme-dark.css` | ✅ |
| 8.6 | `--header-height` | ✅ |
| 8.7 | Mobile menu: чёрный фон | ✅ |

---

## 9. Footer

| # | Токен | Статус |
|---|-------|--------|
| 9.1 | `--footer-bg: #000` | ✅ |
| 9.2 | `--footer-text` muted | ✅ |
| 9.3 | `--footer-link-hover` | ✅ |

---

## 10. Hover / Focus / Motion

| # | Токен | Статус |
|---|-------|--------|
| 10.1 | `--ui-link-hover-opacity: 0.7` | ✅ |
| 10.2 | `--ui-button-hover-opacity: 0.7` | ✅ |
| 10.3 | Hover = opacity, цвет не меняется | ✅ |
| 10.4 | `--focus-ring: gold` (paper) / white (dark) | ✅ |
| 10.5 | `--transition: 0.35s` | ✅ |
| 10.6 | `--transition-fast: 0.2s` | ✅ |

---

## 11. Z-index

| # | Токен | Статус |
|---|-------|--------|
| 11.1 | `--z-header: 100` | ✅ |
| 11.2 | `--z-overlay: 150` | ✅ |
| 11.3 | `--z-modal: 200` | ✅ |

---

## 12. Breakpoints (справочно)

| # | Токен | px | Статус |
|---|-------|-----|--------|
| 12.1 | `--bp-mobile` | 480 | ✅ |
| 12.2 | `--bp-tablet` | 768 | ✅ |
| 12.3 | `--bp-laptop` | 1024 | ✅ |
| 12.4 | `--bp-desktop` | 1280 | ✅ |
| 12.5 | `--bp-wide` | 1600 | ✅ |
| 12.6 | `--bp-4k` | 2560 | ✅ |

---

## 13. Что ещё добавим по ходу блоков

| # | Токен | Статус | Когда |
|---|-------|--------|-------|
| 13.1 | `--hero-overlay` | ⏳ | Hero-video блок |
| 13.2 | `--card-bg / border` | ⏳ | Кейсы, отели |
| 13.3 | `--modal-bg / overlay` | ⏳ | Модалки отелей |
| 13.4 | `--slider-gap` | ⏳ | Cases slider |
| 13.5 | `--form-input-*` | ⏳ | Контакты |

---

## Правила использования (для всех блоков)

1. **Никаких magic numbers** — только `var(--...)`
2. **Отступы от края** — только `--container-padding`
3. **Ширина** — `max-width: var(--container-max-width)`
4. **Шрифты** — только токены `--font-h*`, `--font-body-size`
5. **Radius** — всегда `0`
6. **4K** — clamp с max, container с потолком 1440px
7. **Hover** — opacity 70%, без смены цвета
8. **Золото** — только `.theme-light` / paper; на чёрном — белое

---

## Утверждённая палитра (финал)

| Роль | HEX |
|------|-----|
| Black | `#000000` |
| White | `#F8F7F4` |
| Gold | `#A8865E` |
| Paper | `#FAF8F4` |
| Paper-soft | `#F5F2ED` |
| Paper-deep | `#F0EDE7` |
| Gray (paper) | `#6E6B65` |
| Gray (dark) | `#8E8B85` |

---

## Быстрая проверка

```bash
# Открыть preview/tokens.html в браузере
# Уменьшить/увеличить окно + проверить на широком мониторе
```

- [x] Mobile: отступ 15px от края
- [x] Desktop: отступ 40px
- [x] 4K / ultrawide: контент по центру, не на всю ширину
- [x] Hover: opacity 70%
- [x] Золото `#A8865E` — только на paper
- [x] Header: белое на чёрном, прозрачная → чёрная

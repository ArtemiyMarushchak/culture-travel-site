# Design System — CSS

Единая точка входа: **`styles/main.css`**

## Структура

```
styles/
├── main.css                 ← подключать в HTML
├── variables.css            ← shim → tokens/index.css
│
├── tokens/                  ← CSS-переменные (утверждённые)
│   ├── index.css
│   ├── colors.css           палитра, текст, линии
│   ├── typography.css       шрифты, scale, line-height
│   ├── spacing.css          space-*, gap, section rhythm
│   ├── layout.css           container, radius, content width
│   ├── interaction.css      hover, transition, ui sizes
│   ├── header-footer.css    шапка, подвал, mobile menu
│   ├── z-index.css
│   ├── breakpoints.css      справочные bp (480–2560)
│   ├── aliases.css          legacy-имена для блоков
│   └── responsive.css       :root overrides по media
│
├── foundation/
│   ├── fonts.css            Montserrat (Google CDN / self-host)
│   ├── reset.css
│   └── base.css             body, container, section
│
├── ui/                      ← UI-компоненты (классы)
│   ├── index.css
│   ├── type.css             .ui-h1 … .ui-prose
│   ├── spacing.css          .ui-stack, .ui-grid, .ui-section
│   ├── link.css             .ui-link-nav-underline
│   ├── button.css           .ui-btn
│   └── …
│
├── themes/
│   └── theme-dark.css       белое на чёрном, без золота
│
└── utilities/
    ├── helpers.css          .sr-only, .mt-md, .grid-2
    └── interaction-rules.css
```

## Preview

| Страница | URL |
|----------|-----|
| Токены | `/preview/tokens.html` |
| Типографика | `/preview/typography.html` |
| Spacing | `/preview/spacing.html` |
| Header | `/preview/header.html` |
| Главная (WIP) | `/preview/home.html` |

Локально: `python3 -m http.server 8765` из корня проекта.

## Правила

1. Только `var(--…)` — без magic numbers в блоках
2. Hover = opacity 70%, цвет не меняется
3. Золото — только на paper (`.theme-light`)
4. На чёрном — только белое (`theme-dark.css`)
5. Radius = 0

Подробный чеклист: `docs/TOKENS-CHECKLIST.md`

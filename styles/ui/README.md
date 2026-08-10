# UI Components

Переиспользуемые элементы разметки. Блоки (`blocks/`) строятся из них.

## image.css

```html
<figure class="ui-image ui-image--16x9">
  <img src="/assets/images/photo.webp" alt="..." loading="lazy" width="1200" height="675">
</figure>
```

Ratios: `--16x9`, `--4x5`, `--3x4`, `--1x1`, `--hero`

## icon.css + logo

```html
<span class="ui-icon ui-icon--sm ui-icon--gold">
  <img src="/assets/icons/concierge.svg" alt="">
</span>

<a class="ui-logo ui-logo--header" href="/">
  <img src="/assets/icons/logo-white.svg" alt="Культура Путешествий">
</a>
```

Логотипы:
- `logo-black.svg` — на светлом фоне
- `logo-white.svg` — на тёмном / hero
- `logo-mark-black.svg` — только знак (компас)

## button.css

```html
<button class="ui-btn ui-btn--solid">Связаться</button>
<button class="ui-btn ui-btn--outline-light">На hero</button>
<a class="ui-link" href="#">Обо мне</a>
```

## markup.css

```html
<section class="ui-section ui-section--paper theme-light">
  <div class="ui-container">
    <p class="ui-overline">Кейсы</p>
    ...
  </div>
</section>
```

Темы секций: `theme-dark` / `theme-light` на родителе.

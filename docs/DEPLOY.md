# Деплой и домен

Прод: **https://culture-travel.ru**  
Хостинг: **GitHub Pages** из ветки `main` (артефакт `dist/` после сборки).

---

## Как публикуется сайт

1. Вы пушите изменения в `main`.
2. Workflow **Deploy to GitHub Pages** (`.github/workflows/deploy.yml`):
   - ставит Node 20;
   - запускает `node tools/build.mjs` с `CUSTOM_DOMAIN=true`;
   - заливает `dist/` на Pages.
3. Через 1–3 минуты сайт обновляется.

Ручной запуск: GitHub → вкладка **Actions** → workflow → **Run workflow**.

---

## Чеклист после push

1. Actions → последний run зелёный (build + deploy).
2. Открыть https://culture-travel.ru (hard refresh при кэше).
3. При проблемах с HTTPS/доменом — Settings → Pages (см. ниже).

---

## Настройки GitHub Pages

Репозиторий → **Settings** → **Pages**:

| Параметр | Значение |
|----------|----------|
| Source | GitHub Actions |
| Custom domain | `culture-travel.ru` |
| Enforce HTTPS | включено |

В `dist/` при сборке с `CUSTOM_DOMAIN=true` появляется файл `CNAME` с доменом.

---

## DNS (Reg.ru или другой регистратор)

Нужны записи для apex и `www`:

| Тип | Имя | Значение |
|-----|-----|----------|
| `A` | `@` (apex) | IP GitHub Pages (актуальный список — в [документации GitHub](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)) |
| `AAAA` | `@` | IPv6 GitHub Pages (если используете) |
| `CNAME` | `www` | `artemiymarushchak.github.io` |

После смены DNS подождите распространения (минуты–часы).  
Проверка: `dig culture-travel.ru` / `dig www.culture-travel.ru`.

### Если «видна старая Тильда»

Частая причина — **кэш DNS роутера / провайдера**, а не GitHub:

1. На устройстве смените DNS на `8.8.8.8` / `1.1.1.1` и проверьте снова.
2. В роутере (часто `192.168.1.1`) укажите те же публичные DNS вместо авто от провайдера.
3. С телефона на мобильном интернете (не Wi‑Fi) откройте сайт — так исключается домашний роутер.

---

## HTTPS

1. DNS уже указывает на GitHub.
2. В Pages указан custom domain.
3. Включить **Enforce HTTPS** (сертификат выпускает GitHub).

Если Enforce «залип» серым: подождать, снять/вернуть домен, убедиться что `A`/`CNAME` верные и нет конфликтующих записей у старого хостинга.

---

## Переменные сборки на CI

В workflow уже задано:

```yaml
GITHUB_PAGES: 'true'
CUSTOM_DOMAIN: 'true'
```

Это даёт:
- корректные абсолютные URL на `https://culture-travel.ru`;
- пустой `basePath` (сайт в корне домена, не в `/repo/`);
- файл `CNAME` в артефакте.

---

## Откат

- Откатить commit в `main` и снова push — пересоберётся предыдущее состояние.
- Либо Re-run старого успешного workflow (если артефакт ещё доступен) — обычно проще новый push с нужным кодом.

---

## Локально перед деплоем

Рекомендуется:

```bash
node tools/build.mjs
node tools/preview.mjs
```

Так ловите битый JSON до CI. Подробнее: [BUILD.md](BUILD.md).

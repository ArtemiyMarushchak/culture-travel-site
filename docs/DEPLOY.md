# Деплой

## GitHub Pages (сейчас)

Push в `main` → GitHub Actions → `node tools/build.mjs` → публикация `dist/`.

### Первый деплой

1. Репозиторий **public** (бесплатный Pages на Free plan)
2. Settings → Pages → Source: **GitHub Actions**
3. Push в `main`, дождаться зелёного Actions
4. Custom domain: `culture-travel.ru` → после DNS включить **Enforce HTTPS**

### DNS

- `A` @ → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- `AAAA` @ → `2606:50c0:8000::153` … `::8003::153`
- или `CNAME www` → `artemiy-marushchak.github.io`

Workflow: `CUSTOM_DOMAIN=true` → `dist/CNAME` и `basePath=""`.

Проверьте: главная, 404, закрытая `/south-africa/` (noindex).

---

## Локально

```bash
node tools/build.mjs
node tools/preview.mjs
```

Не правьте `dist/` вручную.

---

## Свой сервер (позже)

Статика из `dist/`. Пример Nginx: `try_files $uri $uri/ $uri/index.html =404;` + кеш для css/js/woff2/webp/mp4.

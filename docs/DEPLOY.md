# Деплой

## GitHub Pages (сейчас)

1. Push в ветку `main`
2. GitHub Actions автоматически:
   - запускает `node tools/build.mjs`
   - публикует папку `dist/` на Pages

### Первый деплой — checklist

- [ ] Репозиторий создан (private)
- [ ] GitHub → **Settings → Pages → Source: GitHub Actions**
- [ ] Push в `main` выполнен
- [ ] Actions → workflow зелёный
- [ ] Сайт доступен по URL Pages

### Бесплатно — без GitHub Pro

На Free plan **GitHub Pages = 0 ₽** только для **public** репозитория.

| Вариант | Цена |
|---------|------|
| Public repo + GitHub Pages | **0 ₽** ← рекомендуем |
| Private repo + GitHub Pages | ~$4/мес (Pro) — **не нужен** |
| Cloudflare Pages (public или private git) | **0 ₽** ← альтернатива |

Подробнее: `docs/БЕСПЛАТНО.md`

---

## Свой сервер в РФ (позже)

Сайт — чистая статика в папке `dist/`. Никакого Node на сервере не нужно.

```bash
# Локально
node tools/build.mjs

# Скопировать dist/ на сервер
scp -r dist/* user@server:/var/www/culture-travel.ru/
```

### Nginx (пример)

```nginx
server {
    listen 443 ssl http2;
    server_name culture-travel.ru www.culture-travel.ru;

    root /var/www/culture-travel.ru;
    index index.html;

    # Чистые URL
    location / {
        try_files $uri $uri/ $uri/index.html =404;
    }

    # Кеш статики
    location ~* \.(css|js|woff2|webp|avif|svg|mp4)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

### GitHub Actions → FTP/SFTP (опционально)

Можно добавить второй workflow для деплоя на свой сервер через SFTP-секреты в GitHub.

---

## Домен culture-travel.ru

### На GitHub Pages

1. Build создаёт `CNAME` с `culture-travel.ru`
2. DNS у регистратора:
   - `A` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - или `CNAME www` → `username.github.io`
3. GitHub → Settings → Pages → Custom domain

### На своём сервере

Просто направьте A-запись на IP сервера.

---

## CI/CD схема

```
git push main
    ↓
GitHub Actions
    ↓
node tools/build.mjs  →  dist/
    ↓
deploy-pages  →  culture-travel.ru
```

# Безопасность

## Репозиторий — private

Рекомиторий **закрытый** (private). Исходный код и JSON-контент не видны публично.

> **Важно:** GitHub Pages публикует собранный сайт (`dist/`) — HTML/CSS/JS **всё равно доступны** посетителям сайта. Это нормально для статики. Private repo защищает **исходники и историю**, не сам сайт.

---

## Что НЕ коммитить

| Файл | Почему |
|------|--------|
| `.env`, `.env.*` | Секреты |
| `*.pem`, `*.key` | Ключи |
| `secrets/` | Любые секреты |
| `.tools/` | Локальный Node (в .gitignore) |
| `dist/` | Генерируется CI (в .gitignore) |

Проверка: `.gitignore` уже настроен.

---

## Защита на уровне HTML

В каждой странице (через `seo/templates/head.html`):

- **Content-Security-Policy** — скрипты только с вашего домена
- **X-Content-Type-Options: nosniff**
- **Referrer-Policy: strict-origin-when-cross-origin**
- **frame-ancestors: none** — защита от clickjacking

На своём сервере (nginx) — дополнительные headers в [DEPLOY.md](DEPLOY.md).

---

## GitHub

- **2FA** — включите на аккаунте GitHub
- **Branch protection** (опционально): Settings → Branches → protect `main`
- **Secrets** — только в GitHub Settings → Secrets, не в коде

---

## Формы и данные

Сейчас форма — `mailto:` ссылка. Персональные данные не собираются на сайте.

Когда подключите CRM (Supabase) — API keys только в GitHub Secrets и env на сервере, **никогда** в JS-коде на клиенте для секретных ключей.

---

## Зависимости

Runtime-зависимостей **ноль**. Node нужен только для сборки в CI и локально.

Нет npm-пакетов → нет supply chain attacks через dependencies.

---

## Рекомендации

1. Регулярно проверяйте **GitHub → Security → Dependabot** (когда появятся deps)
2. Не давайте write-доступ к репо посторонним
3. Реквизиты компании в `core/site.json` — это публичные данные, их можно коммитить

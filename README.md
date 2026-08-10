# Культура Путешествий — официальный сайт

**© 2026 ИП Баглай Анна Михайловна. Все права защищены.**

> ⚠️ **Это не open source.** Код в репозитории — собственность правообладателя.  
> Копирование, форки для публикации под брендом «Культура Путешествий», коммерческое использование дизайна и контента **без письменного согласия запрещены**.  
> Официальный сайт: **[culture-travel.ru](https://culture-travel.ru)** — только этот домен.

---

## Для команды проекта

Статический сайт: HTML, CSS, Vanilla JS. Сборка → GitHub Pages.

```bash
node tools/build.mjs          # сборка
node tools/build.mjs && node tools/preview.mjs   # локальный просмотр
# без Node: python3 tools/build.py
```

| Задача | Файл |
|--------|------|
| Контакты, реквизиты | `core/site.json` |
| Меню | `core/nav.json` |
| Кейсы в слайдере | `content/cases-slider/catalog.json` |
| Страницы кейсов | `content/cases/*.json` |
| Дизайн-токены | `styles/tokens/` |

---

## Структура (кратко)

`blocks/` · `content/` · `pages/` · `styles/` · `assets/` · `core/` · `tools/`

Подробнее: [docs/СТРУКТУРА.md](docs/СТРУКТУРА.md)

---

## Деплой

Push в `main` → GitHub Actions → Pages.  
Инструкции: [docs/DEPLOY.md](docs/DEPLOY.md) · [docs/GITHUB-SETUP.md](docs/GITHUB-SETUP.md)

---

## Безопасность и бренд

| Документ | Содержание |
|----------|------------|
| [docs/SECURITY.md](docs/SECURITY.md) | Кто может менять сайт, 2FA, branch protection |
| [docs/ЗАЩИТА-БРЕНДА.md](docs/ЗАЩИТА-БРЕНДА.md) | Подделка сайта, DMCA, официальный домен |
| [LICENSE](LICENSE) | Юридический текст лицензии |

**Не коммитить:** `.env`, токены GitHub, пароли, API-ключи CRM.

---

## Внешние contributions

Pull Request от сторонних лиц **не принимаются** без договорённости с правообладателем.

---

## Контакты правообладателя

По вопросам использования кода и бренда — через официальный сайт [culture-travel.ru](https://culture-travel.ru) или Telegram, указанный на сайте.

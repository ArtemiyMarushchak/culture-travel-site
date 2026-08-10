# GitHub Pages — первый запуск

## 1. Создай репозиторий на GitHub

1. Открой https://github.com/new
2. **Repository name:** `culture-travel-site`
3. **Public** (бесплатно + Pages)
4. **Не** добавляй README / .gitignore — проект уже есть локально
5. Create repository

## 2. Привяжи и запушь (один раз)

Замени `ТВОЙ-USERNAME` на свой логин GitHub:

```bash
cd ~/Projects/culture-travel-site

git remote add origin git@github.com:ТВОЙ-USERNAME/culture-travel-site.git
# или HTTPS:
# git remote add origin https://github.com/ТВОЙ-USERNAME/culture-travel-site.git

git add -A
git commit -m "Culture Travel: архитектура, кейс ЮАР, GitHub Pages"
git push -u origin main
```

## 3. Включи GitHub Pages

1. GitHub → репозиторий → **Settings → Pages**
2. **Source:** GitHub Actions (не Branch!)
3. Подожди 2–3 минуты после push

## 4. Тестовый URL

```
https://ТВОЙ-USERNAME.github.io/culture-travel-site/
```

Примеры страниц:

| Страница | URL |
|----------|-----|
| Главная | `/culture-travel-site/` |
| Кейс ЮАР | `/culture-travel-site/cases/south-africa/` |
| Новость | `/culture-travel-site/news/yuar-programma-2026/` |
| Визитка | `/culture-travel-site/contact/` |

Build на GitHub **сам** подставляет `basePath` — локально пути без префикса, на Pages — с `/culture-travel-site/`.

## 5. Рабочий цикл

```bash
# Локально
python3 tools/build.py
# или
bash scripts/dev.sh

# Проверил → пуш
git add .
git commit -m "описание изменений"
git push
```

Через 1–2 минуты сайт обновится на GitHub Pages.

## 6. Позже — свой домен

Когда culture-travel.ru готов:

1. В `core/site.json` уже стоит `url: https://culture-travel.ru`
2. DNS → GitHub Pages
3. Settings → Pages → Custom domain

---

## Локально vs GitHub

| | Локально | GitHub Pages |
|---|----------|--------------|
| Сборка | `python3 tools/build.py` | Actions + Node |
| URL | http://127.0.0.1:8766/ | https://USER.github.io/culture-travel-site/ |
| basePath | `` | `/culture-travel-site` |

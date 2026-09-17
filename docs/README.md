# Документация Culture Travel

Инструкции по сайту [culture-travel.ru](https://culture-travel.ru).  
Корневой [README](../README.md) — только навигация по репозиторию и лицензия.

---

## Оглавление

| Документ | Когда открывать |
|----------|-----------------|
| [STRUCTURE.md](STRUCTURE.md) | Понять, где что лежит |
| [BUILD.md](BUILD.md) | Собрать сайт локально, preview, Node.js |
| [ADMIN.md](ADMIN.md) | Добавить отзыв, новость, кейс, отель, услугу; контакты и меню |
| [ASSETS.md](ASSETS.md) | Форматы фото, флаги, видео hero, вес файлов |
| [DEPLOY.md](DEPLOY.md) | Push → GitHub Pages, DNS, HTTPS, кастомный домен |
| [SEO.md](SEO.md) | robots, sitemap, llms.txt, Яндекс.Вебмастер |

---

## Как устроен процесс (коротко)

```
Правите content / assets / core
        ↓
node tools/build.mjs   →   папка dist/
        ↓
git push в main   →   GitHub Actions публикует сайт
```

1. Меняете данные (JSON, HTML программы, фото).
2. Локально проверяете: `npm run preview` или `build` + `preview`.
3. Коммитите и пушите в `main` — сайт обновится сам.

**Не правите `dist/` вручную** — всё сотрётся при следующей сборке.

---

## С чего начать

| Задача | Документ |
|--------|----------|
| Первый раз клонировали репо | [BUILD.md](BUILD.md) |
| Нужно поменять телефон / меню | [ADMIN.md](ADMIN.md) → раздел «Контакты и меню» |
| Добавить отзыв или новость | [ADMIN.md](ADMIN.md) |
| Подготовить фото / видео | [ASSETS.md](ASSETS.md) |
| Сайт не обновился после push | [DEPLOY.md](DEPLOY.md) |
| Проверить индексацию в Яндексе | [SEO.md](SEO.md) |

---

## Важно

- Нужен **Node.js 18+**. Python в проекте **нет**.
- Тильда и внешние CDN-остатки удалены — только локальные файлы.
- Заглушки `/cruises/`, `/tours/`, `/hotels/` — «в разработке», `noindex`.
- Код и бренд — собственность правообладателя ([LICENSE](../LICENSE)).

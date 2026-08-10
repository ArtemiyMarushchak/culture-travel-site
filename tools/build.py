#!/usr/bin/env python3
"""Culture Travel — локальная сборка (без Node.js). Дублирует tools/build.mjs."""

from __future__ import annotations

import json
import os
import re
import shutil
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"

site = json.loads((ROOT / "core/site.json").read_text(encoding="utf-8"))

if os.environ.get("GITHUB_PAGES") == "true" and os.environ.get("GITHUB_REPOSITORY"):
    owner, repo_name = os.environ["GITHUB_REPOSITORY"].split("/", 1)
    site["url"] = f"https://{os.environ.get('GITHUB_REPOSITORY_OWNER', owner)}.github.io"
    site["basePath"] = f"/{repo_name}"
seo_defaults = {
    **json.loads((ROOT / "seo/defaults.json").read_text(encoding="utf-8")),
    **(site.get("seo") or {}),
}
block_registry = json.loads((ROOT / "core/blocks.registry.json").read_text(encoding="utf-8"))
page_layout = json.loads((ROOT / "core/page-layout.json").read_text(encoding="utf-8"))
layout_template = (ROOT / "layouts/default.html").read_text(encoding="utf-8")
head_template = (ROOT / "seo/templates/head.html").read_text(encoding="utf-8")

PAGE_TEMPLATES = {
    name: json.loads((ROOT / "templates" / f"{name}.page.json").read_text(encoding="utf-8"))
    for name in ("case", "news", "hotel")
}

sitemap_entries: list[dict] = []


def read_json(path: Path | str) -> dict:
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def escape_html(value="") -> str:
    return (
        str(value)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def interpolate(template: str, data: dict) -> str:
    def repl(match):
        return escape_html(data.get(match.group(1), ""))

    return re.sub(r"\{\{(\w+)\}\}", repl, template)


def full_url(path: str) -> str:
    base = site["url"].rstrip("/")
    bp = (site.get("basePath") or "").rstrip("/")
    p = path if path.startswith("/") else f"/{path}"
    url = f"{base}{bp}{'' if p == '/' else p}"
    return re.sub(r"(?<!:)/+", "/", url) or base


def slug_to_dist_path(slug: str) -> Path:
    clean = slug.strip("/")
    return Path("index.html") if not clean else Path(clean) / "index.html"


def list_content_json(content_dir: str) -> list[dict]:
    directory = ROOT / content_dir
    if not directory.exists():
        return []
    items = []
    for file in directory.glob("*.json"):
        if file.name.startswith("_"):
            continue
        items.append(json.loads(file.read_text(encoding="utf-8")))
    return items


def format_date(date_str: str) -> str:
    if not date_str:
        return ""
    months = {
        1: "января", 2: "февраля", 3: "марта", 4: "апреля",
        5: "мая", 6: "июня", 7: "июля", 8: "августа",
        9: "сентября", 10: "октября", 11: "ноября", 12: "декабря",
    }
    dt = datetime.strptime(date_str[:10], "%Y-%m-%d")
    return f"{dt.day} {months[dt.month]} {dt.year}"


def normalize_content_data(data: dict) -> dict:
    cover = data.get("cover")
    if isinstance(cover, dict):
        cover = cover.get("image", "")
    cover = cover or ""
    body = data.get("body") or ""
    body_file = data.get("bodyFile")
    if body_file:
        body_path = ROOT / body_file if body_file.startswith("content/") else ROOT / "content" / body_file
        if body_path.exists():
            body = body_path.read_text(encoding="utf-8")
        else:
            print(f"  ⚠ bodyFile not found: {body_path}")
    base_path = site.get("basePath") or ""
    if "{{basePath}}" in body:
        body = body.replace("{{basePath}}", base_path)
    seo = data.get("seo") or {}
    title = seo.get("title", "")
    if title:
        title = re.sub(r"\s*\|\s*Culture Travel$", "", title)
    else:
        title = data.get("title") or data.get("name") or ""
    return {
        **data,
        "body": body,
        "cover": cover,
        "coverImage": data.get("coverImage") or cover,
        "dateIso": data.get("date") or data.get("published") or "",
        "dateFormatted": format_date(data.get("date") or data.get("published") or ""),
        "email": (site.get("contacts") or {}).get("email", "info@culture-travel.ru"),
        "year": str(datetime.now().year),
        "basePath": site.get("basePath") or "",
        "title": title,
        "description": seo.get("description") or data.get("excerpt") or data.get("subtitle") or "",
    }


def block_folder(block_type: str) -> str:
    meta = block_registry.get("blocks", {}).get(block_type, {})
    return "blocks-secondary" if meta.get("group") == "secondary" else "blocks"


def format_phone_display(phone: str = "") -> str:
    digits = re.sub(r"\D", "", phone)
    if len(digits) == 11 and digits.startswith("7"):
        return f"+7 {digits[1:4]} {digits[4:7]}-{digits[7:9]}-{digits[9:11]}"
    return phone


def telegram_handle(url: str = "") -> str:
    match = re.search(r"t\.me/([^/?]+)", url)
    return f"@{match.group(1)}" if match else url


def prepare_hotels_catalog() -> list[dict]:
    return [
        {
            **hotel,
            "themes": ",".join(hotel.get("themes") or []),
            "mediaJson": json.dumps(hotel.get("media") or []).replace("'", "&#39;"),
        }
        for hotel in list_content_json("content/hotels")
    ]


def prepare_cases_featured() -> list[dict]:
    items = []
    for case in list_content_json("content/cases"):
        if case.get("featured") is False:
            continue
        cover = case.get("cover")
        if isinstance(cover, dict):
            cover = cover.get("image", "")
        items.append(
            {
                "slug": case.get("slug"),
                "title": case.get("title"),
                "subtitle": case.get("subtitle") or "",
                "cover": cover or "/assets/images/placeholder.svg",
            }
        )
    return items


def prepare_cases_slider(base_path: str = "") -> dict:
    catalog = read_json("content/cases-slider/catalog.json")
    bp = (base_path or "").rstrip("/")
    cases = {}

    for region, items in (catalog.get("cases") or {}).items():
        processed = []
        for item in items or []:
            image_path = item.get("image") or "/assets/images/placeholder.svg"
            image = f"{bp}{image_path}" if image_path.startswith("/") else image_path
            slug = item.get("slug")
            link = f"{bp}/cases/{slug}/".replace("//", "/") if slug else ""
            if link.startswith("/") and bp and not link.startswith(bp):
                link = f"{bp}{link}"
            processed.append(
                {
                    "title": item.get("title") or "",
                    "text": item.get("text") or "",
                    "image": image,
                    "link": link,
                }
            )
        cases[region] = processed

    regions = []
    for index, region in enumerate(catalog.get("regions") or []):
        regions.append(
            {
                "id": region.get("id"),
                "label": region.get("label"),
                "tabClass": " is-active" if index == 0 else "",
                "ariaSelected": "true" if index == 0 else "false",
            }
        )

    cases_json = json.dumps({"cases": cases}, ensure_ascii=False).replace("<", "\\u003c")
    return {"regions": regions, "casesJson": cases_json}


def prepare_services_catalog() -> dict:
    catalog = read_json("content/services/catalog.json")
    items = []
    for index, item in enumerate(catalog.get("items") or []):
        items.append({**item, "indexPad": str(index + 1).zfill(2)})
    return {
        "overline": catalog.get("overline") or "",
        "title": catalog.get("title") or "",
        "lead": catalog.get("lead") or "",
        "items": items,
    }


def prepare_reviews_catalog() -> dict:
    catalog = read_json("content/reviews/catalog.json")
    yandex_url = (catalog.get("platforms") or {}).get("yandex", {}).get("reviewUrl") or (site.get("reviews") or {}).get("yandexUrl") or ""
    tabs = catalog.get("tabs") or {}
    return {
        "overline": catalog.get("overline") or "",
        "title": catalog.get("title") or "",
        "lead": catalog.get("lead") or "",
        "tabSiteLabel": tabs.get("site") or "Отзывы гостей",
        "tabYandexLabel": tabs.get("yandex") or "Яндекс",
        "siteNote": catalog.get("siteNote") or "",
        "items": catalog.get("items") or [],
        "ctaTitle": (catalog.get("cta") or {}).get("title") or "",
        "ctaText": (catalog.get("cta") or {}).get("text") or "",
        "ctaButton": (catalog.get("cta") or {}).get("button") or "",
        "widgetNote": (catalog.get("platforms") or {}).get("yandex", {}).get("widgetNote") or "",
        "yandexReviewUrl": yandex_url or "#",
        "yandexBtnClass": "" if yandex_url else " rv__btn--soon",
    }


def prepare_news_list() -> list[dict]:
    return sorted(
        [
            {
                "slug": item.get("slug"),
                "title": item.get("title"),
                "excerpt": item.get("excerpt") or "",
                "dateIso": item.get("date"),
                "dateFormatted": format_date(item.get("date") or ""),
            }
            for item in list_content_json("content/news")
        ],
        key=lambda x: x.get("dateIso") or "",
        reverse=True,
    )


def resolve_block_data(block: dict, page_data: dict) -> dict:
    data = {**page_data, **(block.get("data") or {})}
    meta = block_registry.get("blocks", {}).get(block["type"], {})
    source = (block.get("data") or {}).get("source") or meta.get("dataSource")
    prepare = meta.get("dataPrepare")
    block_type = block["type"]

    if prepare == "casesSlider" or block_type == "cases-slider":
        data.update(prepare_cases_slider(site.get("basePath") or ""))
    if prepare == "servicesCatalog" or block_type == "services":
        data.update(prepare_services_catalog())
    if prepare == "reviewsCatalog" or block_type == "reviews":
        data.update(prepare_reviews_catalog())
    if prepare == "casesFeatured" or source == "content/cases":
        data["items"] = prepare_cases_featured()
    if prepare == "newsList" or source == "content/news" or block_type == "news-list":
        data["items"] = prepare_news_list()
    if prepare == "hotelsCatalog" or source == "content/hotels" or block_type == "hotel-catalog":
        data["items"] = prepare_hotels_catalog()
        data["hotelsJson"] = json.dumps(list_content_json("content/hotels"))
    if block_type == "hotel-layout" and isinstance(data.get("media"), list):
        data["images"] = [m for m in data["media"] if m.get("type") == "image"]
        data["videos"] = [m for m in data["media"] if m.get("type") == "video"]
    return normalize_content_data(data)


def resolve_page_blocks(page_config: dict) -> list[dict]:
    if page_config.get("layout") == "minimal":
        return page_config.get("blocks") or []
    middle = [
        block
        for block in (page_config.get("blocks") or [])
        if block.get("type") not in {"header", "footer", "modal"}
    ]
    return (page_layout.get("before") or []) + middle + (page_layout.get("after") or [])


def load_block_html(block_type: str, block_data: dict | None = None) -> str:
    block_data = block_data or {}
    folder = block_folder(block_type)
    html_path = ROOT / folder / block_type / f"{block_type}.html"
    if not html_path.exists():
        return f"<!-- missing block: {block_type} -->"
    html = html_path.read_text(encoding="utf-8")
    contacts = site.get("contacts") or {}
    social = site.get("social") or {}
    legal = site.get("legal") or {}
    developer = site.get("developer") or {}
    telegram = contacts.get("telegram") or social.get("telegram") or ""

    merged = {
        **block_data,
        "basePath": site.get("basePath") or "",
        "telegram": telegram,
        "phone": contacts.get("phone") or "",
        "phoneRaw": re.sub(r"\s", "", contacts.get("phone") or ""),
        "phoneDisplay": format_phone_display(contacts.get("phone") or ""),
        "telegramHandle": telegram_handle(telegram),
        "email": contacts.get("email") or "",
        "registryUrl": legal.get("registryUrl") or "",
        "legalCompanyName": legal.get("companyName") or "",
        "inn": legal.get("inn") or "",
        "ogrn": legal.get("ogrn") or "",
        "developerName": developer.get("name") or "",
        "developerUrl": developer.get("url") or "",
        "year": str(datetime.now().year),
    }
    if block_type == "header":
        merged["nav"] = read_json("core/nav.json")

    raw_fields = {"body", "content", "casesJson"}

    def render_each(match):
        key = match.group(1)
        item_tpl = match.group(2)
        arr = merged.get(key)
        if not isinstance(arr, list):
            return ""
        parts = []
        for index, item in enumerate(arr):
            ctx = {**merged, **item, "index": index} if isinstance(item, dict) else {**merged, "item": item, "index": index}

            def item_repl(m):
                k = m.group(1)
                val = ctx.get(k, "")
                if k in raw_fields and val:
                    return str(val)
                return escape_html(str(val))

            parts.append(re.sub(r"\{\{(\w+)\}\}", item_repl, item_tpl))
        return "".join(parts)

    html = re.sub(r"\{\{#each (\w+)\}\}([\s\S]*?)\{\{/each\}\}", render_each, html)

    def simple_repl(match):
        key = match.group(1)
        val = merged.get(key, "")
        if key in raw_fields and val:
            return str(val)
        return escape_html(str(val))

    html = re.sub(r"\{\{(\w+)\}\}", simple_repl, html)
    return html


def render_blocks(blocks: list[dict], page_data: dict | None = None) -> str:
    page_data = page_data or {}
    return "\n".join(load_block_html(block["type"], resolve_block_data(block, page_data)) for block in blocks)


def build_head(meta: dict) -> str:
    title = meta.get("title") or site.get("name")
    description = meta.get("description") or seo_defaults.get("defaultDescription")
    slug = meta.get("slug") or "/"
    canonical = full_url(slug if slug.endswith("/") else f"{slug}/")
    json_ld = ""
    if meta.get("jsonLd"):
        schemas = meta["jsonLd"] if isinstance(meta["jsonLd"], list) else [meta["jsonLd"]]
        json_ld = "\n".join(
            f'<script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script>'
            for schema in schemas
        )
    return interpolate(
        head_template,
        {
            "lang": site.get("language") or "ru",
            "title": title,
            "description": description,
            "canonical": canonical,
            "author": (site.get("author") or {}).get("name") or site.get("name"),
            "robots": meta.get("robots") or "index, follow",
            "ogType": meta.get("ogType") or "website",
            "siteName": site.get("name"),
            "ogTitle": meta.get("ogTitle") or title,
            "ogDescription": meta.get("ogDescription") or description,
            "ogUrl": canonical,
            "ogImage": full_url(meta.get("ogImage") or seo_defaults.get("defaultOgImage")),
            "locale": site.get("locale") or "ru_RU",
            "basePath": site.get("basePath") or "",
            "jsonLd": json_ld,
        },
    )


def breadcrumb_schema(slug_path: str, page_title: str):
    parts = [p for p in slug_path.strip("/").split("/") if p]
    if not parts:
        return None
    labels = {"news": "Новости", "cases": "Кейсы", "hotels": "Отели", "privacy": "Политика конфиденциальности"}
    items = [{"@type": "ListItem", "position": 1, "name": "Главная", "item": full_url("/")}]
    acc = ""
    for index, part in enumerate(parts):
        acc += f"/{part}"
        is_last = index == len(parts) - 1
        items.append(
            {
                "@type": "ListItem",
                "position": index + 2,
                "name": page_title if is_last else labels.get(part, part),
                "item": full_url(f"{acc}/"),
            }
        )
    return {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": items}


def build_json_ld(page_config: dict, content_data: dict, slug_path: str) -> list[dict]:
    schemas = [seo_defaults.get("organization")]
    author_name = (site.get("author") or {}).get("name")
    if page_config.get("template") == "case" or page_config.get("type") == "case":
        schemas.append(
            {
                "@context": "https://schema.org",
                "@type": "Article",
                "headline": content_data.get("title"),
                "description": content_data.get("subtitle") or content_data.get("description"),
                "url": full_url(slug_path),
                "datePublished": content_data.get("published"),
                "author": {"@type": "Person", "name": author_name},
            }
        )
    if page_config.get("template") == "news" or page_config.get("type") == "news":
        schemas.append(
            {
                "@context": "https://schema.org",
                "@type": "NewsArticle",
                "headline": content_data.get("title"),
                "description": content_data.get("excerpt"),
                "url": full_url(slug_path),
                "datePublished": content_data.get("date"),
                "author": {"@type": "Person", "name": author_name},
            }
        )
    crumbs = breadcrumb_schema(slug_path, content_data.get("title") or page_config.get("title"))
    if crumbs:
        schemas.append(crumbs)
    return [s for s in schemas if s]


def write_out(relative_path: Path | str, content: str) -> None:
    target = DIST / relative_path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def build_page(page_config: dict, content_data: dict | None = None) -> Path:
    content_data = content_data or {}
    normalized = normalize_content_data(
        {
            **content_data,
            **(page_config.get("data") or {}),
            "title": (content_data.get("seo") or {}).get("title") or content_data.get("title") or page_config.get("title"),
            "description": (content_data.get("seo") or {}).get("description")
            or content_data.get("excerpt")
            or content_data.get("subtitle")
            or page_config.get("description"),
        }
    )
    slug = page_config.get("slug") or content_data.get("slugPath") or "/"
    slug_path = slug if slug.endswith("/") or slug == "/" else f"{slug}/"
    title = normalized.get("title") or page_config.get("title") or site.get("name")
    description = normalized.get("description") or page_config.get("description") or seo_defaults.get("defaultDescription")
    blocks = resolve_page_blocks(page_config)
    content = render_blocks(blocks, {**normalized, "slug": slug_path})
    json_ld = build_json_ld(page_config, content_data, slug_path)
    suffix = seo_defaults.get("titleSuffix") or ""
    head_title = title if ("Culture Travel" in title or "Культура" in title) else f"{title}{suffix}"
    head = build_head(
        {
            "title": head_title,
            "description": description,
            "slug": slug_path,
            "robots": "noindex, follow" if page_config.get("robots") == "noindex" else "index, follow",
            "ogImage": normalized.get("ogImage") or normalized.get("coverImage") or normalized.get("cover") or seo_defaults.get("defaultOgImage"),
            "ogType": page_config.get("ogType") or "website",
            "jsonLd": json_ld,
        }
    )
    bp = site.get("basePath") or ""
    scripts = f'<script type="module" src="{bp}/core/init.js"></script>'
    html = (
        layout_template.replace("{{lang}}", site.get("language") or "ru")
        .replace("{{head}}", head)
        .replace("{{content}}", f'<main id="main">{content}</main>')
        .replace("{{scripts}}", scripts)
    )
    out_path = slug_to_dist_path(slug_path)
    write_out(out_path, html)
    sitemap_entries.append(
        {
            "slug": slug_path,
            "title": title,
            "lastmod": content_data.get("published") or content_data.get("date") or datetime.now().strftime("%Y-%m-%d"),
            "noindex": page_config.get("robots") == "noindex" or slug_path == "/404/",
        }
    )
    return out_path


def load_content_pages(content_dir: str, template_name: str, url_prefix: str) -> None:
    directory = ROOT / content_dir
    if not directory.exists():
        return
    template = PAGE_TEMPLATES[template_name]
    for file in directory.glob("*.json"):
        if file.name.startswith("_"):
            continue
        data = json.loads(file.read_text(encoding="utf-8"))
        slug = data.get("slug") or file.stem
        slug_path = f"/{url_prefix}/{slug}/"
        seo_title = (data.get("seo") or {}).get("title") or ""
        seo_title = re.sub(r"\s*\|\s*Culture Travel$", "", seo_title)
        build_page(
            {**template, "slug": slug_path, "type": template_name, "blocks": data.get("blocks") or template.get("blocks")},
            {**data, "slugPath": slug_path, "title": seo_title or data.get("title") or data.get("name")},
        )
        print(f"  ✓ {slug_path}")


def load_manual_pages() -> None:
    pages_dir = ROOT / "pages"
    if not pages_dir.exists():
        return
    for file in pages_dir.glob("*.page.json"):
        page = json.loads(file.read_text(encoding="utf-8"))
        build_page(page)
        print(f"  ✓ {page.get('slug') or '/'}")


def copy_static_assets() -> None:
    for name in ("assets", "styles", "core"):
        src = ROOT / name
        if src.exists():
            dst = DIST / name
            if dst.exists():
                shutil.rmtree(dst)
            shutil.copytree(src, dst)
    for folder in ("blocks", "blocks-secondary"):
        src = ROOT / folder
        if not src.exists():
            continue
        dst = DIST / folder
        if dst.exists():
            shutil.rmtree(dst)
        shutil.copytree(
            src,
            dst,
            ignore=shutil.ignore_patterns("*.html"),
        )


def generate_blocks_css() -> None:
    lines = ["/* Auto-generated by tools/build.py — do not edit manually */"]
    for block_type, meta in block_registry.get("blocks", {}).items():
        if not meta.get("css"):
            continue
        folder = block_folder(block_type)
        css_path = ROOT / folder / block_type / f"{block_type}.css"
        if css_path.exists():
            lines.append(f"@import url('../{folder}/{block_type}/{block_type}.css');")
    (ROOT / "styles/blocks.css").write_text("\n".join(lines) + "\n", encoding="utf-8")


def generate_404() -> None:
    page_path = ROOT / "pages/404.page.json"
    page = json.loads(page_path.read_text(encoding="utf-8")) if page_path.exists() else {
        "slug": "/404/",
        "title": "Страница не найдена",
        "description": "Запрашиваемая страница не существует.",
        "blocks": [{"type": "error-404"}],
    }
    build_page(page)
    gh404 = DIST / "404" / "index.html"
    if gh404.exists():
        write_out("404.html", gh404.read_text(encoding="utf-8"))


def generate_robots() -> None:
    write_out("robots.txt", f"User-agent: *\nAllow: /\n\nSitemap: {full_url('/sitemap.xml')}\n")


def generate_sitemap() -> None:
    urls = []
    for entry in sitemap_entries:
        if entry.get("noindex"):
            continue
        loc = full_url(entry["slug"])
        priority = "1.0" if entry["slug"] == "/" else "0.8"
        freq = "weekly" if entry["slug"] == "/" else "monthly"
        urls.append(
            f"  <url>\n    <loc>{loc}</loc>\n    <lastmod>{entry['lastmod']}</lastmod>\n    <changefreq>{freq}</changefreq>\n    <priority>{priority}</priority>\n  </url>"
        )
    write_out(
        "sitemap.xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls)
        + "\n</urlset>\n",
    )


def generate_llms_txt() -> None:
    sections = "\n".join(f"- {full_url(entry['slug'])} — {entry['title']}" for entry in sitemap_entries if entry["slug"] != "/")
    tpl = (ROOT / "seo/templates/llms.txt.template").read_text(encoding="utf-8")
    tpl = (
        tpl.replace("{{siteName}}", site.get("name", ""))
        .replace("{{tagline}}", site.get("tagline", ""))
        .replace("{{defaultDescription}}", seo_defaults.get("defaultDescription", ""))
        .replace("{{sections}}", sections)
        .replace("{{url}}", site.get("url", ""))
        .replace("{{email}}", (site.get("contacts") or {}).get("email", ""))
        .replace("{{phone}}", (site.get("contacts") or {}).get("phone", ""))
        .replace("{{registryUrl}}", (site.get("legal") or {}).get("registryUrl", ""))
    )
    write_out("llms.txt", tpl)


def generate_web_manifest() -> None:
    bp = site.get("basePath") or ""
    write_out(
        "site.webmanifest",
        json.dumps(
            {
                "name": site.get("name"),
                "short_name": "Culture Travel",
                "description": site.get("tagline"),
                "start_url": f"{bp}/",
                "display": "standalone",
                "background_color": "#0a0a0a",
                "theme_color": "#0a0a0a",
                "lang": site.get("language"),
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
    )


def generate_config_js() -> None:
    write_out("core/site-config.js", f"export const SITE = {json.dumps(site, ensure_ascii=False, indent=2)};\n")


def build() -> None:
    global sitemap_entries
    sitemap_entries = []
    print("🏗  Culture Travel — сборка (Python)...\n")
    generate_blocks_css()
    print("  ✓ styles/blocks.css")
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True)
    write_out(".nojekyll", "")
    if "culture-travel.ru" in site.get("url", ""):
        write_out("CNAME", "culture-travel.ru")
    print("📄 Страницы:")
    load_manual_pages()
    load_content_pages("content/cases", "case", "cases")
    load_content_pages("content/news", "news", "news")
    load_content_pages("content/hotels", "hotel", "hotels")
    generate_404()
    print("\n📦 Ассеты:")
    copy_static_assets()
    generate_config_js()
    print("\n🔍 SEO:")
    generate_robots()
    generate_sitemap()
    generate_llms_txt()
    generate_web_manifest()
    print("  ✓ robots.txt, sitemap.xml, llms.txt, site.webmanifest")
    print(f"\n✅ Сборка завершена → dist/ ({len(sitemap_entries)} страниц)\n")


if __name__ == "__main__":
    build()

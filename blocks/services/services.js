/**
 * Services — hanging folders on desktop, stacked cards on mobile.
 * Desktop: bodies share one rectangle; tabs sit in order with gaps.
 * Mobile: one folder per service, tabs alternate left / right.
 */

function folderPath(w, h, tabX, tabW, tabH, r, tabR, fillet) {
  const k = 0.45;
  const tl = Math.max(0, tabX);
  const tr = Math.min(w, tabX + tabW);
  const leftFlush = tl <= 0.5;
  const rightFlush = tr >= w - 0.5;
  const topR = Math.min(tabR, (tr - tl) * 0.22, tabH * 0.45);
  const join = Math.min(fillet, tabH * 0.42, Math.max(4, (tr - tl) * 0.08));

  const parts = [];
  const M = (x, y) => parts.push(`M${x} ${y}`);
  const H = (x) => parts.push(`H${x}`);
  const V = (y) => parts.push(`V${y}`);
  const C = (x1, y1, x2, y2, x, y) => parts.push(`C${x1} ${y1} ${x2} ${y2} ${x} ${y}`);

  if (leftFlush) {
    M(0, topR);
    C(0, topR * k, topR * k, 0, topR, 0);
  } else {
    M(0, tabH + r);
    C(0, tabH + r * k, r * k, tabH, r, tabH);
    H(Math.max(r, tl - join));
    C(tl - join * 0.25, tabH, tl, tabH - join * 0.2, tl, topR);
    C(tl, topR * k, tl + topR * k, 0, tl + topR, 0);
  }

  if (rightFlush) {
    H(w - topR);
    C(w - topR * k, 0, w, topR * k, w, topR);
  } else {
    H(tr - topR);
    C(tr - topR * k, 0, tr, topR * k, tr, topR);
    C(tr, tabH - join * 0.2, tr + join * 0.25, tabH, Math.min(w - r, tr + join), tabH);
    H(w - r);
    C(w - r * k, tabH, w, tabH + r * k, w, tabH + r);
  }

  V(h - r);
  C(w, h - r * k, w - r * k, h, w - r, h);
  H(r);
  C(r * k, h, 0, h - r * k, 0, h - r);
  V(leftFlush ? topR : tabH + r);
  parts.push("Z");
  return parts.join("");
}

function applyShape(pack, w, h, tabX, tabW, tabH, bodyR, tabR, fillet) {
  const sheet = pack.querySelector("[data-service-sheet]");
  const outline = pack.querySelector("[data-service-outline]");
  pack.style.setProperty("--sv-tab-x", `${tabX}px`);
  pack.style.setProperty("--sv-tab-w", `${tabW}px`);
  const d = folderPath(w, h, tabX, tabW, tabH, bodyR, tabR, fillet);
  if (sheet) {
    sheet.style.clipPath = `path('${d}')`;
    sheet.style.webkitClipPath = `path('${d}')`;
  }
  if (outline) {
    const svg = outline.ownerSVGElement;
    if (svg) svg.setAttribute("viewBox", `-3 -3 ${w + 6} ${h + 6}`);
    outline.setAttribute("d", d);
  }
}

export function initServices(root) {
  if (!root) return;

  const deck = root.querySelector("[data-services-deck]");
  const bar = root.querySelector(".sv__bar");
  const packs = [...root.querySelectorAll("[data-service]")];
  const tabs = [...root.querySelectorAll("[data-service-fin]")];
  if (!deck || !packs.length || packs.length !== tabs.length) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const desktop = window.matchMedia("(min-width: 1181px)");
  const count = packs.length;
  let current = -1;

  function paintShapes() {
    const styles = getComputedStyle(root);
    const tabH = parseFloat(styles.getPropertyValue("--sv-tab-h")) || 36;
    const bodyR = parseFloat(styles.getPropertyValue("--sv-body-r")) || 10;
    const gap = parseFloat(styles.getPropertyValue("--sv-tab-gap")) || 13;
    const tabR = parseFloat(styles.getPropertyValue("--sv-tab-r")) || 8;
    const fillet = parseFloat(styles.getPropertyValue("--sv-tab-fillet")) || 9;
    if (bar) root.style.setProperty("--sv-bar-h", `${bar.offsetHeight}px`);

    if (desktop.matches) {
      const w = deck.offsetWidth;
      const h = packs[0]?.offsetHeight || 0;
      if (!w || !h) return;
      const tabW = (w - gap * (count - 1)) / count;
      packs.forEach((pack, i) => {
        applyShape(pack, w, h, i * (tabW + gap), tabW, tabH, bodyR, tabR, fillet);
      });
      return;
    }

    packs.forEach((pack, i) => {
      const w = pack.offsetWidth;
      const h = pack.offsetHeight;
      if (!w || !h) return;
      const tabW = Math.min(152, Math.max(120, w * 0.4));
      const tabX = i % 2 === 1 ? w - tabW : 0;
      applyShape(pack, w, h, tabX, tabW, tabH, bodyR, tabR, fillet);
    });
  }

  function layoutDesktop(index, animate) {
    current = index;

    packs.forEach((pack, i) => {
      const on = i === index;
      pack.classList.toggle("is-active", on);
      pack.setAttribute("aria-hidden", on ? "false" : "true");
      pack.style.zIndex = on ? String(count + 2) : String(i + 1);
    });

    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.classList.toggle("is-active", on);
      tab.setAttribute("aria-pressed", on ? "true" : "false");
      tab.tabIndex = 0;
    });

    paintShapes();

    if (!animate || reducedMotion.matches) return;
    const pack = packs[index];
    if (!pack) return;
    pack.classList.remove("is-arrive");
    void pack.offsetWidth;
    pack.classList.add("is-arrive");
    pack.addEventListener("animationend", () => {
      pack.classList.remove("is-arrive");
    }, { once: true });
  }

  function layoutMobile() {
    packs.forEach((pack, i) => {
      pack.classList.add("is-active");
      pack.setAttribute("aria-hidden", "false");
      pack.style.zIndex = String(i + 1);
    });
    tabs.forEach((tab) => {
      tab.classList.remove("is-active");
      tab.setAttribute("aria-pressed", "false");
      tab.tabIndex = 0;
    });
    paintShapes();
  }

  function sync(animate) {
    if (desktop.matches) layoutDesktop(current < 0 ? 0 : current, animate);
    else layoutMobile();
  }

  function bringToFront(index) {
    const next = (index + count) % count;
    if (next === current) return;
    layoutDesktop(next, true);
  }

  function documentY(el) {
    let y = 0;
    for (let sib = el.previousElementSibling; sib; sib = sib.previousElementSibling) {
      const styles = getComputedStyle(sib);
      y += sib.offsetHeight
        + (parseFloat(styles.marginTop) || 0)
        + (parseFloat(styles.marginBottom) || 0);
    }
    let node = el.offsetParent;
    while (node) {
      y += node.offsetTop;
      node = node.offsetParent;
    }
    return y;
  }

  function scrollToPack(index) {
    const pack = packs[index];
    if (!pack) return;
    const header = document.getElementById("lux-header");
    const headerH = header ? header.offsetHeight : 64;
    const barH = bar ? bar.offsetHeight : 0;
    window.scrollTo({
      top: Math.max(0, documentY(pack) - headerH - barH),
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      if (desktop.matches) bringToFront(index);
      else scrollToPack(index);
    });
  });

  const ro = new ResizeObserver(() => paintShapes());
  ro.observe(deck);
  packs.forEach((pack) => ro.observe(pack));
  desktop.addEventListener("change", () => sync(false));

  sync(false);
}

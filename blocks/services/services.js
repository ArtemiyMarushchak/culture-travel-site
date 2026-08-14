/**
 * Services — hanging folders on desktop, accordion on tablet/mobile.
 * Desktop geometry matches GitHub: full folder clip per pack, outline on active only.
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
  const L = (x, y) => parts.push(`L${x} ${y}`);
  const C = (x1, y1, x2, y2, x, y) => parts.push(`C${x1} ${y1} ${x2} ${y2} ${x} ${y}`);

  if (leftFlush) {
    M(0, topR);
    C(0, topR * k, topR * k, 0, topR, 0);
  } else {
    M(0, tabH + r);
    C(0, tabH + r * k, r * k, tabH, r, tabH);
    L(Math.max(r, tl - join), tabH);
    C(tl - join * 0.25, tabH, tl, tabH - join * 0.2, tl, topR);
    C(tl, topR * k, tl + topR * k, 0, tl + topR, 0);
  }

  if (rightFlush) {
    L(w - topR, 0);
    C(w - topR * k, 0, w, topR * k, w, topR);
  } else {
    L(tr - topR, 0);
    C(tr - topR * k, 0, tr, topR * k, tr, topR);
    C(tr, tabH - join * 0.2, tr + join * 0.25, tabH, Math.min(w - r, tr + join), tabH);
    L(w - r, tabH);
    C(w - r * k, tabH, w, tabH + r * k, w, tabH + r);
  }

  L(w, h - r);
  C(w, h - r * k, w - r * k, h, w - r, h);
  L(r, h);
  C(r * k, h, 0, h - r * k, 0, h - r);
  L(0, leftFlush ? topR : tabH + r);
  parts.push("Z");
  return parts.join("");
}

function applyShape(pack, w, h, tabX, tabW, tabH, bodyR, tabR, fillet, active) {
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
    outline.setAttribute("d", active ? d : "");
  }
  return d;
}

export function initServices(root) {
  if (!root) return;

  const deck = root.querySelector("[data-services-deck]");
  const bar = root.querySelector(".sv__bar");
  const packs = [...root.querySelectorAll("[data-service]")];
  const tabs = [...root.querySelectorAll("[data-service-fin]")];
  if (!deck || !packs.length || packs.length !== tabs.length) return;

  const desktop = window.matchMedia("(min-width: 1181px)");
  const count = packs.length;
  let current = -1;
  let lastPaint = "";

  function paintShapes() {
    const styles = getComputedStyle(root);
    const tabH = parseFloat(styles.getPropertyValue("--sv-tab-h")) || 36;
    const bodyR = parseFloat(styles.getPropertyValue("--sv-body-r")) || 10;
    const gap = parseFloat(styles.getPropertyValue("--sv-tab-gap")) || 13;
    const tabR = parseFloat(styles.getPropertyValue("--sv-tab-r")) || 8;
    const fillet = parseFloat(styles.getPropertyValue("--sv-tab-fillet")) || 9;
    if (bar) root.style.setProperty("--sv-bar-h", `${bar.offsetHeight}px`);

    if (!desktop.matches) {
      lastPaint = "acc";
      packs.forEach((pack) => {
        const sheet = pack.querySelector("[data-service-sheet]");
        const outline = pack.querySelector("[data-service-outline]");
        if (sheet) {
          sheet.style.clipPath = "";
          sheet.style.webkitClipPath = "";
        }
        if (outline) outline.setAttribute("d", "");
      });
      return;
    }

    const w = deck.offsetWidth;
    const h = packs[0]?.offsetHeight || deck.offsetHeight;
    if (!w || !h) return;
    const active = current < 0 ? 0 : current;
    const paint = `${w}x${h}:${active}`;
    if (paint === lastPaint) return;
    lastPaint = paint;

    const tabW = (w - gap * (count - 1)) / count;
    packs.forEach((pack, i) => {
      applyShape(pack, w, h, i * (tabW + gap), tabW, tabH, bodyR, tabR, fillet, i === active);
    });
  }

  function layoutDesktop(index) {
    current = index;

    packs.forEach((pack, i) => {
      const on = i === index;
      pack.classList.toggle("is-active", on);
      pack.classList.remove("is-open");
      pack.setAttribute("aria-hidden", on ? "false" : "true");
      pack.style.zIndex = on ? String(count + 2) : String(i + 1);
    });

    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.classList.toggle("is-active", on);
      tab.setAttribute("aria-pressed", on ? "true" : "false");
      tab.removeAttribute("aria-expanded");
      tab.tabIndex = 0;
    });

    lastPaint = "";
    paintShapes();
  }

  function layoutAccordion(index) {
    current = index;

    packs.forEach((pack, i) => {
      const on = i === index;
      pack.classList.toggle("is-open", on);
      pack.classList.remove("is-active");
      pack.setAttribute("aria-hidden", "false");
      pack.style.zIndex = "";
    });

    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.classList.toggle("is-active", on);
      tab.setAttribute("aria-expanded", on ? "true" : "false");
      tab.removeAttribute("aria-pressed");
      tab.tabIndex = 0;
    });

    lastPaint = "";
    paintShapes();
  }

  function sync() {
    const index = current < 0 ? 0 : current;
    if (desktop.matches) layoutDesktop(index);
    else layoutAccordion(index);
  }

  function bringToFront(index) {
    const next = (index + count) % count;
    if (next === current) return;
    layoutDesktop(next);
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      if (desktop.matches) {
        bringToFront(index);
        return;
      }
      layoutAccordion(index === current ? -1 : index);
    });
  });

  const ro = new ResizeObserver(() => {
    lastPaint = "";
    paintShapes();
  });
  ro.observe(deck);
  desktop.addEventListener("change", () => sync());

  sync();
}

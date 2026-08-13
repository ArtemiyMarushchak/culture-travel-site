/**
 * Services — hanging folders on desktop, stacked cards on mobile.
 * Desktop: bodies share one rectangle; tabs sit in order with gaps.
 * Mobile: one folder per service, tabs alternate left / right.
 */

function folderPath(w, h, tabX, tabW, tabH, r, s) {
  const k = 0.4472;
  const tl = Math.max(0, tabX);
  const tr = Math.min(w, tabX + tabW);
  const leftFlush = tl <= 0.75;
  const rightFlush = tr >= w - 0.75;
  const sy = tabH / 52;
  const u = Math.max(s, 8) / 63.36;

  const parts = [];
  const M = (x, y) => parts.push(`M${x} ${y}`);
  const H = (x) => parts.push(`H${x}`);
  const V = (y) => parts.push(`V${y}`);
  const C = (x1, y1, x2, y2, x, y) => parts.push(`C${x1} ${y1} ${x2} ${y2} ${x} ${y}`);

  if (leftFlush) {
    M(0, r);
    C(0, r * k, r * k, 0, r, 0);
  } else {
    M(0, tabH + r);
    C(0, tabH + r * k, r * k, tabH, r, tabH);
    H(Math.max(r, tl - s));
    C(tl - 47.52 * u, tabH, tl - 34.56 * u, 40 * sy, tl - 27.36 * u, 22 * sy);
    C(tl - 21.6 * u, 8 * sy, tl - 11.52 * u, 0, tl, 0);
  }

  if (rightFlush) {
    H(w - r);
    C(w - r * k, 0, w, r * k, w, r);
  } else {
    H(tr);
    C(tr + 11.52 * u, 0, tr + 21.6 * u, 8 * sy, tr + 27.36 * u, 22 * sy);
    C(tr + 34.56 * u, 40 * sy, tr + 47.52 * u, tabH, Math.min(w - r, tr + s), tabH);
    H(w - r);
    C(w - r * k, tabH, w, tabH + r * k, w, tabH + r);
  }

  V(h - r);
  C(w, h - r * k, w - r * k, h, w - r, h);
  H(r);
  C(r * k, h, 0, h - r * k, 0, h - r);
  V(leftFlush ? r : tabH + r);
  parts.push("Z");
  return parts.join("");
}

function applyShape(pack, w, h, tabX, tabW, tabH, bodyR, shoulder) {
  const sheet = pack.querySelector("[data-service-sheet]");
  const outline = pack.querySelector("[data-service-outline]");
  pack.style.setProperty("--sv-tab-x", `${tabX}px`);
  pack.style.setProperty("--sv-tab-w", `${tabW}px`);
  const d = folderPath(w, h, tabX, tabW, tabH, bodyR, shoulder);
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
    const tabH = parseFloat(styles.getPropertyValue("--sv-tab-h")) || 42;
    const bodyR = parseFloat(styles.getPropertyValue("--sv-body-r")) || 10;
    const gap = parseFloat(styles.getPropertyValue("--sv-tab-gap")) || 22;
    if (bar) root.style.setProperty("--sv-bar-h", `${bar.offsetHeight}px`);

    if (desktop.matches) {
      const w = deck.offsetWidth;
      const h = packs[0]?.offsetHeight || 0;
      if (!w || !h) return;
      const tabW = (w - gap * (count - 1)) / count;
      const shoulder = Math.min(18, Math.max(12, gap * 0.82));
      packs.forEach((pack, i) => {
        applyShape(pack, w, h, i * (tabW + gap), tabW, tabH, bodyR, shoulder);
      });
      return;
    }

    packs.forEach((pack, i) => {
      const w = pack.offsetWidth;
      const h = pack.offsetHeight;
      if (!w || !h) return;
      const tabW = Math.min(w * 0.78, Math.max(168, w * 0.64));
      const tabX = i % 2 === 1 ? w - tabW : 0;
      applyShape(pack, w, h, tabX, tabW, tabH, bodyR, 22);
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
      tab.tabIndex = -1;
    });
    paintShapes();
  }

  function sync(animate) {
    if (desktop.matches) layoutDesktop(current < 0 ? 0 : current, animate);
    else layoutMobile();
  }

  function bringToFront(index) {
    if (!desktop.matches) return;
    const next = (index + count) % count;
    if (next === current) return;
    layoutDesktop(next, true);
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => bringToFront(index));
  });

  const ro = new ResizeObserver(() => paintShapes());
  ro.observe(deck);
  packs.forEach((pack) => ro.observe(pack));
  desktop.addEventListener("change", () => sync(false));

  sync(false);
}

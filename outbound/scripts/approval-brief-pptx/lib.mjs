// Campaign Approval Brief: reusable PPTX design library (LOCKED template)
// ---------------------------------------------------------------------------
// This module encodes the ONE visual system every client-facing approval brief
// deck must use, so every client's deck is visually identical. Per-client code
// only COMPOSES slides from this library + supplies content; it never restyles.
//
// Design contract (do not vary per client):
//   - LAYOUT_16x9 (10" x 5.625")
//   - Headings: Cambria (bold). Body: Calibri. NEVER Aptos.
//   - Dark slides: cover, decision (action required), next steps.
//   - Light slides: every content slide. Alternate for rhythm.
//   - Cards: ROUNDED_RECTANGLE, rectRadius ~0.08, subtle shadow, no border stripes.
//   - No accent bars/stripes on slide or card edges. No underlines under titles.
//   - Eyebrow pattern on every slide: small all-caps label, then a large Cambria title.
//   - Hex colors NEVER carry a leading '#'.
//   - Shadow/option objects are produced by a factory (mkShadow) — never shared.
//
// The ACCENT color is the one thing chosen per client to fit the topic
// (the prompt guide: "do not default to generic blue"). The base stays a
// dark charcoal/navy; white/off-white for cards.
// ---------------------------------------------------------------------------

import PptxGenJS from "pptxgenjs";

const HEAD = "Cambria";
const BODY = "Calibri";

const DEFAULT_THEME = {
  dark:        "17130D", // warm near-black charcoal (base for dark slides)
  darkPanel:   "231A0E", // slightly warmer panel band (cover stat strip)
  accent:      "F7931A", // <- chosen per client to fit the topic
  accent2:     "4A6076", // cool secondary (e.g. second email thread)
  light:       "F7F5F2", // warm off-white (light-slide background)
  card:        "FFFFFF", // card fill on light slides
  cardDark:    "241C11", // card fill on dark slides
  ink:         "1C1917", // near-black body text
  inkOnDark:   "FBF9F6", // near-white text on dark slides
  muted:       "6B6560", // muted warm grey (light slides)
  mutedOnDark: "B6AE9F", // muted warm grey (dark slides)
  hair:        "E7E2DB", // faint hairline (dividers inside frames)
  goodBg:      "EAF3EC", goodInk: "1F7A44", // status: ready / positive
  warnBg:      "FBEFD8", warnInk: "9A6212", // status: hold / caution
};

// factory — a FRESH shadow object per shape (never reuse across addShape calls)
const mkShadow = (opacity = 0.08, blur = 8, offset = 2) => ({
  type: "outer", color: "000000", blur, offset, angle: 90, opacity,
});

export function createBrief(opts = {}) {
  const T = { ...DEFAULT_THEME, ...(opts.theme || {}) };
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "W16x9", width: 10, height: 5.625 });
  pptx.layout = "W16x9";
  pptx.author = opts.author || "FNNL Agency";
  pptx.company = opts.company || "FNNL Agency";
  pptx.title = opts.docTitle || "Campaign Approval Brief";
  const S = pptx.ShapeType;

  const W = 10, H = 5.625, MX = 0.55; // slide dims + default margin

  // ---- primitives -------------------------------------------------------
  const roundRect = (slide, o) =>
    slide.addShape(S.roundRect, {
      x: o.x, y: o.y, w: o.w, h: o.h,
      fill: { color: o.fill },
      line: o.line || { type: "none" },
      // clamp radius under half the shorter side — pptxgenjs emits an out-of-range
      // corner adjustment at/over 0.5 that PowerPoint rejects as corrupt.
      rectRadius: Math.min(o.rectRadius ?? 0.08, Math.min(o.w, o.h) * 0.45),
      shadow: o.shadow === false ? undefined : mkShadow(o.shadowOp ?? 0.07, o.blur ?? 8),
    });

  // guarded addText — never emit a non-positive width/height (invalid OOXML -> "corrupt")
  const put = (slide, text, o) => slide.addText(text, { ...o, w: Math.max(o.w ?? 1, 0.1), h: Math.max(o.h ?? 0.3, 0.1) });

  const eyebrow = (slide, text, x, y, color) =>
    slide.addText((text || "").toUpperCase(), {
      x, y, w: W - x - MX, h: 0.3,
      fontFace: BODY, fontSize: 11, bold: true, color: color || T.accent,
      charSpacing: 3, align: "left", valign: "middle",
    });

  const heading = (slide, text, x, y, w, size, color) =>
    slide.addText(text, {
      x, y, w, h: size >= 30 ? 1.0 : 0.7,
      fontFace: HEAD, fontSize: size, bold: true, color,
      align: "left", valign: "top", lineSpacingMultiple: 0.98,
    });

  // eyebrow + title header used by every content slide
  const header = (slide, ey, title, { onDark = false, titleSize = 30, w = W - 2 * MX } = {}) => {
    eyebrow(slide, ey, MX, 0.42, T.accent);
    heading(slide, title, MX, 0.74, w, titleSize, onDark ? T.inkOnDark : T.ink);
  };

  const badge = (slide, text, x, y, { bg, ink, w = 1.05 } = {}) => {
    roundRect(slide, { x, y, w, h: 0.28, fill: bg || T.accent, rectRadius: 0.14, shadow: false });
    slide.addText((text || "").toUpperCase(), {
      x, y, w, h: 0.28, fontFace: BODY, fontSize: 9, bold: true,
      color: ink || "FFFFFF", align: "center", valign: "middle", charSpacing: 1.5,
    });
  };

  const statusMeta = (type) =>
    type === "warn"
      ? { bg: T.warnBg, ink: T.warnInk }
      : { bg: T.goodBg, ink: T.goodInk };

  // ---- slide 1 — cover (dark) -------------------------------------------
  function cover({ preparedFor = "Prepared for", client, byline, title, subtitle, stats = [] }) {
    const slide = pptx.addSlide();
    slide.background = { color: T.dark };
    eyebrow(slide, preparedFor, 0.6, 0.5, T.accent);
    slide.addText(client, { x: 0.6, y: 0.82, w: W - 1.2, h: 0.7, fontFace: HEAD, fontSize: 30, bold: true, color: T.inkOnDark });
    slide.addText(byline, { x: 0.6, y: 1.46, w: W - 1.2, h: 0.35, fontFace: BODY, fontSize: 12.5, color: T.mutedOnDark });
    slide.addText(title, { x: 0.6, y: 2.12, w: W - 1.2, h: 1.0, fontFace: HEAD, fontSize: 41, bold: true, color: T.inkOnDark });
    slide.addText(subtitle, { x: 0.62, y: 3.16, w: W - 1.2, h: 0.4, fontFace: BODY, fontSize: 14, color: T.accent });

    // bottom contrasting stat strip
    const py = 4.3, ph = H - 4.3;
    slide.addShape(S.rect, { x: 0, y: py, w: W, h: ph, fill: { color: T.darkPanel }, line: { type: "none" } });
    const n = Math.min(stats.length, 4);
    const colW = W / n;
    stats.slice(0, n).forEach((st, i) => {
      const cx = i * colW + 0.6;
      slide.addText(String(st.n), { x: cx, y: py + 0.24, w: colW - 0.7, h: 0.6, fontFace: HEAD, fontSize: 30, bold: true, color: T.accent });
      slide.addText((st.label || "").toUpperCase(), { x: cx, y: py + 0.84, w: colW - 0.6, h: 0.35, fontFace: BODY, fontSize: 9.5, bold: true, color: T.mutedOnDark, charSpacing: 1.5 });
    });
    return slide;
  }

  // ---- slide 2 — "the short version": 3 cards (light) -------------------
  function threeCards({ eyebrow: ey, title, cards = [] }) {
    const slide = pptx.addSlide();
    slide.background = { color: T.light };
    header(slide, ey, title);
    const n = Math.min(cards.length, 3);
    const gut = 0.3, top = 1.8, ch = 3.5;
    const cw = (W - 2 * MX - (n - 1) * gut) / n;
    cards.slice(0, n).forEach((c, i) => {
      const x = MX + i * (cw + gut);
      roundRect(slide, { x, y: top, w: cw, h: ch, fill: T.card, shadowOp: 0.08 });
      put(slide, String(c.num || i + 1).padStart(2, "0"), { x: x + 0.28, y: top + 0.24, w: 1, h: 0.55, fontFace: HEAD, fontSize: 26, bold: true, color: T.accent });
      put(slide, c.head, { x: x + 0.28, y: top + 0.86, w: cw - 0.56, h: 0.52, fontFace: HEAD, fontSize: 14.5, bold: true, color: T.ink, valign: "top", lineSpacingMultiple: 0.95 });
      put(slide, c.body, { x: x + 0.28, y: top + 1.42, w: cw - 0.56, h: ch - 1.6, fontFace: BODY, fontSize: 10.5, color: T.muted, valign: "top", lineSpacingMultiple: 1.02 });
    });
    return slide;
  }

  // ---- campaigns-at-a-glance grid (light) — 2..6 cards -----------------
  function campaignGrid({ eyebrow: ey, title, items = [], footnote }) {
    const slide = pptx.addSlide();
    slide.background = { color: T.light };
    header(slide, ey, title);
    const n = items.length;
    const cols = n <= 3 ? n : 3;
    const rows = Math.ceil(n / cols);
    const gut = 0.24, top = 1.72;
    const bottom = footnote ? 5.2 : 5.34;
    const cw = (W - 2 * MX - (cols - 1) * gut) / cols;
    const ch = (bottom - top - (rows - 1) * gut) / rows;
    const pad = 0.2;
    items.forEach((it, i) => {
      const r = Math.floor(i / cols), c = i % cols;
      const x = MX + c * (cw + gut), y = top + r * (ch + gut);
      roundRect(slide, { x, y, w: cw, h: ch, fill: T.card, shadowOp: 0.08 });
      put(slide, String(i + 1), { x: x + pad, y: y + 0.13, w: 0.5, h: 0.3, fontFace: HEAD, fontSize: 15, bold: true, color: T.accent });
      const sm = statusMeta(it.statusType);
      badge(slide, it.status, x + cw - 1.12, y + 0.15, { bg: sm.bg, ink: sm.ink, w: 0.92 });
      put(slide, it.name, { x: x + pad, y: y + 0.48, w: cw - 2 * pad, h: 0.4, fontFace: HEAD, fontSize: 12, bold: true, color: T.ink, valign: "top", lineSpacingMultiple: 0.92 });
      put(slide, it.reach, { x: x + pad, y: y + 0.9, w: cw - 2 * pad, h: ch - 1.24, fontFace: BODY, fontSize: 9, color: T.muted, valign: "top", lineSpacingMultiple: 0.94 });
      put(slide, [{ text: (it.roleLabel || "").toUpperCase() + "  ", options: { bold: true, color: T.accent } }, { text: it.roleNote || "", options: { color: T.muted } }],
        { x: x + pad, y: y + ch - 0.32, w: cw - 2 * pad, h: 0.28, fontFace: BODY, fontSize: 8, valign: "middle", charSpacing: 0.3, lineSpacingMultiple: 0.92 });
    });
    if (footnote) put(slide, footnote, { x: MX, y: 5.26, w: W - 2 * MX, h: 0.3, fontFace: BODY, fontSize: 10, italic: true, color: T.muted, valign: "middle" });
    return slide;
  }

  // ---- horizontal step flow (light or dark) ----------------------------
  function stepFlow({ eyebrow: ey, title, lead, steps = [], quality, onDark = false, footer }) {
    const slide = pptx.addSlide();
    slide.background = { color: onDark ? T.dark : T.light };
    header(slide, ey, title, { onDark });
    let top = 1.9;
    if (lead) { slide.addText(lead, { x: MX, y: 1.62, w: W - 2 * MX, h: 0.5, fontFace: BODY, fontSize: 12, color: onDark ? T.mutedOnDark : T.muted, lineSpacingMultiple: 1.0 }); top = 2.35; }
    const n = steps.length;
    const gut = 0.18, arrowW = 0.34;
    const cw = (W - 2 * MX - (n - 1) * (gut + arrowW)) / n;
    const ch = quality ? 2.05 : 2.4;
    steps.forEach((st, i) => {
      const x = MX + i * (cw + gut + arrowW);
      roundRect(slide, { x, y: top, w: cw, h: ch, fill: onDark ? T.cardDark : T.card, shadowOp: onDark ? 0.16 : 0.08 });
      slide.addText(String(st.num || i + 1).padStart(2, "0"), { x: x + 0.2, y: top + 0.2, w: cw - 0.4, h: 0.5, fontFace: HEAD, fontSize: 22, bold: true, color: T.accent });
      slide.addText(st.head, { x: x + 0.2, y: top + 0.74, w: cw - 0.4, h: 0.5, fontFace: HEAD, fontSize: 12.5, bold: true, color: onDark ? T.inkOnDark : T.ink, valign: "top", lineSpacingMultiple: 0.95 });
      slide.addText(st.body, { x: x + 0.2, y: top + 1.24, w: cw - 0.4, h: ch - 1.4, fontFace: BODY, fontSize: 9.5, color: onDark ? T.mutedOnDark : T.muted, valign: "top", lineSpacingMultiple: 0.98 });
      if (i < n - 1) slide.addText("›", { x: x + cw + gut / 2 - 0.02, y: top, w: arrowW, h: ch, fontFace: HEAD, fontSize: 24, bold: true, color: T.accent, align: "center", valign: "middle" });
    });
    if (quality) {
      const qy = top + ch + 0.22;
      roundRect(slide, { x: MX, y: qy, w: W - 2 * MX, h: 0.62, fill: onDark ? T.cardDark : "FBEFD8", shadowOp: 0.05, rectRadius: 0.06 });
      slide.addText([{ text: "Quality rule.  ", options: { bold: true, color: onDark ? T.accent : T.warnInk } }, { text: quality, options: { color: onDark ? T.mutedOnDark : "6A4C12" } }],
        { x: MX + 0.24, y: qy, w: W - 2 * MX - 0.48, h: 0.62, fontFace: BODY, fontSize: 10.5, valign: "middle", lineSpacingMultiple: 0.98 });
    }
    if (footer) slide.addText(footer, { x: MX, y: H - 0.5, w: W - 2 * MX, h: 0.34, fontFace: BODY, fontSize: 10, italic: true, color: onDark ? T.mutedOnDark : T.muted, align: "center", valign: "middle" });
    return slide;
  }

  // ---- decision slide (dark) — badges REQUIRED/CONFIRM/OPTIONAL ---------
  function decisions({ eyebrow: ey, title, note, items = [] }) {
    const slide = pptx.addSlide();
    slide.background = { color: T.dark };
    header(slide, ey, title, { onDark: true, titleSize: 28 });
    if (note) slide.addText(note, { x: MX, y: 1.44, w: W - 2 * MX, h: 0.34, fontFace: BODY, fontSize: 11.5, italic: true, color: T.mutedOnDark, valign: "middle" });
    const n = items.length;
    const cols = n <= 3 ? n : 3, rows = Math.ceil(n / cols);
    const gut = 0.24, top = 1.92, bottom = 5.42;
    const cw = (W - 2 * MX - (cols - 1) * gut) / cols;
    const ch = (bottom - top - (rows - 1) * gut) / rows;
    const badgeColor = (t) => t === "required" ? T.accent : t === "confirm" ? "5B8DB8" : "8A8378";
    const pad = 0.22;
    items.forEach((it, i) => {
      const r = Math.floor(i / cols), c = i % cols;
      const x = MX + c * (cw + gut), y = top + r * (ch + gut);
      roundRect(slide, { x, y, w: cw, h: ch, fill: T.cardDark, shadowOp: 0.18 });
      badge(slide, it.badge, x + pad, y + 0.18, { bg: badgeColor(it.badgeType), ink: "FFFFFF", w: 1.0 });
      put(slide, String(i + 1), { x: x + cw - 0.56, y: y + 0.12, w: 0.4, h: 0.4, fontFace: HEAD, fontSize: 18, bold: true, color: "4A4239", align: "right" });
      put(slide, it.head, { x: x + pad, y: y + 0.56, w: cw - 2 * pad, h: 0.4, fontFace: HEAD, fontSize: 12.5, bold: true, color: T.inkOnDark, valign: "top", lineSpacingMultiple: 0.95 });
      put(slide, it.body, { x: x + pad, y: y + 0.94, w: cw - 2 * pad, h: ch - 1.08, fontFace: BODY, fontSize: 9, color: T.mutedOnDark, valign: "top", lineSpacingMultiple: 0.97 });
    });
    return slide;
  }

  // ---- copy-preview slide (light) — email frame + why-it-works cards ----
  function copyPreview({ eyebrow: ey, title, note, email, whyCards = [] }) {
    const slide = pptx.addSlide();
    slide.background = { color: T.light };
    header(slide, ey, title);
    if (note) slide.addText(note, { x: MX, y: 1.4, w: W - 2 * MX, h: 0.3, fontFace: BODY, fontSize: 11, italic: true, color: T.muted, valign: "middle" });

    // left: email frame
    const fx = MX, fy = 1.82, fw = 5.15, fh = 3.5;
    roundRect(slide, { x: fx, y: fy, w: fw, h: fh, fill: T.card, shadowOp: 0.09, rectRadius: 0.06 });
    const inx = fx + 0.26, inw = fw - 0.52;
    const fld = (label, value, yy, accent) => {
      slide.addText([{ text: label + "  ", options: { color: T.muted, bold: true } }, { text: value, options: { color: accent ? T.accent : T.ink, bold: !!accent } }],
        { x: inx, y: yy, w: inw, h: 0.3, fontFace: BODY, fontSize: 10.5, valign: "middle" });
      slide.addShape(S.line, { x: inx, y: yy + 0.34, w: inw, h: 0, line: { color: T.hair, width: 1 } });
    };
    fld("From:", email.from, fy + 0.18);
    fld("To:", email.to, fy + 0.62);
    fld("Subject:", email.subject, fy + 1.06, true);
    slide.addText(email.body, { x: inx, y: fy + 1.56, w: inw, h: fh - 1.7, fontFace: BODY, fontSize: 10.5, color: T.ink, valign: "top", lineSpacingMultiple: 1.02 });

    // right: 2x2 why-it-works cards
    const gx = fx + fw + 0.28, gtop = 1.82;
    const ggut = 0.2;
    const gcw = (W - MX - gx - ggut) / 2;
    const gch = (5.32 - gtop - ggut) / 2;
    whyCards.slice(0, 4).forEach((c, i) => {
      const r = Math.floor(i / 2), col = i % 2;
      const x = gx + col * (gcw + ggut), y = gtop + r * (gch + ggut);
      roundRect(slide, { x, y, w: gcw, h: gch, fill: T.card, shadowOp: 0.07, rectRadius: 0.06 });
      slide.addText(c.head, { x: x + 0.18, y: y + 0.16, w: gcw - 0.36, h: 0.5, fontFace: HEAD, fontSize: 11, bold: true, color: T.accent, valign: "top", lineSpacingMultiple: 0.95 });
      slide.addText(c.body, { x: x + 0.18, y: y + 0.62, w: gcw - 0.36, h: gch - 0.76, fontFace: BODY, fontSize: 9, color: T.muted, valign: "top", lineSpacingMultiple: 0.97 });
    });
    return slide;
  }

  // ---- full-sequence slide (light) — 2x2 email cards -------------------
  function sequenceGrid({ eyebrow: ey, title, note, emails = [], bodySize = 8.5 }) {
    const slide = pptx.addSlide();
    slide.background = { color: T.light };
    // compact header (single row) so the 4 email cards get maximum height
    eyebrow(slide, ey, MX, 0.32, T.accent);
    heading(slide, title, MX, 0.58, 6.2, 24, T.ink);
    if (note) put(slide, note, { x: 6.2, y: 0.66, w: W - 6.2 - MX, h: 0.4, fontFace: BODY, fontSize: 9.5, italic: true, color: T.muted, align: "right", valign: "middle" });
    const gut = 0.24, top = 1.14, bottom = 5.5;
    const cw = (W - 2 * MX - gut) / 2;
    const ch = (bottom - top - gut) / 2;
    emails.slice(0, 4).forEach((em, i) => {
      const r = Math.floor(i / 2), c = i % 2;
      const x = MX + c * (cw + gut), y = top + r * (ch + gut);
      const ac = em.accent || T.accent;
      roundRect(slide, { x, y, w: cw, h: ch, fill: T.card, shadowOp: 0.08, rectRadius: 0.06 });
      // colored header bar (per-thread accent)
      slide.addShape(S.roundRect, { x, y, w: cw, h: 0.34, fill: { color: ac }, line: { type: "none" }, rectRadius: 0.06 });
      slide.addShape(S.rect, { x, y: y + 0.17, w: cw, h: 0.17, fill: { color: ac }, line: { type: "none" } });
      put(slide, `EMAIL ${em.n}  ·  ${em.threadLabel}`, { x: x + 0.2, y, w: cw - 1.2, h: 0.34, fontFace: BODY, fontSize: 9, bold: true, color: "FFFFFF", charSpacing: 1, valign: "middle" });
      put(slide, em.day, { x: x + cw - 1.15, y, w: 0.95, h: 0.34, fontFace: BODY, fontSize: 9, bold: true, color: "FFFFFF", align: "right", valign: "middle" });
      put(slide, em.subject, { x: x + 0.2, y: y + 0.4, w: cw - 0.4, h: 0.26, fontFace: BODY, fontSize: 9, bold: true, italic: true, color: ac, valign: "middle" });
      put(slide, em.body, { x: x + 0.2, y: y + 0.68, w: cw - 0.4, h: ch - 0.78, fontFace: BODY, fontSize: bodySize, color: T.ink, valign: "top", lineSpacingMultiple: 0.92 });
    });
    return slide;
  }

  // ---- two-column "considered" slide (light) — Appendix A ---------------
  function twoColumn({ eyebrow: ey, title, left, right }) {
    const slide = pptx.addSlide();
    slide.background = { color: T.light };
    header(slide, ey, title);
    const top = 1.9, gut = 0.3, colBottom = 5.32;
    const cw = (W - 2 * MX - gut) / 2;
    const gap = 0.16;
    const rows = Math.max((left.items || []).length, (right.items || []).length, 1);
    const yy0 = top + 0.44;
    const availH = colBottom - yy0;
    const ih = (availH - (rows - 1) * gap) / rows; // shared row height (consistent card size)
    const col = (cx, data) => {
      slide.addText((data.heading || "").toUpperCase(), { x: cx, y: top, w: cw, h: 0.32, fontFace: BODY, fontSize: 10, bold: true, color: T.accent, charSpacing: 1.5 });
      const items = data.items || [];
      const stackH = items.length * ih + (items.length - 1) * gap;
      const startY = yy0 + Math.max(0, (availH - stackH) / 2); // vertically center a short column
      items.forEach((it, i) => {
        const yy = startY + i * (ih + gap);
        roundRect(slide, { x: cx, y: yy, w: cw, h: ih, fill: T.card, shadowOp: 0.07, rectRadius: 0.06 });
        slide.addText([{ text: it.head + ".  ", options: { bold: true, color: T.ink } }, { text: it.body, options: { color: T.muted } }],
          { x: cx + 0.2, y: yy + 0.08, w: cw - 0.4, h: ih - 0.16, fontFace: BODY, fontSize: 9.7, valign: "middle", lineSpacingMultiple: 0.98 });
      });
    };
    col(MX, left);
    col(MX + cw + gut, right);
    return slide;
  }

  // ---- change-request slide (light) — Appendix B -----------------------
  function changeList({ eyebrow: ey, title, note, items = [] }) {
    const slide = pptx.addSlide();
    slide.background = { color: T.light };
    header(slide, ey, title);
    if (note) slide.addText(note, { x: MX, y: 1.4, w: W - 2 * MX, h: 0.3, fontFace: BODY, fontSize: 11, italic: true, color: T.muted, valign: "middle" });
    const top = 1.95, gap = 0.2, n = items.length;
    const ih = (5.3 - top - (n - 1) * gap) / n;
    items.forEach((it, i) => {
      const y = top + i * (ih + gap);
      roundRect(slide, { x: MX, y, w: W - 2 * MX, h: ih, fill: T.card, shadowOp: 0.07, rectRadius: 0.06 });
      slide.addText(it.change, { x: MX + 0.28, y, w: 3.7, h: ih, fontFace: HEAD, fontSize: 13, bold: true, color: T.ink, valign: "middle" });
      slide.addText("→", { x: MX + 4.0, y, w: 0.5, h: ih, fontFace: HEAD, fontSize: 16, bold: true, color: T.accent, align: "center", valign: "middle" });
      slide.addText(it.result, { x: MX + 4.55, y, w: W - 2 * MX - 4.8, h: ih, fontFace: BODY, fontSize: 11, color: T.muted, valign: "middle", lineSpacingMultiple: 0.98 });
    });
    return slide;
  }

  async function save(path) { await pptx.writeFile({ fileName: path }); return path; }

  return { pptx, theme: T, cover, threeCards, campaignGrid, stepFlow, decisions, copyPreview, sequenceGrid, twoColumn, changeList, save };
}

export default createBrief;

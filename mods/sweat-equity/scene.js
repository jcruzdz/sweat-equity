// Scene: sprites and boxes placed in art pixels, drawn back to front.
// One art pixel is u(1) layout px; every sprite is its own image so the
// scene can be rebuilt from live data on each render.

import { div, image } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { SP } from "./sprites.js";

export const DIR = "mods/sweat-equity";
export const INK = "#0a0e2c";
export const NAVY = "#2d2a44";
export const ALERT = "#ffb020";

/** Paint layers. Inside a layer, items sort by their base line (their bottom edge). */
export const L = { FLOOR: 0, RUG: 1, LIGHT: 2, SHADOW: 3, OBJ: 4, TOP: 5, UI: 6 };

/** How each agent status looks in labels: color and glyph. Amber is only ever "needs you". */
export const STATUS = {
  working: { color: "#6aa9ff", glyph: "…", screen: "work" },
  blocked: { color: ALERT, glyph: "!", screen: "wait" },
  done: { color: "#3ecf8e", glyph: "✓", screen: "done" },
  idle: { color: "#aab0c6", glyph: "z", screen: "idle" },
};

/** Colors travel as plain strings; the builders want `#rrggbb[aa]`.
 * @param {string} c @returns {any} */
export const col = (c) => c;

/** A small stable hash, for picking a persona or a variant per agent.
 * @param {string} s */
export function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
}

export class Scene {
  /** @param {(n: number) => number} u art pixels to layout px */
  constructor(u) {
    this.u = u;
    /** @type {[number, number, number, any][]} */
    this.items = [];
    this.n = 0;
    /** @type {string[]} */
    this.missing = [];
  }

  /** Queues an already positioned element. */
  add(el, layer = L.OBJ, base = 0) {
    this.items.push([layer, base, this.n++, el]);
    return el;
  }

  /** @param {string} name @returns {[number, number]} */
  size(name) {
    const s = SP[name];
    if (!s && !this.missing.includes(name)) this.missing.push(name);
    return s ?? [0, 0];
  }

  /** A sprite sized in art pixels, not yet positioned. */
  sprite(name) {
    const [w, h] = this.size(name);
    return image(`${DIR}/sprites/${name}.png`).w(this.u(w)).h(this.u(h));
  }

  /** A sprite with its top left at (x, y). Its base line defaults to its bottom edge. */
  img(name, x, y, layer = L.OBJ, base = null) {
    const [w, h] = this.size(name);
    if (!w) return null;
    const u = this.u;
    return this.add(image(`${DIR}/sprites/${name}.png`).absolute().left(u(x)).top(u(y)).w(u(w)).h(u(h)), layer, base ?? y + h);
  }

  /** A sprite that moves or pulses: the wrapper holds its place, the image inside loops one property. */
  anim(name, x, y, prop, policy, layer = L.OBJ, base = null) {
    const [w, h] = this.size(name);
    if (!w) return null;
    const u = this.u;
    const inner = div().relative().loop(prop, policy).child(image(`${DIR}/sprites/${name}.png`).w(u(w)).h(u(h)));
    return this.add(div().absolute().left(u(x)).top(u(y)).w(u(w)).h(u(h)).child(inner), layer, base ?? y + h);
  }

  /** A flat rectangle that fades in and out: a screen flickering, hands on a keyboard. */
  blink(x, y, w, h, color, period, layer = L.OBJ, base = null, from = 0, to = 1) {
    const u = this.u;
    const inner = div().w(u(w)).h(u(h)).bg(col(color)).loop("opacity", { from, to, period });
    return this.add(div().absolute().left(u(x)).top(u(y)).w(u(w)).h(u(h)).child(inner), layer, base ?? y + h);
  }

  /** A flat rectangle. `color` may carry alpha (`#rrggbbaa`). */
  box(x, y, w, h, color, layer = L.OBJ, base = null) {
    const u = this.u;
    return this.add(div().absolute().left(u(x)).top(u(y)).w(u(w)).h(u(h)).bg(col(color)), layer, base ?? y + h);
  }

  /** A soft contact shadow under an object. */
  shadow(x, y, w, h = 3) {
    const u = this.u;
    return this.add(div().absolute().left(u(x)).top(u(y)).w(u(w)).h(u(h)).rounded(u(h / 2)).bg(col(NAVY + "40")), L.SHADOW, y);
  }

  /** A sprite standing on the floor, with its contact shadow. */
  stand(name, x, y, shadowW = 0, base = null) {
    const [w, h] = this.size(name);
    if (shadowW) this.shadow(x + (w - shadowW) / 2 + 1, y + h - 3, shadowW, shadowW < 14 ? 3 : 4);
    return this.img(name, x, y, L.OBJ, base);
  }

  /** Positions any element at (x, y), on top of the art by default. */
  at(el, x, y, layer = L.UI, base = 0) {
    const u = this.u;
    return this.add(el.absolute().left(u(x)).top(u(y)), layer, base);
  }

  /** Every queued element, back to front. */
  elements() {
    return this.items.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]).map((t) => t[3]);
  }
}

/** Text size in layout px for a size given in art pixels, never below what stays readable. */
export const fpx = (u, art, min = 9.5) => Math.max(u(art), min);

/** A name label: status dot, name, status glyph. The glyph repeats the color so
 * status reads without color. `onClick` makes it a button. */
export function pill(u, id, text, state, maxW, onClick = null) {
  const s = STATUS[state];
  const c = s ? s.color : "#ffffff";
  const dot = Math.max(u(2.6), 6);
  let el = h_flex().id(id).h(Math.max(u(7), 15)).px(u(2)).gap(u(1.4)).items_center().rounded(u(2)).bg(col("#23263a"))
    .border(Math.max(1, u(0.6))).border_color(col(c)).max_w(u(maxW))
    .text_size(fpx(u, 4.1, 10)).font_semibold().text_color(col("#ffffff"))
    .child(div().flex_none().w(dot).h(dot).rounded(dot / 2).bg(col(c)))
    .child(div().truncate().child(text));
  if (s) el = el.child(div().flex_none().font_bold().text_color(col(c)).child(s.glyph));
  if (onClick) el = el.cursor_pointer().tooltip(text).on_click(onClick);
  return el;
}

/** A coworker's label in two lines: who (the job for a helper, a star for a lead) and what they are on. */
export function card(u, id, a, maxW, onClick = null) {
  const s = STATUS[a.state], c = s ? s.color : "#ffffff";
  const who = (a.lead ? "★ " : "") + (a.sub ? a.role : a.name), dot = Math.max(u(2.2), 5);
  let top = h_flex().gap(u(1.2)).items_center()
    .child(div().flex_none().w(dot).h(dot).rounded(dot / 2).bg(col(c)))
    .child(div().flex_1().truncate().text_size(fpx(u, 3, 8)).font_bold().text_color(col(a.lead ? "#f4f4f8" : "#94b0c2")).child(who.toUpperCase()));
  if (s) top = top.child(div().flex_none().text_size(fpx(u, 3.4, 8.5)).font_bold().text_color(col(c)).child(s.glyph));
  let el = v_flex().id(id).w(u(maxW)).px(u(1.8)).py(u(0.9)).gap(u(0.4)).rounded(u(2)).bg(col("#23263a"))
    .border(Math.max(1, u(0.6))).border_color(col(c))
    .child(top)
    .child(div().truncate().text_size(fpx(u, 3.7, 9.5)).font_semibold().text_color(col("#ffffff")).child(a.doing));
  if (onClick) el = el.cursor_pointer().tooltip(`${who} · ${a.doing}`).on_click(onClick);
  return el;
}

/** What one coworker says in full, for a few seconds. */
export function bubble(u, text, maxW) {
  return h_flex().max_w(u(maxW)).h(Math.max(u(8), 18)).px(u(2.5)).items_center().rounded(u(2.5)).bg(col("#f4f4f8"))
    .border(Math.max(1, u(0.6))).border_color(col("#23263a")).text_size(fpx(u, 3.9, 10)).font_semibold().text_color(col("#23263a"))
    .child(div().truncate().child(text));
}

/** Centers an element on `cx` by wrapping it in a fixed-width row. */
export function centered(sc, el, cx, y, width, layer = L.UI) {
  const u = sc.u;
  return sc.at(h_flex().w(u(width)).justify_center().child(el), cx - width / 2, y, layer);
}

/** A small square tag: floor numbers, ticket keys. */
export function tag(u, text, fg = "#f4f4f8", border = null) {
  let el = h_flex().h(Math.max(u(6), 13)).px(u(1.6)).items_center().bg(col(INK)).text_size(fpx(u, 3.6, 9)).font_bold().text_color(col(fg)).child(text);
  if (border) el = el.border(Math.max(1, u(0.5))).border_color(col(border));
  return el;
}

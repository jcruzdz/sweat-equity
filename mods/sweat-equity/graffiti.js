// The company name painted on the board in the middle of a floor, in graffiti pixel letters: a dark outline,
// a red offset shadow and a hand-painted wobble. Each letter is two small pictures (sprites/go_*.png for the outline,
// icons/gf-*.svg for the fill, made by art/), so the fill takes the floor's color and the whole name is about a dozen elements.

import { svg } from "gpui-kit";
import { L, DIR, col, hash } from "./scene.js";

const FILE = { "-": "dash", ".": "dot", "_": "under" };
export const NAME_MAX = 10;

/** The name as it is painted: upper case without accents, only letters, digits and a few marks, ten at most. */
export function paintable(name) {
  return String(name).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9 ._-]/g, "").slice(0, NAME_MAX);
}

/** Paints the name centered on (cx, cy), `base` being the line it sorts on. Each letter is two small pictures: the outline with its
 * red shadow (a sprite, in its own colors) and the fill (an svg, which takes `color` like an icon does). All outlines go first. */
export function paintName(sc, name, cx, cy, color, base, muted = false) {
  const s = paintable(name), u = sc.u, step = s.length > 9 ? 5 : 6, h = hash(s);
  const x0 = Math.round(cx - ((s.length - 1) * step + 5) / 2) - 1, y0 = Math.round(cy - 4);
  const at = (i) => [x0 + i * step, y0 + ((h >> i) & 1)];      // some letters sit a pixel low, as if painted by hand
  const file = (ch) => FILE[ch] ?? ch;
  [...s].forEach((ch, i) => { if (ch === " ") return; const [x, y] = at(i); sc.img(`go_${file(ch)}`, x, y, L.TOP, base); });
  [...s].forEach((ch, i) => { if (ch === " ") return; const [x, y] = at(i); sc.at(svg(`${DIR}/icons/gf-${file(ch)}.svg`).size(u(10)).text_color(col(muted ? "#56608f" : color)), x, y, L.TOP, base + 0.5); });
}

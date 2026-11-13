// The tower from outside, at night: one floor per workspace, one window per
// development (a Herdr space). A lit window means agents are in.

import { div, image, svg } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { Scene, L, STATUS, INK, ALERT, DIR, col, hash, tag, centered, fpx } from "./scene.js";
import { SPOTS, PEOPLE } from "./sprites.js";
import { paintName } from "./graffiti.js";

export const BW = 292;          // building width, art px
const FLOOR_H = 58, ROOF_H = 32, LOBBY_H = 52, GROUND_H = 24, SKY_MIN = 26, SIDE_MIN = 18;
const SIGN_X = 118, SIGN_W = 56, BAY_W = 63;
const Y0 = 12;                          // a floor starts with its slab; the windows start this far down (art px)
const BAY_XS = [11, 80, 149, 218];      // four contiguous windows; the board hangs in the slab above them
export const BAYS = 4;          // windows per floor; a workspace with more developments gets another floor above

/** The tower bottom-up, one entry per floor: a workspace with more developments than windows continues on the next floor. */
export function stackOf(floors) {
  return floors.flatMap((f) => {
    const n = Math.max(1, Math.ceil(f.spaces.length / BAYS));
    return Array.from({ length: n }, (_, k) => ({ floor: n === 1 ? f : { ...f, spaces: f.spaces.slice(k * BAYS, (k + 1) * BAYS) }, all: f.spaces.length, cont: k, last: k === n - 1 }));
  });
}
const SKY = ["#0c1034", "#0e1238", "#10143d", "#111741", "#131946", "#151b4a", "#171d4f", "#182053", "#1a2258", "#1c245c", "#1e2661", "#1f2965", "#212b6a", "#232d6e"];

/** The largest whole scale at which a tower of `floors` fits the area. */
export function facadeScale(wpx, hpx, floors) {
  const need = ROOF_H + floors * FLOOR_H + LOBBY_H + GROUND_H + SKY_MIN;
  return Math.max(1, Math.min(4, Math.floor(2 * Math.min(wpx / (BW + 2 * SIDE_MIN), hpx / need)) / 2));
}

/**
 * @param {Scene} sc
 * @param {{ W: number, H: number }} area  size in art px
 * @param {{ floors: any[], available: boolean, waiting: number, finished: number, loose?: any[], hiddenN?: number }} model  floors bottom-up;
 *   a floor with `hidden` is an empty shell, drawn only while the hidden floors are being shown
 * @param {any} opt  t, peek (the hidden floors are shown), and what clicks do: onEnter(name, cx), onSpace(dev), onAdd(cx), onInbox(),
 *   onDone(); onNew(name, cx), onEdit(name, cx), onHide(name), onDev(dev, cx) and onPeek(cx) are null where they make no sense
 */
export function buildFacade(sc, area, model, opt) {
  const u = sc.u, t = opt.t;
  const W = Math.ceil(area.W), H = Math.ceil(area.H);
  const gy = H - GROUND_H;
  const stack = stackOf(model.floors);
  const rows = [...stack].reverse().map((r, i) => ({ ...r, tag: `P${stack.length - i}` }));
  if (model.available) rows.unshift({ floor: null, tag: `P${stack.length + 1}` });
  const lobbyY = gy - LOBBY_H;
  const top = lobbyY - rows.length * FLOOR_H - ROOF_H;
  const BX = Math.floor((W - BW) / 2);

  // sky, stars, moon, clouds, far skyline
  const band = Math.ceil(gy / SKY.length);
  SKY.forEach((c, i) => sc.box(0, i * band, W, band + 1, c, L.FLOOR, -9));
  for (let x = 0; x < W; x += 220) for (let y = 0; y < gy * 0.6; y += 150) sc.img("stars", x, y, L.FLOOR, -8);
  const moonX = Math.max(6, BX - 60);
  sc.img("moon", moonX, 10, L.FLOOR, -7);
  // the moon is the way back for hidden floors. It is always a button: with nothing hidden it says so (the eye on each floor hides one)
  if (opt.onPeek) {
    const [mw, mh] = sc.size("moon");
    const tip = opt.peek ? t.peekOff : model.hiddenN > 0 ? `${t.peekOn} (${model.hiddenN})` : opt.onHide ? `${t.peekNone} · ${t.peekHint}` : t.peekNone;
    let moon = div().id("se-moon").w(u(mw)).h(u(mh)).rounded(u(mw / 2)).cursor_pointer().tooltip(tip)
      .on_click((_e, cx) => opt.onPeek(cx));
    if (opt.peek) moon = moon.border(Math.max(1, u(0.6))).border_color(col("#f4f4f866"));   // a faint ring while they are shown
    sc.at(moon, moonX, 10, L.UI);
  }
  [[0.3, 30, 0], [0.7, 16, 1], [0.84, 58, 2], [0.02, 66, 3]].forEach(([fx, y, k]) => sc.img(`cloud_${k}`, Math.round(W * fx), y, L.FLOOR, -6));
  for (let x = 0; x < W; x += 220) sc.img("skyline", x, gy - 96, L.FLOOR, -5);
  sc.box(0, gy - 40, W, 40, "#232d6e5a", L.FLOOR, -4);
  for (let x = 0; x < W; x += 220) sc.img("ground", x, gy, L.RUG, 0);

  // light on the lawn, path, trees, hedges, street lamps
  sc.box(BX + 20, gy, BW - 40, 4, "#ffb34728", L.LIGHT);
  sc.box(BX + 40, gy + 4, BW - 80, 3, "#ffb34716", L.LIGHT);
  sc.img("path", BX + BW / 2 - 48, gy, L.LIGHT);
  [[BX - 74, 0], [BX + BW + 22, 2], [BX + BW + 46, 3]].forEach(([x, k]) => sc.img(`tree_${k}`, x, gy - 40, L.OBJ, gy + 2));
  [6, 34, 62, BW - 88, BW - 60, BW - 32].forEach((dx, i) => sc.img(`hedge_${i}`, BX + dx, gy - 9, L.OBJ, gy + 4));
  [BX - 40, BX + BW + 10].forEach((x) => {
    sc.img("lamp_glow", x - 20, gy - 46, L.LIGHT);
    sc.img("lamp_post", x, gy - 38, L.OBJ, gy + 3);
  });

  // the building: roof, one module per floor, lobby
  sc.img("roof", BX, top, L.OBJ, top);
  rows.forEach((row, i) => floorModule(sc, opt, row, BX, top + ROOF_H + i * FLOOR_H));
  sc.img("lobby", BX, lobbyY, L.OBJ, lobbyY);
  const bodyTop = top + ROOF_H, bodyH = gy - bodyTop;
  [BX - 1, BX + BW - 1].forEach((x) => {
    sc.box(x, bodyTop, 1, bodyH, "#3f4763", L.OBJ, gy);
    sc.box(x + 1, bodyTop, 1, bodyH, "#1d2135", L.OBJ, gy);
  });
  sc.at(tag(u, t.ground, "#f4f4f8", "#f4f4f8"), BX - 17, lobbyY + 18);

  // on the path: how many agents wait for you, and how many finished while you were not looking
  const notice = (id, bg, label, click) => h_flex().id(id).h(Math.max(u(8), 17)).px(u(3)).gap(u(1.5)).items_center().flex_none().bg(col(bg)).border(Math.max(1, u(0.6))).border_color(col(INK))
    .text_size(fpx(u, 4.2, 10)).font_bold().text_color(col(INK)).cursor_pointer()
    .on_click(() => click())
    .child(label);
  const notices = [];
  if (model.waiting > 0) notices.push(notice("se-inbox", ALERT, `! ${model.waiting} ${model.waiting === 1 ? t.waitsOne : t.waitsMany}`, opt.onInbox));
  if (model.finished > 0) notices.push(notice("se-finished", STATUS.done.color, `✓ ${model.finished} ${model.finished === 1 ? t.doneOne : t.doneMany}`, opt.onDone));
  if (notices.length) centered(sc, h_flex().gap(u(3)).children(notices), BX + BW / 2, gy + 9, 240);

  outside(sc, opt, model.loose ?? [], BX, gy);
  return { BX, top, gy };
}

/** What a window says when pointed at: the development, then each story it works on with its name, status and progress. */
function spaceTip(s, opt) {
  const lines = (s.keys ?? []).map((k) => {
    const i = opt.issues?.[k];
    if (!i) return k;
    const c = i.counts, total = c ? c.reduce((a, b) => a + b, 0) : 0;
    return [k, i.summary, i.status, total ? `${c[c.length - 1]}/${total}` : ""].filter(Boolean).join(" · ");
  });
  return [s.title ?? s.name, ...lines].join("\n");
}

/** Developments on no floor wait outside, by the bench: a click sends one to a floor. */
function outside(sc, opt, loose, BX, gy) {
  if (!loose.length || !opt.onDev) return;
  const u = sc.u, x0 = BX + BW / 2 + 54;
  sc.stand("bench_out", x0, gy + 7, 24);
  loose.slice(0, 3).forEach((d, i) => {
    const x = x0 + 32 + i * 24;
    sc.stand(`p${hash(d.id) % PEOPLE}_front`, x, gy - 4, 12);
    const who = h_flex().id(`se-loose-${d.id}`).h(Math.max(u(7), 15)).px(u(2)).gap(u(1.2)).items_center().rounded(u(2)).bg(col("#23263a"))
      .border(Math.max(1, u(0.6))).border_color(col("#f4f4f8")).max_w(u(40))
      .text_size(fpx(u, 4.1, 10)).font_semibold().text_color(col("#ffffff")).cursor_pointer().tooltip(`${d.title} · ${opt.t.outside}`)
      .on_click((_e, cx) => opt.onDev(d, cx))
      .child(div().truncate().child(d.name))
      .child(div().flex_none().font_bold().child("?"));
    centered(sc, who, x + 8, gy - 13 - (i % 2) * 8, 42);
  });
  if (loose.length > 3) sc.at(tag(u, `+${loose.length - 3}`), x0 + 32 + 3 * 24, gy + 6);
}

/** A small icon that is a button inside something that is itself clickable. */
function iconButton(u, id, name, tip, color, click) {
  return div().id(id).flex_none().p(u(0.7)).rounded(u(1)).cursor_pointer().tooltip(tip)
    .hover((s) => s.bg(col("#26305e")))
    .on_click((_e, cx) => { cx.stop_propagation(); click(cx); })
    .child(svg(`${DIR}/icons/${name}.svg`).size(Math.max(u(4.4), 11)).text_color(col(color)));
}

function floorModule(sc, opt, row, BX, y) {
  const u = sc.u, t = opt.t, f = row.floor;
  const ghost = !!(f && f.hidden);   // a hidden floor, drawn only while the moon shows them: an empty, muted shell
  const accent = ghost ? "#56608f" : f ? f.color : "#94b0c2";
  sc.img("floor_body", BX, y, L.OBJ, y);
  // light strips at both ends, in the company color
  [BX + 4, BX + BW - 6].forEach((x) => {
    sc.box(x - 3, y + Y0 + 6, 8, 34, accent + "12", L.OBJ, y + 1);
    sc.box(x - 1, y + Y0 + 7, 4, 32, accent + "22", L.OBJ, y + 1);
    sc.box(x, y + Y0 + 8, 2, 30, accent, L.OBJ, y + 1);
    sc.box(x, y + Y0 + 8, 2, 2, "#fff3d6", L.OBJ, y + 2);
  });
  sc.at(tag(u, row.tag, "#f4f4f8", "#f4f4f8"), BX - 17, y + Y0 + 14);

  // the board hangs in the slab above the windows: the company name painted on it, or the invitation to add a workspace.
  // Beside it, in the slab, the floor's own controls. A workspace's second floor says "NAME 2" and has no controls.
  const bx = BX + SIGN_X, by = y + 2, mid = bx + SIGN_W / 2, ctlX = BX + 210, ctlY = y + 3;
  if (f && ghost) {
    paintName(sc, f.name, mid, by + 4.5, "#56608f", y + 5, true);
    sc.at(div().id(`se-sign-${f.name}`).w(u(SIGN_W)).h(u(11)).tooltip(`${f.name} · ${t.ghost}`), bx, by);
    const ctl = h_flex().gap(u(1.5)).items_center().child(div().text_size(fpx(u, 3.4, 8.5)).text_color(col("#94b0c2")).child(t.ghost));
    centered(sc, opt.onHide ? ctl.child(iconButton(u, `se-eye-${f.name}`, "eye-off", t.showFloor, "#c9d6e0", () => opt.onHide(f.name))) : ctl, ctlX, ctlY, 70);
  } else if (f) {
    const first = row.cont === 0;
    paintName(sc, first ? f.name : `${f.name.slice(0, 8)} ${row.cont + 1}`, mid, by + 4.5, accent, y + 5);
    sc.at(div().id(first ? `se-sign-${f.name}` : `se-sign-${f.name}-${row.cont + 1}`).w(u(SIGN_W)).h(u(11)).cursor_pointer()
      .tooltip(`${f.name} · ${row.all} ${t.devs} · ${t.enter}`)
      .on_click((_e, cx) => opt.onEnter(f.name, cx)), bx, by);
    if (first && (opt.onEdit || opt.onNew)) {
      let ctl = h_flex().gap(u(2.2)).items_center();
      if (opt.onNew) {
        ctl = ctl.child(div().id(`se-new-${f.name}`).px(u(1.2)).text_size(fpx(u, 4.4, 11)).font_bold().text_color(col(accent)).cursor_pointer().tooltip(t.newBtn)
          .on_click((_e, cx) => { cx.stop_propagation(); opt.onNew(f.name, cx); })
          .child("+"));
      }
      if (opt.onEdit) {
        if (opt.onHide) ctl = ctl.child(iconButton(u, `se-eye-${f.name}`, "eye", t.hideFloor, "#c9d6e0", () => opt.onHide(f.name)));
        ctl = ctl.child(iconButton(u, `se-edit-${f.name}`, "pen", t.editFloor, "#c9d6e0", (cx) => opt.onEdit(f.name, cx)));
      }
      centered(sc, ctl, ctlX, ctlY, 70);
    }
  } else {
    const add = h_flex().id("se-add").w(u(SIGN_W)).h(u(11)).items_center().justify_center()
      .border(Math.max(1, u(0.5))).border_dashed().border_color(col("#94b0c2")).cursor_pointer().tooltip(t.vacant)
      .on_click((_e, cx) => opt.onAdd(cx))
      .child(div().text_size(fpx(u, 4, 9.5)).font_bold().text_color(col("#f4f4f8")).child(t.addWorkspace));
    sc.at(add, bx, by);
  }

  // one window per development
  for (let j = 0; j < BAYS; j++) {
    const x = BX + BAY_XS[j];
    const s = f ? f.spaces[j] : null;
    if (!s || !s.agents) {
      sc.img(`win_dark_${j % 3}`, x, y + Y0 + 6, L.OBJ, y + Y0 + 3);
    } else {
      const lit = `win_lit_${Math.min(3, s.agents)}_${hash(s.id) % 4}`, busy = s.status === "working";
      // a working window breathes; the others just glow
      if (busy) sc.anim("halo", x - 4, y + Y0 + 2, "opacity", { from: 0.4, to: 1, period: 1700 }, L.OBJ, y + Y0 + 2);
      else sc.img("halo", x - 4, y + Y0 + 2, L.OBJ, y + Y0 + 2);
      sc.img(lit, x, y + Y0 + 6, L.OBJ, y + Y0 + 3);
      sc.box(x, y + Y0 + 34, BAY_W, 1, "#ffb3476e", L.OBJ, y + Y0 + 4);
      // ...and inside, screens change and hands move
      if (busy) (SPOTS[lit] ?? []).forEach(([sx, sy, hx, hy], n) => {
        sc.blink(x + sx, y + Y0 + 6 + sy, 4, 3, "#23346e", 640 + n * 190, L.OBJ, y + Y0 + 5, 0, 0.8);
        sc.blink(x + hx, y + Y0 + 6 + hy, 1, 1, "#fff3d6", 230 + n * 50, L.OBJ, y + Y0 + 5);
        sc.blink(x + hx + (sx > hx ? 1 : -1), y + Y0 + 6 + hy, 1, 1, "#fff3d6", 230 + n * 50, L.OBJ, y + Y0 + 5, 1, 0);
      });
    }
    if (!s) {
      // the first empty window of a floor offers to start something there
      if (f && !ghost && opt.onNew && row.last && j === f.spaces.length) {
        const fresh = h_flex().id(`se-newbay-${f.name}`).w(u(BAY_W)).h(u(7)).items_center().justify_center().bg(col(INK))
          .border(Math.max(1, u(0.5))).border_dashed().border_color(col("#56608f"))
          .text_size(fpx(u, 4, 9.5)).font_semibold().text_color(col("#c9d6e0")).cursor_pointer()
          .on_click((_e, cx) => opt.onNew(f.name, cx))
          .child(t.newBtn);
        sc.at(fresh, x, y + Y0 + 36);
      }
      continue;
    }
    const look = STATUS[s.status];
    let chip = h_flex().id(`se-space-${s.id}`).w(u(BAY_W)).h(u(7)).px(u(1.8)).gap(u(1.5)).items_center().bg(col(INK))
      .border(Math.max(1, u(0.5))).border_color(col(look ? look.color : "#3b4262"))
      .text_size(fpx(u, 4, 9.5)).text_color(col("#f4f4f8")).cursor_pointer().tooltip(spaceTip(s, opt))
      .on_click(() => opt.onSpace(s))
      .child(div().flex_1().truncate().font_semibold().child(s.keys.length ? s.keys[0] + (s.keys.length > 1 ? ` +${s.keys.length - 1}` : "") : s.name));
    // right click: move it to another floor
    if (opt.onDev) chip = chip.on_mouse_down("right", (_e, cx) => opt.onDev(s, cx));
    if (s.agents) chip = chip.child(div().flex_none().text_color(col(look ? look.color : "#c9d6e0")).child(`×${s.agents}`));
    // the story's board, when Jira says: four bars, to do / in progress / review / done, each as tall as its share of the subtasks
    const iss = s.keys.length ? opt.issues?.[s.keys[0]] : null, cols = iss?.cols, tot = cols ? cols.reduce((p, q) => p + q, 0) : 0;
    if (tot) {
      // as in the design: four columns, each a stack of ticks on a dark ground; the one the story is in is lit
      const top = Math.max(...cols);
      chip = chip.child(h_flex().flex_none().items_end().gap(u(0.7)).h(u(5)).children(cols.map((n, c) => {
        const lit = c === iss.curCol;
        return v_flex().w(u(1.8)).h(u(5)).justify_end().bg(col(lit ? "#3a4580" : "#1c2452"))
          .child(div().w(u(1.8)).h(n ? Math.max(u(1.2), u(5 * n / top)) : 0).bg(col(lit ? "#ffffff" : "#94b0c2")));
      })));
    }
    sc.at(chip, x, y + Y0 + 36);
    if (s.status === "blocked") {
      const [bw, bh] = sc.size("beacon");
      const bob = div().relative().loop("top", { from: 0, to: u(-2), period: 900 })
        .child(image(`${DIR}/sprites/beacon.png`).w(u(bw)).h(u(bh)));
      sc.at(div().child(bob), x + BAY_W - 14, y + Y0 + 8, L.TOP);   // inside the window, top right: the wrapper holds the place, the inner one bobs
    }
    // agents at work: a blue badge with its dots, the third of the set (waiting, working, finished)
    if (s.status === "working" && s.agents) sc.img("beacon_work", x + BAY_W - 14, y + Y0 + 8, L.TOP);
    // finished and nobody has looked yet: a green flag, until you visit
    if (s.status === "done") sc.anim("beacon_done", x + BAY_W - 14, y + Y0 + 8, "opacity", { from: 0.55, to: 1, period: 1500 }, L.TOP);
  }
}

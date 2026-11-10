// One floor from above, three-quarter view: a room per squad (the agents working
// one ticket), a lounge for agents with no ticket, and spare rooms with the lights off.

import { div } from "gpui-kit";
import { h_flex } from "gpui-base";
import { Scene, L, STATUS, NAVY, col, hash, pill, card, bubble, centered, fpx } from "./scene.js";
import { PEOPLE } from "./sprites.js";

const FACE_H = 26;                       // height of a wall's visible face
const ROOM_W = 141, PITCH = 145;          // room interior and room + wall
const ROW_H = 200, LOUNGE_H = 106;        // a row of rooms with its corridor; the common row
export const SEATS = 6;                   // desks per room: three facing pods
const CAP = "#444c6b", CAP_HI = "#5d668c", CAP_LO = "#363d5b";
const FACE = "#f1e6d6", FACE_SH = "#ddd0c4", FACE_2 = "#eadecd", BASE = "#b7a9a6", BASE_HI = "#cdcac9";
// rug color per room, with its light and dark edge
const RUGS = [["#aab3cf", "#c2cfe0", "#939cba"], ["#9fc9b8", "#b6d9c7", "#8ab5a5"], ["#c3b9e0", "#e0d3f2", "#aba0ca"], ["#a9cbd6", "#c2e4e7", "#92b4c1"]];
const PROPS = ["prop_mug_0", "prop_mug_1", "prop_mug_2", "prop_mug_3", "prop_paper", "prop_notes", "prop_lamp", "prop_succulent", "prop_robot", "prop_books", "prop_headphones", "prop_photo"];

export function officeSize(cols, rooms) {
  const rows = Math.max(1, Math.ceil(Math.max(1, rooms) / cols));
  return { cols, rows, w: 4 + cols * PITCH, h: rows * ROW_H + LOUNGE_H };
}

/** Columns and whole scale that show the floor largest: highest scale, then fewest spare rooms. */
export function officeFit(wpx, hpx, rooms) {
  let best = null;
  for (const cols of [2, 3, 4]) {
    const s = officeSize(cols, rooms);
    const k = Math.max(1, Math.min(4, Math.floor(Math.min(wpx / s.w, hpx / s.h))));
    const spare = s.rows * cols - rooms;
    if (!best || k > best.k || (k === best.k && spare < best.spare)) best = { ...s, k, spare };
  }
  return best;
}

function wallH(sc, x, y, w, layer = L.OBJ) {
  const b = y + 4;
  sc.box(x, y, w, 4, CAP, layer, b);
  sc.box(x, y, w, 1, CAP_HI, layer, b);
  sc.box(x, y + 3, w, 1, CAP_LO, layer, b);
  sc.box(x, y + 4, w, FACE_H, FACE, layer, b);
  sc.box(x, y + 4, w, 2, FACE_SH, layer, b);
  sc.box(x, y + 6, w, 1, FACE_2, layer, b);
  sc.box(x, y + 4 + FACE_H - 3, w, 3, BASE, layer, b);
  sc.box(x, y + 4 + FACE_H - 3, w, 1, BASE_HI, layer, b);
  sc.box(x, y + 4 + FACE_H, w, 2, NAVY + "2e", L.SHADOW, y);
  sc.box(x, y + 6 + FACE_H, w, 1, NAVY + "14", L.SHADOW, y);
}

function wallV(sc, x, y, h, layer = L.OBJ, base = null, shade = true) {
  const b = base ?? y + h;
  sc.box(x, y, 4, h, CAP, layer, b);
  sc.box(x, y, 1, h, CAP_HI, layer, b);
  sc.box(x + 3, y, 1, h, CAP_LO, layer, b);
  if (shade) sc.box(x + 4, y, 2, h, NAVY + "28", layer, b);
}

function rug(sc, x, y, w, h, colors) {
  sc.box(x, y, w, h, colors[0], L.RUG);
  sc.box(x + 2, y + 2, w - 4, 1, colors[1], L.RUG);
  sc.box(x + 2, y + 2, 1, h - 4, colors[1], L.RUG);
  sc.box(x + 2, y + h - 3, w - 4, 1, colors[2], L.RUG);
  sc.box(x + w - 3, y + 2, 1, h - 4, colors[2], L.RUG);
}

/**
 * @param {Scene} sc
 * @param {{ cols: number, rows: number, w: number, h: number }} fit
 * @param {{ name: string, color: string, rooms: any[], lounge: any[] }} model
 * @param {any} opt  t, what clicks do (onAgent(agent), onIssue(room), onNew(cx) or null) and `spot`: the id of
 *   the coworker whose turn it is to say in full what they are doing
 */
export function buildOffice(sc, fit, model, opt) {
  const { cols, rows, w: W, h: H } = fit;
  opt.W = W;
  for (let x = 0; x < W; x += 300) for (let y = 0; y < H; y += 240) sc.img("wood", x, y, L.FLOOR, -1);

  for (let r = 0; r < rows; r++) {
    const y0 = r * ROW_H;
    wallH(sc, 0, y0, W);
    wallH(sc, 0, y0 + 150, W);
    for (let c = 0; c < cols; c++) {
      const x0 = 4 + c * PITCH, i = r * cols + c;
      if (c < cols - 1) wallV(sc, x0 + ROOM_W, y0 + 4, 148, L.OBJ, y0 + 153);
      if (model.rooms[i]) room(sc, opt, x0, y0, model.rooms[i], i);
      else spareRoom(sc, opt, x0, y0, i);
      // something against the corridor wall, next to each door
      const decor = ["plant_2_0", "water_cooler", "plant_1_1"][i % 3];
      sc.stand(decor, x0 + 121, y0 + 184 - sc.size(decor)[1], 10);
    }
  }
  lounge(sc, opt, model, rows * ROW_H, W, H);

  wallV(sc, 0, 0, H - 4, L.TOP, H, true);
  wallV(sc, W - 4, 0, H - 4, L.TOP, H, false);
  sc.box(0, H - 4, W, 4, CAP, L.TOP, H);
  sc.box(0, H - 4, W, 1, CAP_HI, L.TOP, H);
}

/** A squad room: whiteboard with the ticket, desks in facing pods, door and plaque to the corridor. */
function room(sc, opt, x0, y0, R, i) {
  const u = sc.u, t = opt.t;
  rug(sc, x0 + 4, y0 + 42, ROOM_W - 8, 88, RUGS[i % RUGS.length]);
  sc.img(`window_${i % 3}`, x0 + 8, y0 + 8, L.OBJ, y0 + 31);

  // whiteboard: ticket and status on the title strip, one dark card per subtask
  const wx = x0 + 43;
  sc.img("whiteboard", wx, y0 + 5, L.OBJ, y0 + 31);
  if (R.cur >= 0) sc.box(wx + 2 + R.cur * 17, y0 + 12, 16, 9, "#cfe0ff", L.OBJ, y0 + 32);
  (R.counts ?? []).forEach((n, c) => {
    for (let k = 0; k < Math.min(n, 9); k++) sc.box(wx + 4 + c * 17 + (k % 3) * 4, y0 + 13 + Math.floor(k / 3) * 3, 3, 2, "#3d4463", L.OBJ, y0 + 33);
  });
  const title = h_flex().id(`se-board-${R.key}`).w(u(50)).h(u(5)).px(u(1.5)).items_center().cursor_pointer().tooltip(R.title || R.key)
    .text_size(fpx(u, 3.5, 8.5)).font_bold().text_color(col("#23263a"))
    .on_click(() => opt.onIssue(R))
    .child(div().truncate().child(R.statusText ? `${R.key} · ${R.statusText}` : R.key));
  sc.at(title, wx + 2, y0 + 6);

  sc.img(i % 2 ? "clock" : `picture_${i % 3}`, x0 + 102, y0 + (i % 2 ? 10 : 9), L.OBJ, y0 + 31);
  sc.stand(`cabinet_${i % 3}`, x0 + 113, y0 + 22, 22);
  const onTop = ["prop_succulent", "prop_books", "prop_photo"][i % 3];
  sc.img(onTop, x0 + 129 - sc.size(onTop)[0], y0 + 25 - sc.size(onTop)[1], L.OBJ, y0 + 42);
  sc.stand(`plant_${i % 3}_${i % 3}`, x0 + 2, y0 + 20, 11);
  sc.stand(`plant_${(i + 1) % 3}_${(i + 1) % 3}`, x0 + 120, y0 + 124, 11);
  sc.stand("bin", x0 + 10, y0 + 138, 8);

  // desks: pairs face each other; an odd agent gets a desk alone
  const seated = R.agents.slice(0, SEATS);
  const units = [];
  for (let k = 0; k + 1 < seated.length; k += 2) units.push([seated[k], seated[k + 1]]);
  if (seated.length % 2) units.push([null, seated[seated.length - 1]]);
  const total = units.length * 36 + (units.length - 1) * 6;
  const ux = x0 + Math.floor((ROOM_W - total) / 2);
  units.forEach((pair, j) => {
    const px = ux + j * 42, seed = hash(R.key) + j * 7;
    if (pair[0]) pod(sc, opt, px, y0 + 74, pair[0], pair[1], seed);
    else single(sc, opt, px, y0 + 83, pair[1], seed);
  });
  if (R.more > 0) sc.at(pill(u, `se-more-${R.key}`, `+${R.more}`, null, 30), x0 + ROOM_W - 30, y0 + 140);

  // corridor side: door and the room's plaque
  sc.img(i % 3 === 2 ? "door_l" : "door_r", x0 + 14, y0 + 154, L.OBJ, y0 + 184);
  sc.box(x0 + 44, y0 + 163, 72, 8, "#23263a", L.OBJ, y0 + 184);
  sc.box(x0 + 44, y0 + 163, 72, 1, "#3d4463", L.OBJ, y0 + 185);
  const plaque = h_flex().id(`se-plaque-${R.key}`).w(u(72)).h(u(8)).px(u(2.5)).gap(u(2)).items_center().cursor_pointer().tooltip(R.title || R.key)
    .text_size(fpx(u, 3.9, 9.5)).text_color(col("#ffffff"))
    .on_click(() => opt.onIssue(R))
    .child(div().flex_none().font_bold().child(R.key))
    .child(div().truncate().child(R.title || t.noTitle));
  sc.at(plaque, x0 + 44, y0 + 163);
}

/** A coworker's label: two lines when they say what they are on (and the bubble on their turn), else the plain pill. */
function label(sc, opt, a, cx, y, above) {
  const id = `se-agent-${a.id}`, click = () => opt.onAgent(a);
  if (!a.doing) { centered(sc, pill(sc.u, id, a.name, a.state, 40, click), cx, y, 42); return; }
  const top = above ? y - 4 : y;
  centered(sc, card(sc.u, id, a, 40, click), cx, top, 42);
  if (opt.spot === a.id) {
    const bx = Math.min(Math.max(cx, 54), opt.W - 54);
    sc.at(h_flex().w(sc.u(104)).justify_center().child(bubble(sc.u, a.doing, 100)), bx - 52, top - 10, L.UI, 9);
  }
}

/** What sits on a desk: monitor (its screen tells the status), keyboard, one seeded prop. */
function desktop(sc, px, dy, state, seed, propLeft) {
  const cx = px + 18, screen = STATUS[state]?.screen ?? "idle";
  sc.box(px + 2, dy + 12, 34, 9, NAVY + "38", L.SHADOW);
  sc.img("desk", px, dy, L.OBJ, dy + 14);
  sc.img(screen === "work" ? `mon_work_${seed % 3}` : `mon_${screen}`, cx - 9, dy - 9, L.OBJ, dy + 15);
  // while working, the code on the screen keeps changing
  if (screen === "work") sc.anim(`mon_work_${(seed + 1) % 3}`, cx - 9, dy - 9, "opacity", { from: 0, to: 1, period: 1300 + (seed % 5) * 90 }, L.OBJ, dy + 15.5);
  sc.img("keyboard", cx - 5, dy + 6, L.OBJ, dy + 16);
  sc.img("mouse", cx + 7, dy + 6, L.OBJ, dy + 16);
  const prop = PROPS[seed % PROPS.length], [pw, ph] = sc.size(prop);
  sc.img(prop, propLeft ? px + 3 : px + 33 - pw, dy + 8 - ph, L.OBJ, dy + 16);
}

/** An agent seen from behind at a desk whose top edge is at dy. Idle leaves the chair empty. */
function backSeat(sc, opt, cx, dy, a, bubbleX, bubbleY) {
  if (a.state === "idle") {
    sc.shadow(cx - 5, dy + 34, 14, 4);
    sc.img("chair", cx - 5, dy + 22, L.OBJ, dy + 36);
    return;
  }
  if (a.state === "blocked") sc.img("ring", cx - 11, dy + 30, L.SHADOW, dy + 1);
  sc.shadow(cx - 7, dy + 31, 14, 4);
  if (a.state === "working") sc.anim(`p${a.persona % PEOPLE}_sitb`, cx - 9, dy + 4, "top", { from: 0, to: sc.u(1), period: 380 + (a.persona % 4) * 40 }, L.OBJ, dy + 30);   // typing
  else sc.img(`p${a.persona % PEOPLE}_sitb`, cx - 9, dy + 4, L.OBJ, dy + 30);
  sc.img("chair", cx - 7, dy + 19, L.OBJ, dy + 33);
  marks(sc, a, bubbleX, bubbleY, cx + 9, dy - 7);
  label(sc, opt, a, cx, dy + 36, false);
}

/** The "needs you" bubble (it bobs), or the green tick and sparkles of an agent that finished. */
function marks(sc, a, bx, by, sx, sy) {
  const u = sc.u;
  if (a.state === "blocked") {
    const bob = div().relative().loop("top", { from: 0, to: u(-2), period: 900 }).child(sc.sprite("bubble"));
    sc.at(div().child(bob), bx, by, L.TOP);   // the wrapper holds the place, the inner one bobs
  }
  if (a.state === "done") {
    sc.img("bubble_done", bx, by, L.TOP);
    sc.at(div().child(div().loop("opacity", { from: 0.25, to: 1, period: 1400 }).child(sc.sprite("sparkle"))), sx, sy, L.TOP);
    sc.at(div().child(div().loop("opacity", { from: 1, to: 0.25, period: 1100 }).child(sc.sprite("sparkle_w"))), sx - 22, sy + 4, L.TOP);
  }
}

function single(sc, opt, px, dy, a, seed) {
  desktop(sc, px, dy, a.state, seed, true);
  backSeat(sc, opt, px + 18, dy, a, px + 20, dy - 24);
}

/** Two desks back to back: the north agent faces us over the back of a monitor, the south one shows their back. */
function pod(sc, opt, px, py, north, south, seed) {
  const cx = px + 18;
  if (north.state === "idle") {
    sc.img("chair", cx - 7, py - 17, L.OBJ, py - 3);
  } else {
    sc.img("chair", cx - 7, py - 20, L.OBJ, py - 3);
    if (north.state === "working") sc.anim(`p${north.persona % PEOPLE}_sitf`, cx - 9, py - 21, "top", { from: 0, to: sc.u(1), period: 400 + (north.persona % 4) * 40 }, L.OBJ, py - 2);
    else sc.img(`p${north.persona % PEOPLE}_sitf`, cx - 9, py - 21, L.OBJ, py - 2);
    marks(sc, north, cx + 6, py - 22, cx + 8, py - 20);
    label(sc, opt, north, cx, py - 30, true);
  }
  sc.img("desk", px, py, L.OBJ, py + 10);
  sc.img(`monb_${STATUS[north.state]?.screen ?? "idle"}`, cx - 9, py - 9, L.OBJ, py + 11);
  const prop = PROPS[(seed + 5) % PROPS.length], [pw, ph] = sc.size(prop);
  sc.img(prop, seed % 2 ? px + 3 : px + 33 - pw, py + 8 - ph, L.OBJ, py + 12);
  desktop(sc, px, py + 9, south.state, seed, seed % 2 === 0);
  backSeat(sc, opt, cx, py + 9, south, cx + 8, py + 6);
}

/** The plaque of a spare room: it offers to start something on this floor. */
function sparePlaque(u, opt, id) {
  const plaque = h_flex().w(u(72)).h(u(8)).px(u(2.5)).gap(u(2)).items_center().text_size(fpx(u, 3.9, 9.5)).text_color(col("#aab0c6"))
    .child(div().flex_1().truncate().child(opt.t.spare));
  if (!opt.onNew) return plaque;
  return plaque.id(id).cursor_pointer().on_click((_e, cx) => opt.onNew(cx))
    .child(div().flex_none().font_bold().text_color(col("#f4f4f8")).child(opt.t.newBtn));
}

/** A room nobody uses yet: door, bare desks, moving boxes, lights off. */
function spareRoom(sc, opt, x0, y0, i) {
  const u = sc.u;
  rug(sc, x0 + 10, y0 + 70, ROOM_W - 20, 54, ["#b7bccb", "#d0d5db", "#9fa5b7"]);
  sc.img(`window_${i % 3}`, x0 + 8, y0 + 8, L.OBJ, y0 + 31);
  for (let j = 0; j < 2; j++) {
    const dx = x0 + 28 + j * 50;
    sc.box(dx + 2, y0 + 96, 34, 9, NAVY + "38", L.SHADOW);
    sc.img("desk", dx, y0 + 84, L.OBJ, y0 + 98);
    sc.img("mon_idle", dx + 9, y0 + 75, L.OBJ, y0 + 99);
    sc.img("chair", dx + 11, y0 + 101, L.OBJ, y0 + 118);
  }
  sc.stand("boxes", x0 + 8, y0 + 128, 18);
  sc.img("door_r", x0 + 14, y0 + 154, L.OBJ, y0 + 184);
  sc.box(x0 + 44, y0 + 163, 72, 8, "#23263a", L.OBJ, y0 + 184);
  sc.at(sparePlaque(u, opt, `se-spare-${i}`), x0 + 44, y0 + 163);
  sc.box(x0, y0 + 4, ROOM_W, 146, "#1c245242", L.TOP, y0 + 150);
}

/** The common row: kitchenette against a wall, sofa area open to the corridor, a spare room if there is width. */
function lounge(sc, opt, model, yL, W, H) {
  const u = sc.u, t = opt.t;
  wallH(sc, 4, yL, 122);
  sc.box(126, yL, 4, 4, CAP, L.OBJ, yL + 4);
  sc.box(126, yL + 4, 4, FACE_H, "#d9caba", L.OBJ, yL + 4);
  sc.box(126, yL + 4 + FACE_H - 3, 4, 3, "#a89795", L.OBJ, yL + 4);
  sc.stand("fridge", 9, yL + 6, 13);
  sc.stand("counter", 26, yL + 14, 44);
  sc.img("coffee_machine", 31, yL + 4, L.OBJ, yL + 38);
  sc.img("prop_mug_3", 46, yL + 15, L.OBJ, yL + 38);
  sc.img("prop_mug_1", 53, yL + 15, L.OBJ, yL + 38);
  sc.img("prop_succulent", 63, yL + 12, L.OBJ, yL + 38);
  sc.img("notice", 84, yL + 8, L.OBJ, yL + 31);
  sc.stand("bin", 76, yL + 32, 8);
  sc.stand("round_table", 86, yL + 62, 20);
  sc.stand("stool", 74, yL + 72, 8);
  sc.stand("stool", 112, yL + 72, 8);
  rug(sc, 130, yL + 38, 124, 62, ["#e3a58a", "#f5bda1", "#cc8b76"]);
  sc.stand("sofa", 168, yL + 36, 44);
  sc.stand("coffee_table", 180, yL + 68, 22);
  sc.stand("pouf_0", 154, yL + 84, 11);
  sc.stand("pouf_1", 218, yL + 80, 11);
  sc.stand("floor_lamp", 232, yL + 12, 9);
  sc.img("glow", 215, yL - 6, L.LIGHT);
  sc.stand("plant_0_1", 134, yL + 22, 11);

  // you, by the sofa
  sc.stand("me_front", 148, yL + 46, 12);
  centered(sc, pill(u, "se-me", t.you, null, 30), 156, yL + 71, 34);

  // agents with no ticket: two on the sofa, the rest standing around
  // sprite x, sprite y, label center x, label y; the first two sit on the sofa
  const seats = [[174, 31, 182, 60], [194, 31, 202, 23], [54, 42, 62, 67], [104, 40, 112, 65], [20, 70, 28, 95], [238, 62, 246, 87]];
  model.lounge.slice(0, seats.length).forEach((a, k) => {
    const [x, y, lx, ly] = seats[k], sofa = k < 2;
    if (sofa) sc.img(`p${a.persona % PEOPLE}_sofa`, x, yL + y, L.OBJ, yL + 62);
    else sc.stand(`p${a.persona % PEOPLE}_front`, x, yL + y, 12);
    if (a.state === "idle") sc.img("zzz", x + 11, yL + y - 11, L.TOP);
    if (a.state === "blocked") marks(sc, a, x + 10, yL + y - 12, 0, 0);
    if (a.state === "done") sc.img("bubble_done", x + 10, yL + y - 12, L.TOP);
    centered(sc, pill(u, `se-agent-${a.id}`, a.name, a.state, 34, () => opt.onAgent(a)), lx, yL + ly, 36);
  });
  if (model.lounge.length > seats.length) sc.at(pill(u, "se-lounge-more", `+${model.lounge.length - seats.length}`, null, 30), 200, yL + 96);

  // a spare room on the right when the floor is wide enough
  const FX = 258;
  if (W - FX >= 150) {
    wallH(sc, FX, yL, W - 4 - FX);
    wallV(sc, FX, yL + 4, H - 4 - (yL + 4), L.OBJ, H);
    sc.img("door_l", FX + 14, yL + 4, L.OBJ, yL + 34);
    sc.box(FX + 44, yL + 13, 72, 8, "#23263a", L.OBJ, yL + 34);
    sc.at(sparePlaque(u, opt, "se-spare-lounge"), FX + 44, yL + 13);
    rug(sc, FX + 32, yL + 52, 124, 46, ["#b7bccb", "#d0d5db", "#9fa5b7"]);
    for (let j = 0; j < 2; j++) {
      const dx = FX + 46 + j * 52;
      sc.box(dx + 2, yL + 70, 34, 9, NAVY + "38", L.SHADOW);
      sc.img("desk", dx, yL + 58, L.OBJ, yL + 72);
      sc.img("mon_idle", dx + 9, yL + 49, L.OBJ, yL + 73);
      sc.img("chair", dx + 11, yL + 75, L.OBJ, yL + 92);
    }
    sc.stand("boxes", FX + 10, yL + 78, 18);
    sc.stand("plant_1_2", W - 22, yL + 32, 11);
    sc.box(FX + 4, yL + 4, W - 8 - FX, H - 8 - yL, "#1c245242", L.TOP, H);
  } else {
    sc.stand("plant_2_2", W - 26, yL + 56, 11);
  }
}

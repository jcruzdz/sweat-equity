// Renders the mod against stand-in builders and writes the draw list each scenario produces.
import fs from "node:fs";
const out = process.argv[2];
fs.mkdirSync("/tmp/se-harness-home/mods/sweat-equity", { recursive: true });
const { default: Mod } = await import("./sweat-equity/main.js");

const cx = { notify() {}, stop_propagation() {}, spawn(fn) { return fn(cx); }, sleep: async () => {}, timer: { every() {}, after() {} } };
const text = (n) => (typeof n === "string" || typeof n === "number" ? String(n) : null);

/** Natural size of a node, with a rough text metric (enough to check where labels land). */
function measure(node, fs_) {
  const t = text(node);
  if (t !== null) return { w: t.length * fs_ * 0.56, h: fs_ * 1.25 };
  const n = node.__node, p = n.p, f = p.text_size ?? fs_;
  if (n.tag === "image") return { w: p.w ?? 0, h: p.h ?? 0 };
  if (n.tag === "svg") return { w: p.size ?? 0, h: p.size ?? 0 };
  const kids = n.kids.map((k) => measure(k, f));
  const row = p.dir !== "col" && (p.dir === "row" || p.flex);
  const gap = p.gap ?? 0, pad = (p.px ?? p.p ?? 0) * 2;
  let w = row ? kids.reduce((a, k) => a + k.w, 0) + gap * Math.max(0, kids.length - 1) : Math.max(0, ...kids.map((k) => k.w));
  let h = row || p.dir !== "col" ? Math.max(0, ...kids.map((k) => k.h)) : kids.reduce((a, k) => a + k.h, 0) + gap * Math.max(0, kids.length - 1);
  w = p.w ?? Math.min(p.max_w ?? Infinity, w + pad);
  h = p.h ?? p.size ?? h;
  return { w, h };
}

/** Turns one positioned element into flat draw operations. */
function draw(node, x, y, ops, fs_, color) {
  const t = text(node);
  if (t !== null) return;
  const n = node.__node, p = n.p, f = p.text_size ?? fs_, c = p.text_color ?? color;
  const m = measure(node, fs_);
  if (n.tag === "image") { ops.push({ k: "img", src: p.src, x, y, w: m.w, h: m.h }); return; }
  if (n.tag === "svg") { ops.push({ k: "svg", src: p.src, x, y, w: m.w, h: m.h, color: p.text_color ?? c }); return; }
  if (p.bg || p.border) ops.push({ k: "box", x, y, w: m.w, h: m.h, bg: p.bg ?? null, border: p.border ? p.border_color ?? "#ffffff" : null, bw: p.border ?? 0, dashed: !!p.border_dashed, r: p.rounded ?? 0 });
  const col = p.dir === "col";
  const kids = n.kids.map((k) => ({ k, m: measure(k, f) }));
  const gap = p.gap ?? 0, pad = p.px ?? p.p ?? 0;
  const inner = m.w - pad * 2;
  const total = col ? kids.reduce((a, q) => a + q.m.h, 0) + gap * Math.max(0, kids.length - 1) : kids.reduce((a, q) => a + q.m.w, 0) + gap * Math.max(0, kids.length - 1);
  let cur = col ? (p.justify_center ? y + (m.h - total) / 2 : y) : p.justify_center ? x + pad + (inner - total) / 2 : x + pad;
  for (const q of kids) {
    const kt = text(q.k);
    const avail = Math.max(0, col ? inner : x + pad + inner - cur);
    const kw = Math.min(q.m.w, col ? inner : avail);
    const kx = col ? (p.items_center ? x + (m.w - kw) / 2 : x + pad) : cur;
    const ky = col ? cur : p.items_center ? y + (m.h - q.m.h) / 2 : y;
    if (kt !== null) ops.push({ k: "text", t: kt, x: kx, y: ky, w: kw, fs: f, color: c, bold: !!(p.font_bold || p.font_semibold) });
    else draw(q.k, kx, ky, ops, f, c);
    cur += (col ? q.m.h : kw) + gap;
  }
}

function scenario(name, size, h, setup) {
  globalThis.__h = { spaces: [], agents: [], panes: [], shared: {}, props: { overlay: "o1" }, ran: [], config: null, ...h };
  const m = new Mod();
  m.init({}, cx);
  m.cfg = h.cfg ?? {};
  m.ready = true;
  m.size = size;
  if (setup) setup(m);
  const root = m.render(cx).__node;
  if (root.kids.length < 3) { console.log(name, "RENDER ERROR:", JSON.stringify(root.kids[0]).slice(0, 900)); return; }
  const [bar, stage, foot] = root.kids.map((k) => k.__node);
  // the scene is the clipped, relative box; beside it there may be the team list, over it a panel
  const find = (n) => (n.p.relative && n.p.overflow_hidden && n.p.w && n.kids.length > 8 ? n : n.kids.map((c) => (c && c.__node ? find(c.__node) : null)).find(Boolean));
  const scene = find(stage);
  const texts = (n) => (text(n) !== null ? [text(n)] : (n.__node ?? n).kids.flatMap(texts));
  const beside = stage.kids.flatMap((c) => (c.__node === scene ? [] : texts(c).filter((x) => !texts({ __node: scene }).includes(x)))).slice(0, 60);
  if (beside.length) console.log("   beside/over the scene:", beside.join(" | ").slice(0, 700));
  const ops = [];
  for (const k of scene.kids) { const p = k.__node.p; draw(k, p.left ?? 0, p.top ?? 0, ops, 12, "#ffffff"); }
  const raw = (n) => n.__node ?? n;
  const flat = (n) => (text(n) !== null ? [text(n)] : raw(n).kids.flatMap(flat));
  fs.writeFileSync(`${out}/${name}.json`, JSON.stringify({ w: scene.p.w, h: scene.p.h, bg: stage.p.bg, ops }));
  const ids = []; const walk = (n) => { if (text(n) !== null) return; if (raw(n).p.id) ids.push(raw(n).p.id); raw(n).kids.forEach(walk); }; walk(root.kids[1]); walk(root.kids[0]);
  const dup = ids.filter((v, i) => ids.indexOf(v) !== i);
  console.log(name, `${scene.p.w}x${scene.p.h}`, "elements", scene.kids.length, "ops", ops.length, "| bar:", flat(bar).join(" | "), "| foot:", flat(foot).join(""), dup.length ? "| DUPLICATE IDS " + dup.join(",") : "");
  return { m, ...inspect(m) };
}

/** Renders again and lists every element id and text on screen, with a way to find one element to click. */
function inspect(m) {
  const root = m.render(cx).__node, ids = [], texts = [];
  const walk = (n) => { if (text(n) !== null) { texts.push(text(n)); return; } const r = n.__node ?? n; if (r.p.id) ids.push(r.p.id); r.kids.forEach(walk); };
  walk(root);
  const byId = (n, id) => { if (text(n) !== null) return null; const r = n.__node ?? n; if (r.p.id === id) return r; for (const k of r.kids) { const f = byId(k, id); if (f) return f; } return null; };
  return { ids, texts, find: (id) => byId(root, id) };
}

const demo = { shared: { "sweat-equity": { workspaces: [], hidden: [], presenting: false, demo: true } } };
scenario("demo_tower_wide", { width: 1440, height: 900 }, demo);
scenario("demo_office_wide", { width: 1440, height: 900 }, demo, (m) => { m.view = "PIXEL CO"; });
scenario("demo_tower_tall", { width: 1036, height: 1800 }, demo);
scenario("demo_office_tall", { width: 1036, height: 1800 }, demo, (m) => { m.view = "PIXEL CO"; });
scenario("preview_tower", { width: 1080, height: 812 }, demo);
scenario("preview_office", { width: 1080, height: 812 }, demo, (m) => { m.view = "PIXEL CO"; });
scenario("empty_tower", { width: 1280, height: 800 }, {});
// the size of the box the repository's screenshot is taken in
scenario("shot_tower", { width: 1078, height: 762 }, { ...demo, cfg: { demo: true, lang: "en" } });

// live data shaped like a real session: two developments under one workspace, agents on main
const R = "/Users/someone/Documents/acme";
const tab = (id, n) => ({ id, index: n, name: String(n), named: false, active: true, status: null, panes: 1 });
const live = (agents, branches) => ({
  cfg: { lang: "es", jira: "https://example.atlassian.net" },
  shared: { "sweat-equity": { workspaces: [{ name: "ACME", root: "~/Documents/acme", color: "#ff9b7a" }, { name: "OTHER", root: "~/Documents/other", color: "#73eff7" }], hidden: [], presenting: false, demo: false } },
  spaces: [
    { id: "s1", index: 1, name: "space-app", named: false, folder: "", machine: null, branch: branches[0], active: true, status: "blocked", tabs: [tab("t1", 1), tab("t2", 2)] },
    { id: "s2", index: 2, name: "code", named: false, folder: R + "/code", machine: null, branch: branches[1], active: false, status: "done", tabs: [tab("t3", 1)] },
    { id: "s3", index: 3, name: "notes", named: false, folder: "/Users/someone/notes", machine: null, branch: null, active: false, status: null, tabs: [tab("t4", 1)] },
  ],
  panes: [
    { pane: "p1", terminal: "a1", tab: "t1", cwd: R + "/code/space-app", branch: branches[0], status: agents[0] },
    { pane: "p2", terminal: "a2", tab: "t2", cwd: R + "/code/space-app", branch: branches[0], status: agents[1] },
    { pane: "p3", terminal: "a3", tab: "t3", cwd: R + "/code", branch: branches[1], status: agents[2] },
    { pane: "p4", terminal: "a4", tab: "t4", cwd: "/Users/someone/notes", branch: null, status: null },
  ],
  agents: [
    { address: "a1", pane: "p1", space: "s1", space_name: "space-app", tab: "t1", tab_index: 1, tab_name: "1", status: agents[0] },
    { address: "a2", pane: "p2", space: "s1", space_name: "space-app", tab: "t2", tab_index: 2, tab_name: "2", status: agents[1] },
    { address: "a3", pane: "p3", space: "s2", space_name: "code", tab: "t3", tab_index: 1, tab_name: "1", status: agents[2] },
  ],
});
scenario("live_main_tower", { width: 1280, height: 800 }, live(["blocked", "working", "done"], ["main", "main"]));
scenario("live_main_office", { width: 1280, height: 800 }, live(["blocked", "working", "idle"], ["main", "main"]), (m) => { m.view = "ACME"; });
scenario("live_keys_office", { width: 1280, height: 800 }, live(["blocked", "working", "done"], ["feature/TEL-142-validar-nip", "fix/TEL-9-esim"]), (m) => {
  m.view = "ACME"; m.jira.issues = { "TEL-142": { status: "En curso", summary: "Validar NIP en portabilidad", counts: [1, 2, 1], cols: [1, 2, 0, 1], cur: 1, curCol: 1 } };
});
const pres = live(["blocked", "working", "done"], ["main", "main"]); pres.shared["sweat-equity"].presenting = true; pres.shared["sweat-equity"].hidden = ["ACME"];
scenario("presenting_tower", { width: 1280, height: 800 }, pres);

// the sample tower must never show the person's own workspace names
const priv = live(["blocked", "working", "done"], ["main", "main"]); priv.cfg = { demo: true };
scenario("demo_private", { width: 1280, height: 800 }, priv);

// a space on another machine, at the same place under that machine's home, joins the same floor
const rem = live(["blocked", "working", "done"], ["main", "main"]);
rem.spaces.push({ id: "danys-mbp/s9", index: 4, name: "space", named: false, folder: "/Users/dany/Documents/acme/code/space", machine: "danys-mbp.local", branch: "feature/TEL-142-remote", active: false, status: "working", tabs: [tab("danys-mbp/t9", 1)] });
rem.panes.push({ pane: "danys-mbp/p9", terminal: "danys-mbp/a9", tab: "danys-mbp/t9", cwd: "/Users/dany/Documents/acme/code/space", branch: "feature/TEL-142-remote", status: "working" });
rem.agents.push({ address: "danys-mbp/a9", pane: "danys-mbp/p9", space: "danys-mbp/s9", space_name: "space", tab: "danys-mbp/t9", tab_index: 1, tab_name: "1", status: "working" });
rem.spaces.push({ id: "box/s8", index: 5, name: "elsewhere", named: false, folder: "/srv/jobs/elsewhere", machine: "box", branch: "main", active: false, status: null, tabs: [tab("box/t8", 1)] });
scenario("remote_tower", { width: 1280, height: 800 }, rem);
scenario("remote_office", { width: 1280, height: 800 }, rem, (m) => { m.view = "ACME"; });

// a space started in one workspace whose terminal now works in another: one floor only, where it works
const split = live(["idle", "idle", "idle"], ["main", "main"]);
split.shared["sweat-equity"].hidden = [];
split.spaces.push({ id: "s7", index: 6, name: "trading", named: false, folder: R + "/code", machine: null, branch: "main", active: false, status: "idle", tabs: [tab("t7", 1)] });
split.panes.push({ pane: "p7", terminal: "a7", tab: "t7", cwd: "/Users/someone/Documents/other/trading", branch: "main", status: "idle" });
split.agents.push({ address: "a7", pane: "p7", space: "s7", space_name: "trading", tab: "t7", tab_index: 1, tab_name: "1", status: "idle" });
scenario("split_tower", { width: 1280, height: 800 }, split, (m) => { globalThis.__floors = null; });

// one development with a lead and four more agents, to lay out a full room
const crew = { cfg: { lang: "es" }, shared: { "sweat-equity": { workspaces: [{ name: "REDBLAK", root: "~/Documents/acme", color: "#ff9b7a" }], hidden: [], presenting: false, demo: false } },
  spaces: [{ id: "c1", index: 1, name: "space", named: false, folder: R + "/code/space", machine: null, branch: "main", active: true, status: "working", tabs: [1, 2, 3, 4, 5].map((n) => tab("ct" + n, n)) }],
  panes: [1, 2, 3, 4, 5].map((n) => ({ pane: "cp" + n, terminal: "ca" + n, tab: "ct" + n, cwd: R + "/code/space", branch: "main", status: "working" })),
  agents: [1, 2, 3, 4, 5].map((n) => ({ address: "ca" + n, pane: "cp" + n, space: "c1", space_name: "space", tab: "ct" + n, tab_index: n, tab_name: String(n), status: "working" })) };
scenario("subs_office", { width: 1000, height: 1070 }, crew, (m) => { m.view = "REDBLAK"; });

// panels over the tower, and the team list beside a floor with helpers
const known = [{ key: "claude", name: "Claude Code", icon: "icons/claude.svg", tint: false, run: ["claude"], installed: true }, { key: "codex", name: "Codex", icon: "icons/codex.svg", tint: false, run: ["codex"], installed: true }, { key: "pi", name: "Pi", icon: "icons/pi.svg", tint: true, run: ["pi"], installed: false }];
const base = () => { const x = live(["blocked", "working", "done"], ["main", "feature/TEL-142-x"]); x.shared["sweat-equity"].hidden = []; x.known = known; x.shared["new-menu.agents"] = { "": known }; return x; };
scenario("panel_new", { width: 1280, height: 800 }, base(), (m) => { m.panel = { kind: "new", name: "ACME", color: "#ff9b7a", root: R, folders: [{ path: R, label: "" }, { path: R + "/code", label: "code" }, { path: R + "/code/api", label: "code/api" }], pick: 1, agents: known, agent: 0, scanning: false, missing: false }; });
scenario("panel_edit", { width: 1280, height: 800 }, base(), (m) => { m.panel = { kind: "edit", name: "ACME", sure: false }; });
scenario("panel_dev", { width: 1280, height: 800 }, base(), (m) => { m.panel = { kind: "dev", id: "s2" }; });
scenario("panel_loose", { width: 1280, height: 800 }, base(), (m) => { m.panel = { kind: "dev", id: "s3" }; });
const pinned = base(); pinned.shared["sweat-equity"].pins = { s3: "OTHER", s2: "" };
scenario("pinned_tower", { width: 1280, height: 800 }, pinned);
const team = base();
team.agents.forEach((a, i) => { a.title = ["✳ Fix the PIN timeout", "Reviewing the diff", "~/Documents/acme"][i]; a.program = { key: "claude", name: "Claude Code" }; });
team.terminals = [{ address: "k1", parent: "a2", state: "live", status: "working", name: "tests", title: "Running the suite", program: { key: "codex", name: "Codex" } }];
scenario("team_office_wide", { width: 1440, height: 900 }, team, (m) => { m.view = "ACME"; m.crew = { a1: [{ role: "general-purpose", doing: "Writing design mockup and brief", meta: "11m 17s · 251.9k tokens" }, { role: "Explore", doing: "Copying icon paths", meta: "2m 3s · 79k tokens" }] }; m.spot = 1; });
scenario("team_office_tall", { width: 1078, height: 1918 }, team, (m) => { m.view = "ACME"; m.crew = { a1: [{ role: "general-purpose", doing: "Writing design mockup and brief", meta: "11m 17s · 251.9k tokens" }] }; });

// ---- hiding: a hidden floor leaves the tower; the moon is the only way back
let failed = 0;
const expect = (label, ok) => { if (!ok) failed++; console.log(ok ? "   ok  " : "   FAIL", label); };
const hideCase = (hidden, presenting = false) => {
  const x = live(["blocked", "working", "done"], ["main", "main"]);     // ACME holds every agent
  Object.assign(x.shared["sweat-equity"], { hidden, presenting });
  return x;
};
const has = (r, re) => r.ids.some((i) => re.test(i));
const none = scenario("nothing_hidden", { width: 1280, height: 800 }, hideCase([]));
expect("nothing hidden: floors show eye and pen, the moon is always a button that says nothing is hidden", none.ids.includes("se-eye-ACME") && none.ids.includes("se-edit-ACME") && none.ids.includes("se-moon") && /Nada oculto/.test(String(none.find("se-moon").p.tooltip)) && none.ids.includes("se-inbox"));
const gone = scenario("hidden_tower", { width: 1280, height: 800 }, hideCase(["ACME"]));
expect("hidden: no sign, control or window of that floor", !has(gone, /^se-(sign|eye|edit|new|newbay)-ACME$/) && !has(gone, /^se-space-s[12]$/));
expect("hidden: its name is nowhere on screen", !gone.texts.some((s) => s.includes("ACME")));
expect("hidden: its agents are not counted (no pills)", !gone.ids.includes("se-inbox") && !gone.ids.includes("se-finished"));
expect("hidden: the other floor stays and the moon answers", gone.ids.includes("se-sign-OTHER") && gone.ids.includes("se-moon"));
expect("hidden: the moon says how many", /\(1\)/.test(String(gone.find("se-moon").p.tooltip)));
const peek = scenario("hidden_peek", { width: 1280, height: 800 }, hideCase(["ACME"]), (m) => { m.peek = true; });
expect("peek: the floor is back as a shell, marked, with the eye to restore it", peek.ids.includes("se-sign-ACME") && peek.ids.includes("se-eye-ACME") && peek.texts.includes("Oculto"));
expect("peek: with no windows, alerts, way in or editing", !has(peek, /^se-space-s[12]$/) && !has(peek, /^se-(new|newbay|edit)-ACME$/) && !peek.ids.includes("se-inbox") && !peek.find("se-sign-ACME").p.on_click);
const pres1 = scenario("hidden_presenting", { width: 1280, height: 800 }, hideCase(["ACME"], true));
expect("presenting: still gone, no controls at all, the moon still answers", !pres1.ids.includes("se-sign-ACME") && !has(pres1, /^se-(eye|edit|new)-/) && pres1.ids.includes("se-moon"));
const pres2 = scenario("hidden_peek_presenting", { width: 1280, height: 800 }, hideCase(["ACME"], true), (m) => { m.peek = true; });
expect("presenting + peek: only the shell has its eye", pres2.ids.includes("se-eye-ACME") && !has(pres2, /^se-(edit|new|newbay)-/) && !pres2.ids.includes("se-eye-OTHER"));
const lone = scenario("peek_nothing_hidden", { width: 1280, height: 800 }, hideCase([]), (m) => { m.peek = true; });
expect("peek with nothing hidden turns itself off", lone.ids.includes("se-moon") && lone.m.peek === false);
expect("the sample tower has no moon control", !has(scenario("demo_again", { width: 1280, height: 800 }, demo), /^se-moon$/));

// clicks: the moon, the shell's eye, a visible floor's eye, and the edit panel's row
const w = scenario("wire", { width: 1280, height: 800 }, hideCase(["ACME"]));
w.find("se-moon").p.on_click(null, cx);
const shown = inspect(w.m);
expect("click on the moon shows the hidden floors", w.m.peek === true && shown.ids.includes("se-sign-ACME") && /Volver/.test(String(shown.find("se-moon").p.tooltip)));
shown.find("se-eye-ACME").p.on_click({}, cx);
const back = inspect(w.m);
expect("the shell's eye brings the floor back for good, and peek ends with nothing left hidden", globalThis.__h.shared["sweat-equity"].hidden.length === 0 && back.ids.includes("se-sign-ACME") && back.ids.includes("se-moon") && w.m.peek === false);
back.find("se-eye-ACME").p.on_click({}, cx);
const again = inspect(w.m);
expect("the eye on a visible floor hides it at once", globalThis.__h.shared["sweat-equity"].hidden.join() === "ACME" && !again.ids.includes("se-sign-ACME") && again.ids.includes("se-moon"));
const ep = scenario("wire_panel", { width: 1280, height: 800 }, hideCase([]), (m) => { m.panel = { kind: "edit", name: "ACME", sure: false }; });
const row = ep.find("se-hide");
expect("the edit panel offers to hide the floor", !!row && ep.texts.includes("Ocultar este piso"));
row.p.on_click({}, cx);
expect("hiding from the panel closes it and removes the floor", ep.m.panel === null && !inspect(ep.m).ids.includes("se-sign-ACME"));
const inside = scenario("wire_inside", { width: 1280, height: 800 }, hideCase(["ACME"]), (m) => { m.view = "ACME"; });
expect("a hidden floor cannot be entered, even if the view pointed at it", inside.m.view === null && inside.ids.includes("se-sign-OTHER"));
console.log(failed ? `HIDE CHECKS FAILED: ${failed}` : "all hide checks passed");
if (failed) process.exitCode = 1;

// ---- phase A: the character is a button, and a window says what it works on
failed = 0;
const kk = scenario("phaseA_office", { width: 1280, height: 800 }, live(["blocked", "working", "done"], ["feature/TEL-142-validar-nip", "fix/TEL-9-esim"]), (m) => {
  m.view = "ACME"; m.jira.issues = { "TEL-142": { status: "En curso", summary: "Validar NIP en portabilidad", counts: [1, 2, 1], cols: [1, 2, 0, 1], cur: 1, curCol: 1, subs: [{ key: "TEL-143", summary: "Endpoint NIP", status: "Hecho", col: 3 }, { key: "TEL-144", summary: "Pantalla NIP", status: "En curso", col: 1 }, { key: "TEL-145", summary: "Pruebas", status: "En curso", col: 1 }, { key: "TEL-146", summary: "Contrato", status: "Por hacer", col: 0 }] } };
});
const hits = kk.ids.filter((i) => /^se-hit-/.test(i));
expect("every seated character has a hit area", hits.length >= 3);
globalThis.__h.ran.length = 0;
kk.find(hits[0]).p.on_click({}, cx);
expect("clicking the character goes to its chat", globalThis.__h.ran.some((r) => JSON.stringify(r).includes("agent.focus")));
const kt = scenario("phaseA_tower", { width: 1280, height: 800 }, live(["blocked", "working", "done"], ["feature/TEL-142-validar-nip", "fix/TEL-9-esim"]), (m) => {
  m.jira.issues = { "TEL-142": { status: "En curso", summary: "Validar NIP en portabilidad", counts: [1, 2, 1], cols: [1, 2, 0, 1], cur: 1, curCol: 1 } };
});
const tip = String(kt.find("se-space-s1").p.tooltip);
expect("a window's tooltip lists its story with name, status and progress", /TEL-142 · Validar NIP en portabilidad · En curso · 1\/4/.test(tip));
scenario("panel_issue", { width: 1280, height: 800 }, live(["blocked", "working", "done"], ["feature/TEL-142-validar-nip", "fix/TEL-9-esim"]), (m) => {
  m.view = "ACME"; m.jira.issues = { "TEL-142": { status: "En curso", summary: "Validar NIP en portabilidad", counts: [1, 2, 1], cols: [1, 2, 0, 1], cur: 1, curCol: 1, subs: [{ key: "TEL-143", summary: "Endpoint NIP", status: "Hecho", col: 3 }, { key: "TEL-144", summary: "Pantalla NIP", status: "En curso", col: 1 }, { key: "TEL-145", summary: "Pruebas", status: "En curso", col: 1 }, { key: "TEL-146", summary: "Contrato", status: "Por hacer", col: 0 }] } };
  m.panel = { kind: "issue", key: "TEL-142" };
});
const bk = kk.ids.find((i) => /^se-boardhit-TEL-142/.test(i));
expect("the whole whiteboard is a button", !!bk);
kk.find(bk).p.on_click({}, cx);
const bp = inspect(kk.m);
expect("clicking the board opens the story's panel with its columns and subtasks", bp.ids.includes("se-panel-issue") && bp.ids.includes("se-sub-1-1") && bp.ids.includes("se-open-jira"));
console.log(failed ? `PHASE A CHECKS FAILED: ${failed}` : "all phase A checks passed");
if (failed) process.exitCode = 1;

// ---- phase B: four windows a floor with the painted board; more developments than windows go to a second floor of the same workspace
failed = 0;
const six = { cfg: { lang: "es" }, shared: { "sweat-equity": { workspaces: [{ name: "ACME", root: "~/Documents/acme", color: "#ff9b7a" }], hidden: [], presenting: false, demo: false } },
  spaces: [1, 2, 3, 4, 5, 6].map((n) => ({ id: "m" + n, index: n, name: "dev" + n, named: false, folder: R + "/code/dev" + n, machine: null, branch: "main", active: false, status: n % 2 ? "working" : "done", tabs: [tab("mt" + n, 1)] })),
  panes: [1, 2, 3, 4, 5, 6].map((n) => ({ pane: "mp" + n, terminal: "ma" + n, tab: "mt" + n, cwd: R + "/code/dev" + n, branch: "main", status: n % 2 ? "working" : "done" })),
  agents: [1, 2, 3, 4, 5, 6].map((n) => ({ address: "ma" + n, pane: "mp" + n, space: "m" + n, space_name: "dev" + n, tab: "mt" + n, tab_index: 1, tab_name: "1", status: n % 2 ? "working" : "done" })) };
const many = scenario("six_devs_tower", { width: 1280, height: 900 }, six);
const wins = many.ids.filter((i) => /^se-space-m\d$/.test(i));
expect("six developments: all six have a window", wins.length === 6);
expect("six developments: a second floor of the same workspace", many.ids.includes("se-sign-ACME") && many.ids.includes("se-sign-ACME-2"));
expect("only the first floor carries the controls", many.ids.filter((i) => i === "se-edit-ACME").length === 1 && many.ids.filter((i) => i === "se-new-ACME").length === 1);
expect("a working window shows the blue working badge", /beacon_work/.test(fs.readFileSync(`${out}/six_devs_tower.json`, "utf8")));
const four = scenario("four_devs_tower", { width: 1280, height: 900 }, { ...six, spaces: six.spaces.slice(0, 4) });
expect("four developments fit on one floor", !four.ids.includes("se-sign-ACME-2") && four.ids.filter((i) => /^se-space-m\d$/.test(i)).length === 4);
console.log(failed ? `PHASE B CHECKS FAILED: ${failed}` : "all phase B checks passed");
if (failed) process.exitCode = 1;

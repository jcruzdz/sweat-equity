// Sweat Equity: your workspaces as a pixel-art tower at night.
// Each floor is a workspace (a folder you choose), each window a development
// (a Herdr space), and inside a floor each room is a squad: the agents whose
// git branch carries the same ticket key, sitting with the helpers they started.
//
// Roles (props.role): none = the tower, opened as a full-window overlay;
// "mini" = a one-line summary for the sidebar that opens the tower.

import { View, div, svg, image } from "gpui-kit";
import { h_flex, v_flex, InputState, Input } from "gpui-base";
import { props, run, closeOverlay, pickFolder, exec, theme, spaces, knownAgents, hc, shared, notify, window as appWindow } from "herdr";
import { Scene, INK, ALERT, STATUS, DIR, col } from "./scene.js";
import { buildFacade, facadeScale, stackOf } from "./facade.js";
import { buildOffice, officeFit } from "./office.js";
import { TEXT, COLORS, loadConfig, loadState, saveState, liveTower, liveOffice, demoTower, demoOffice, demoLive, Jira, writeDebug, fromHome, toAbs, findRepos, parseCrew, allowProjects,
  readLive, writeLive, readLog, logEvents, markSeen, readPrefs, writePrefs, readPrs, readUsage, fmtTokens, fmtAge, crewCost } from "./data.js";

const BAR_H = 44, FOOT_H = 26, ROSTER_W = 312, ROSTER_H = 236;
const VERSION = "1.5.0-dev";
const PANEL = "#0f1436", LINE = "#56608f", SOFT = "#c9d6e0", DIM = "#94b0c2", PAPER = "#f4f4f8", PICK = "#1c2452", CLEAR = "#00000000";
const STOP = "#ff6b5e", BLUE = "#5b8cff", ORANGE = "#ff9a3d", GREEN = "#3ecf8e";
/** A story is stopped when it, or one of its subtasks, sits in a stopped status in Jira. */
const isStopped = (i) => !!(i && (i.blocked || i.blockedCols?.some(Boolean)));
const hhmm = (at) => { const d = new Date(at); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
/** "Índices faltantes: full table scans" -> "indices-faltantes-full-table-scans", for a branch name. */
const slug = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\[[^\]]*\]/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/, "");

export default class SweatEquity extends View {
  init(initProps, cx) {
    this.size = { width: 1200, height: 800 };
    /** @type {{ width: number, height: number } | null} */
    this.outer = null;           // with `frame` in the config: the size of everything around the box
    /** @type {any} */
    this.cfg = {};
    this.view = null;            // null: the tower; a workspace name: inside that floor
    this.jira = new Jira();
    /** @type {string[]} */
    this.keys = [];
    this.error = null;
    this.ready = false;          // nothing is drawn until the config file has been read
    this.lastDebug = 0;
    this.lastSig = "";
    /** @type {any} */
    this.panel = null;           // what is open over the scene: { kind: "new" | "edit" | "dev" | "team", ... }
    /** @type {Record<string, any[]>} */
    this.crew = {};              // the helpers an agent lists on its own screen, by terminal address
    this.reading = false;        // a pass over those screens is under way
    this.peek = false;           // the hidden floors are shown again, as muted shells (the moon); never kept between sessions
    this.spot = 0;               // whose turn it is to say in full what they are doing
    this.message = InputState.new({ placeholder: "" });   // the first message for a new agent
    this.rename = InputState.new({ value: "" });          // a floor's name, while it is edited
    this.message.on("submit", () => this.start());
    this.rename.on("submit", () => this.renameFloor());
    const tower = (initProps?.role ?? props()?.role) !== "mini";   // the tower draws Jira's boards and reads screens; the mini line, always on screen, tells who moved
    writeDebug({ version: VERSION, at: Date.now(), started: tower ? "tower" : "mini" });   // proof that this build loaded
    cx.spawn(async (cx) => {
      this.cfg = await loadConfig();
      this.ready = true;
      cx.notify();
      if (!tower) {
        // the sidebar line stays on screen with the tower closed: it watches the tickets, the agents, the PRs and today's
        // tokens, keeps the log, and says when something moves
        await cx.sleep(2500);
        this.watchAgents();
        await this.watchJira();
        cx.notify();
        cx.timer.every(5000, (cx) => { if (this.watchAgents()) cx.notify(); });
        cx.timer.every(60000, async (cx) => { if (await this.watchJira()) cx.notify(); });
        await this.watchPrs();
        cx.timer.every(180000, async () => { await this.watchPrs(); });
        await this.watchPending();
        cx.timer.every(300000, async () => { await this.watchPending(); });
        await this.watchUsage();
        cx.timer.every(600000, async () => { await this.watchUsage(); });
        return;
      }
      // the first time the tower opens, the legend says how to read it
      if (!readPrefs().legendSeen && !this.panel) { this.panel = { kind: "legend", dont: true }; cx.notify(); }
      await cx.sleep(1500);
      await this.syncJira();
      cx.notify();
    });
    if (tower) {
      cx.timer.every(60000, async (cx) => {
        await this.syncJira();
        cx.notify();
      });
      // inside a floor: the next coworker speaks, and the helpers on each screen are read again
      cx.timer.every(4000, (cx) => {
        if (this.view && !this.panel) { this.spot++; cx.notify(); }
      });
      cx.timer.every(6000, async (cx) => {
        if (await this.readCrew()) cx.notify();
      });
    }
  }

  async syncJira() {
    try { await this.jira.sync(this.cfg, this.keys, this.t()); } catch (_e) { /* the note already says why */ }
  }

  /** The sidebar's watch: the tickets of every visible development, and a notice for each status that changed in Jira. */
  async watchJira() {
    if (!this.ready || !this.cfg.jira) return false;
    const st = loadState(this.cfg);
    if (st.demo) return false;
    this.keys = [...new Set(liveTower(st).floors.flatMap((f) => f.spaces.flatMap((d) => d.keys)))];
    await this.syncJira();
    const t = this.t(), moves = this.jira.moves, now = Date.now();
    if (!moves.length) return false;
    logEvents(moves.map((m) => ({ at: now, kind: m.kind === "stale" ? "stale" : m.blocked ? "stopped" : m.done ? "done" : "move", key: m.key, story: m.story, summary: m.summary, from: m.from, to: m.to, by: m.by ?? null, text: this.moveLine(m, t) })));
    this.tell(moves, t);
    return true;
  }

  moveLine(m, t) {
    if (m.kind === "stale") return t.evStale.replace("{key}", m.key).replace("{age}", fmtAge(m.age));
    return (m.blocked ? t.movedStopped : t.moved).replace("{key}", m.key).replace("{from}", m.from).replace("{to}", m.to);
  }

  /** Notices for the moves the person wants to hear about: one per story when several came together, none in quiet hours. */
  tell(moves, t) {
    const n = readPrefs().notify;
    const q = Array.isArray(this.cfg.quietHours) && this.cfg.quietHours.length === 2 ? this.cfg.quietHours.map(Number) : [20, 8];
    const h = new Date().getHours();
    if (n.quiet && (q[0] > q[1] ? h >= q[0] || h < q[1] : h >= q[0] && h < q[1])) return;
    const want = moves.filter((m) => (m.kind === "stale" || m.blocked || m.done ? n.stopped : m.by ? n.agents : n.people));
    const byStory = new Map();
    want.forEach((m) => byStory.set(m.story, [...(byStory.get(m.story) ?? []), m]));
    for (const [story, list] of byStory) {
      const loud = list.some((m) => m.blocked), done = list.every((m) => m.done);
      let title, body;
      if (list.length === 1) {
        const m = list[0];
        title = this.moveLine(m, t);
        body = [m.key === m.story ? m.summary : `${m.story} · ${m.summary}`, m.by ? t.by.replace("{who}", m.by) : ""].filter(Boolean).join(" · ");
      } else {
        const to = new Map();
        list.forEach((m) => to.set(m.to, (to.get(m.to) ?? 0) + 1));
        const who = [...new Set(list.map((m) => m.by).filter(Boolean))];
        title = t.grouped.replace("{key}", story).replace("{n}", String(list.length));
        body = [[...to].map(([st, k]) => t.groupedTo.replace("{n}", String(k)).replace("{s}", st)).join(" · "), who.length ? t.by.replace("{who}", who.join(", ")) : ""].filter(Boolean).join(" · ");
      }
      try { notify({ title, body, level: loud ? "warning" : done ? "success" : "info", timeout: loud ? 20000 : 8000 }); } catch (_e) { /* no toast mod: the log keeps it */ }
    }
  }

  /** Agents that start waiting for you or finish go to the log (Herdr already posts its own notice for them). */
  watchAgents() {
    if (!this.ready) return false;
    const st = loadState(this.cfg);
    if (st.demo) return false;
    const t = this.t(), now = Date.now(), ev = [], cur = {};
    for (const f of liveTower(st).floors) for (const d of f.spaces) for (const a of d.list) {
      cur[a.address] = a.status;
      const before = this.agentSeen?.[a.address];
      if (!this.agentSeen || before === a.status) continue;
      const who = d.list.length > 1 ? `${d.name} ${a.tab_name ?? ""}`.trim() : d.name, key = d.keys[0] ?? "";
      if (a.status === "blocked") ev.push({ at: now, kind: "waits", key, story: key, summary: d.title, text: t.evWaits.replace("{who}", who) });
      if (a.status === "done") ev.push({ at: now, kind: "finished", key, story: key, summary: d.title, text: t.evDone.replace("{who}", who) });
    }
    this.agentSeen = cur;
    logEvents(ev);
    return ev.length > 0;
  }

  /** The PR of every development's branch and its checks; CI turning red or green and merges go to the log. */
  async watchPrs() {
    const st = loadState(this.cfg);
    if (st.demo || this.cfg.prs === false) return;
    const devs = liveTower(st).floors.flatMap((f) => f.spaces);
    const prs = await readPrs(devs);
    const old = readLive().prs ?? {}, t = this.t(), now = Date.now(), ev = [];
    for (const [id, pr] of Object.entries(prs)) {
      const o = old[id], key = devs.find((d) => d.id === id)?.keys[0] ?? "";
      if (!o || o.number !== pr.number) continue;
      const base = { at: now, key, story: key, summary: `PR #${pr.number} · ${pr.branch}` };
      if (o.ci !== "fail" && pr.ci === "fail") ev.push({ ...base, kind: "cifail", text: t.evCiFail.replace("{branch}", pr.branch) });
      if (o.ci === "fail" && pr.ci === "pass") ev.push({ ...base, kind: "cipass", text: t.evCiPass.replace("{branch}", pr.branch) });
      if (o.state !== "MERGED" && pr.state === "MERGED") ev.push({ ...base, kind: "merged", text: t.evMerged.replace("{n}", String(pr.number)) });
    }
    writeLive({ prs });
    logEvents(ev);
  }

  /** What Jira assigns to the person and no development works on, for the reception. */
  async watchPending() {
    const st = loadState(this.cfg);
    if (st.demo || !this.cfg.jira) return;
    const keys = [...new Set(liveTower(st).floors.flatMap((f) => f.spaces.flatMap((d) => d.keys)))];
    const list = await this.jira.pending(this.cfg, keys);
    if (list) writeLive({ pending: { at: Date.now(), list } });
  }

  /** Today's tokens, for the solar panels. */
  async watchUsage() {
    if (this.cfg.usage === false || loadState(this.cfg).demo) return;
    const tokens = await readUsage();
    if (tokens !== null) writeLive({ usage: { tokens, at: Date.now() } });
  }

  /** Reads the screen of each agent on the floor being shown, for the helpers it lists there. */
  async readCrew() {
    if (!this.view || !this.ready || this.reading) return false;
    const st = loadState(this.cfg);
    if (st.demo) return false;
    const floor = liveTower(st).floors.find((f) => f.name === this.view);
    if (!floor) return false;
    this.reading = true;
    let changed = false;
    try {
      for (const a of floor.spaces.flatMap((d) => d.list)) {
        let found = [];
        try {
          const r = await hc(["read", a.address, "--lines", "40"]);
          if (r.code === 0) found = parseCrew(r.stdout);
        } catch (_e) { /* that screen cannot be read: no helpers shown for it */ }
        if (JSON.stringify(found) !== JSON.stringify(this.crew[a.address] ?? [])) { this.crew[a.address] = found; changed = true; }
      }
    } finally {
      this.reading = false;
    }
    return changed;
  }

  t() {
    return TEXT[this.cfg.lang] ?? TEXT.en;
  }

  /** Runs a Herdr command and gets out of the way so its result shows. */
  go(command, args) {
    run(command, args);
    const overlay = props()?.overlay;
    if (overlay) closeOverlay(overlay);
  }

  /** Opens a Jira key in the browser. */
  openKey(key) {
    if (!this.cfg.jira || !/^https:\/\//.test(String(this.cfg.jira)) || !/^[A-Za-z][A-Za-z0-9]+-\d+$/.test(String(key))) return;
    this.openUrl(`${String(this.cfg.jira).replace(/\/+$/, "")}/browse/${key}`);
  }

  /** Opens an https address in the browser. */
  openUrl(url) {
    if (!/^https:\/\//.test(String(url))) return;
    const os = appWindow()?.platform;
    if (os === "macos") exec("open", [url]);
    else if (os === "windows") exec("cmd", ["/c", "start", "", url]);
    else exec("xdg-open", [url]);
  }

  // ---- what the panels do

  /** Moves a development to a floor by hand ("" leaves it on none; undefined goes back to the automatic rule). */
  move(id, floor) {
    const cur = loadState(this.cfg), pins = { ...cur.pins };
    if (floor === undefined) delete pins[id]; else pins[id] = floor;
    for (const key of Object.keys(pins)) if (!spaces().some((s) => s.id === key)) delete pins[key];   // spaces that are gone
    this.panel = null;
    saveState(cur, { pins });
  }

  /** Hides a floor, which then leaves the tower, or shows it again. */
  toggleHidden(name) {
    const cur = loadState(this.cfg), off = cur.hidden.includes(name);
    if (!off) { this.panel = null; if (this.view === name) this.view = null; }   // whatever was open on that floor goes with it
    saveState(cur, { hidden: off ? cur.hidden.filter((x) => x !== name) : [...cur.hidden, name] });
  }

  setColor(name, color) {
    const cur = loadState(this.cfg);
    saveState(cur, { workspaces: cur.workspaces.map((w) => (w.name === name ? { ...w, color } : w)) });
  }

  renameFloor() {
    const P = this.panel;
    if (!P || P.kind !== "edit") return;
    const cur = loadState(this.cfg), from = P.name, to = this.rename.value().trim().slice(0, 16);
    if (!to || to === from || cur.workspaces.some((w) => w.name === to)) return;
    const pins = Object.fromEntries(Object.entries(cur.pins).map(([key, v]) => [key, v === from ? to : v]));
    if (this.view === from) this.view = to;
    this.panel = { kind: "edit", name: to, sure: false };
    saveState(cur, { workspaces: cur.workspaces.map((w) => (w.name === from ? { ...w, name: to } : w)), hidden: cur.hidden.map((h) => (h === from ? to : h)), pins });
  }

  removeFloor(name) {
    const cur = loadState(this.cfg);
    const pins = Object.fromEntries(Object.entries(cur.pins).filter(([, v]) => v !== name));
    if (this.view === name) this.view = null;
    this.panel = null;
    saveState(cur, { workspaces: cur.workspaces.filter((w) => w.name !== name), hidden: cur.hidden.filter((h) => h !== name), pins });
  }

  pickRoot(name, cx) {
    const t = this.t();
    cx.spawn(async () => {
      const folder = await pickFolder({ prompt: t.pick });
      if (!folder) return;
      const cur = loadState(this.cfg);
      saveState(cur, { workspaces: cur.workspaces.map((w) => (w.name === name ? { ...w, root: folder } : w)) });
    });
  }

  /** A floor for a development that has none, from the folder it works in. */
  ownFloor(d) {
    const folder = d.cwds[0] || d.start;
    if (!folder) return;
    this.panel = null;
    this.newWorkspace(folder);
  }

  newWorkspace(folder) {
    const cur = loadState(this.cfg);
    const name = String(folder.split("/").filter(Boolean).pop() ?? "WORKSPACE").toUpperCase().slice(0, 16);
    if (cur.workspaces.some((w) => w.name === name)) return;
    saveState(cur, { workspaces: [...cur.workspaces, { name, root: folder, color: COLORS[cur.workspaces.length % COLORS.length] }] });
  }

  addWorkspace(cx) {
    const t = this.t();
    cx.spawn(async () => {
      const folder = await pickFolder({ prompt: t.pick });
      if (folder) this.newWorkspace(folder);
    });
  }

  openEdit(name, cx) {
    this.rename.set_value(name);
    this.panel = { kind: "edit", name, sure: false };
    cx.notify();
  }

  /** "+ new" on a floor: where (the workspace folder or a repository in it), with which agent, and its first message. */
  openNew(name, cx, ticket = null) {
    const w = loadState(this.cfg).workspaces.find((x) => x.name === name);
    if (!w) return;
    const seen = (/** @type {any} */ (shared("new-menu.agents")) ?? {})[""];   // the agents Herdr's own menu last listed
    const root = toAbs(w.root);
    const P = { kind: "new", name, color: w.color, root, folders: [{ path: root, label: "" }], pick: 0, agents: Array.isArray(seen) ? seen : [], agent: 0, scanning: true, missing: false, ticket, moveOnStart: !!ticket, startCol: null };
    this.panel = P;
    const t = this.t();
    // from the reception: the branch and the first message come from the ticket
    this.message.set_value(ticket ? t.ticketMsg.replace("{key}", ticket.key).replace("{branch}", `feature/${ticket.key}-${slug(ticket.summary) || "work"}`).replace("{summary}", ticket.summary) : "");
    cx.notify();
    if (ticket && this.cfg.jira) cx.spawn(async (cx) => { P.startCol = await this.jira.startColumn(this.cfg, ticket.key, t); if (this.panel === P) cx.notify(); });
    cx.spawn(async (cx) => {
      try {
        const list = await knownAgents();
        if (Array.isArray(list)) P.agents = list;
      } catch (_e) { /* the list Herdr last saw stays */ }
      const found = await findRepos(root);
      P.missing = found === null;
      if (found) P.folders = [{ path: root, label: "" }, ...found.map((p) => ({ path: p, label: p.slice(root.length + 1) }))];
      P.scanning = false;
      if (this.panel === P) cx.notify();
    });
  }

  /** Starts what the "+ new" panel says: a tab in the space that folder already has, or a new space there. */
  start() {
    const P = this.panel;
    if (!P || P.kind !== "new" || P.missing) return;
    const folder = P.folders[P.pick]?.path ?? P.root;
    const agent = P.agent < 0 ? null : P.agents.filter((a) => a.installed)[P.agent] ?? null;
    const task = this.message.value().trim();
    const how = agent ? { argv: agent.run, ...(task ? { task } : {}) } : {};
    const open = spaces().find((s) => !s.machine && s.folder === folder);
    this.panel = null;
    // started from a ticket: it moves to the board's working column, if asked
    if (P.ticket && P.moveOnStart && this.cfg.jira) this.jira.startWork(this.cfg, P.ticket.key).catch(() => {});
    if (open) {
      run("space.select", { id: open.id });
      this.go("tab.new", { space: open.id, ...(agent ? { name: agent.name } : {}), ...how });
    } else {
      this.go("space.new", { folder, machine: "", ...how });
    }
  }

  // ---- pieces of interface

  button(id, label, primary, click) {
    return div().id(id).px(10).h(26).flex().items_center().flex_none().rounded(5)
      .border(1).border_color(col(primary ? PAPER : LINE))
      .bg(col(primary ? PAPER : INK)).text_color(col(primary ? INK : PAPER))
      .text_size(11.5).font_semibold().cursor_pointer()
      .hover((s) => s.opacity(0.85))
      .on_click(click)
      .child(label);
  }

  /** A row of a panel: an optional color square or icon, the label, a hint on the right. */
  row(id, label, o = {}) {
    let el = h_flex().id(id).h(28).px(10).gap(8).items_center().flex_none().rounded(5).cursor_pointer()
      .border(1).border_color(col(o.selected ? o.accent ?? LINE : CLEAR)).bg(col(o.selected ? PICK : CLEAR))
      .hover((s) => s.bg(col(PICK)))
      .text_size(12.5).text_color(col(o.dim ? SOFT : PAPER))
      .on_click(o.click);
    if (o.dot) el = el.child(div().flex_none().w(8).h(8).bg(col(o.dot)));
    if (o.icon) el = el.child(o.icon);
    el = el.child(div().flex_1().truncate().child(label));
    if (o.hint) el = el.child(div().flex_none().max_w(190).truncate().text_size(11).text_color(col(DIM)).child(o.hint));
    return el;
  }

  /** A row with a check box. */
  toggle(id, label, on, click) {
    return h_flex().id(id).h(26).px(4).gap(8).items_center().flex_none().rounded(5).cursor_pointer()
      .hover((s) => s.bg(col(PICK))).text_size(12.5).text_color(col(PAPER))
      .on_click(click)
      .child(div().flex_none().w(14).h(14).rounded(3).border(1).border_color(col(on ? BLUE : LINE)).bg(col(on ? BLUE : INK)).flex().items_center().justify_center()
        .when(on, (el) => el.child(svg(`${DIR}/icons/check.svg`).size(11).text_color(col(PAPER)))))
      .child(div().flex_1().truncate().child(label));
  }

  /** The two bars of the pause sign. */
  bars(color, h = 10) {
    return h_flex().flex_none().gap(2).child(div().w(3).h(h).bg(col(color))).child(div().w(3).h(h).bg(col(color)));
  }

  /** Opens the reception: the list the sidebar line keeps, read again from Jira now. */
  openPending(st, cx) {
    const live = st.demo ? demoLive() : readLive();
    const floors = st.workspaces.filter((w) => !st.hidden.includes(w.name));
    const P = { kind: "pending", list: live.pending?.list ?? [], loading: !st.demo && !!this.cfg.jira, failed: false, floor: 0, floors: floors.map((w) => w.name) };
    this.panel = P;
    cx.notify();
    if (!P.loading) return;
    cx.spawn(async (cx) => {
      const list = await this.jira.pending(this.cfg, this.keys);
      P.loading = false;
      if (list) { P.list = list; writeLive({ pending: { at: Date.now(), list } }); } else P.failed = true;
      if (this.panel === P) cx.notify();
    });
  }

  /** The log, from what the person had not seen; opening it marks everything seen. */
  openLog(cx) {
    const log = readLog();
    this.panel = { kind: "log", since: log.seen, filter: "all" };
    markSeen();
    cx.notify();
  }

  section(label) {
    return div().px(2).pt(8).pb(2).text_size(10.5).font_semibold().text_color(col(DIM)).child(label);
  }

  /** The frame every panel shares: a title, the name it is about in its color, then its rows. */
  sheet(id, width, title, name, color, kids) {
    return v_flex().id(id).w(width).p(12).gap(3).rounded(9).bg(col(PANEL)).border(1).border_color(col(LINE))
      .child(h_flex().h(24).px(2).gap(6).items_center().text_size(13).font_bold()
        .child(div().flex_none().text_color(col(PAPER)).child(title))
        .child(div().flex_1().truncate().text_color(col(color)).child(name)))
      .children(kids);
  }

  closePanel(cx) {
    this.panel = null;
    cx.notify();
  }

  /** The panel that is open, if any. */
  panelEl(t, st, tower, office) {
    const P = this.panel;
    if (!P) return null;
    if (P.kind === "team") {
      // the team list as a panel, where the window has no room to keep it beside the floor
      if (!office) { this.panel = null; return null; }
      return v_flex().gap(8).items_end()
        .child(this.roster(t, office, 360, Math.max(220, Math.min(460, this.size.height - BAR_H - FOOT_H - 90)), (a) => {
          if (tower.demo) return;
          this.panel = null;
          this.go("agent.focus", { terminal: a.address });
        }))
        .child(this.button("se-panel-close", t.close, false, (_e, cx) => this.closePanel(cx)));
    }
    const close = (_e, cx) => this.closePanel(cx);
    const foot = (extra = []) => h_flex().pt(8).gap(8).items_center().children(extra).child(div().flex_1()).child(this.button("se-panel-close", t.cancel, false, close));

    if (P.kind === "issue") {
      // the story's board, as designed: key and state, "N of M subtasks", the title, then four columns of post-its
      const R = office?.rooms?.find((r) => r.key === P.key);
      if (!R) { this.panel = null; return null; }
      // Jira's data when there is some; otherwise what the room already knows (the sample, or the counts it carried)
      const iss = this.jira.issues[R.key] ?? (R.cols ? { status: R.statusText, summary: R.title, cols: R.cols, names: R.names, curCol: R.curCol, done: R.cols[R.cols.length - 1], blocked: R.blocked, solo: false, subs: R.subs ?? [] } : null);
      // the columns are the Jira board's own; the sample keeps the four of the design
      const names = iss?.names ?? t.colNames, last = names.length - 1;
      const POSTIT = ["#f6e7a6", "#ffd7b0", "#dccbff", "#bdeccc"], STOP = "#ff8a80", RED = "#e2532f";
      const tint = (c) => (c === last ? POSTIT[3] : POSTIT[Math.min(c, 2)]);
      const TOP = (c) => (c === iss?.curCol ? (iss?.blocked ? "#ff3b30" : RED) : LINE);
      const total = iss ? iss.cols.reduce((p, q) => p + q, 0) : 0;
      // the branch's PR and what the squad's helpers have spent, as their agents' screens say
      const dev = tower.floors.flatMap((f) => f.spaces).find((d) => d.keys.includes(R.key));
      const pr = dev ? (this.liveData?.prs ?? {})[dev.id] : null;
      const cost = R.agents.filter((a) => a.sub).map((a) => crewCost(a.meta)).reduce((a, b) => ({ tokens: a.tokens + b.tokens, secs: a.secs + b.secs }), { tokens: 0, secs: 0 });
      const prChip = pr ? [h_flex().id("se-issue-pr").gap(5).px(8).py(1).rounded(4).border(1).border_color(col(pr.ci === "fail" ? ORANGE : BLUE)).text_color(col(pr.ci === "fail" ? "#ffc896" : "#c9d8ff")).cursor_pointer()
        .on_click(() => this.openUrl(pr.url))
        .child(svg(`${DIR}/icons/${pr.ci === "fail" ? "x" : pr.ci === "pass" ? "check" : "pr"}.svg`).size(11).text_color(col(pr.ci === "fail" ? "#ffc896" : "#c9d8ff")))
        .child(t.prChecks.replace("{n}", String(pr.number)).replace("{ok}", String(pr.ok)).replace("{all}", String(pr.all)))] : [];
      const head = v_flex().gap(4)
        .child(h_flex().gap(8).items_center().text_size(11.5)
          .child(div().font_bold().text_color(col("#ffb08a")).child(R.key))
          .child(div().px(8).py(1).rounded(10).border(1).border_color(col(iss?.blocked ? "#ff3b30" : LINE)).bg(col(iss?.blocked ? "#4a1414" : CLEAR)).text_color(col(iss?.blocked ? "#ffd2cc" : SOFT)).child(`Jira · ${iss?.status ?? "…"}`))
          .child(div().text_color(col(DIM)).child(iss ? (iss.solo ? t.noSubs : t.subsOf.replace("{d}", String(iss.done ?? iss.cols[last])).replace("{n}", String(total))) : (this.jira.note || t.noBoard)))
          .child(div().flex_1())
          .children(prChip))
        .child(div().text_size(16).font_bold().text_color(col(PAPER)).child(iss?.summary || R.title || R.key))
        .when(cost.tokens > 0 || !!iss?.board, (el) => el.child(h_flex().gap(16).text_size(11).text_color(col(DIM))
          .when(!!iss?.board, (x) => x.child(div().child(iss.board)))
          .when(cost.tokens > 0, (x) => x.child(div().child(t.tokensOf.replace("{t}", fmtTokens(cost.tokens)).replace("{d}", fmtAge(cost.secs * 1000)))))));
      const board = h_flex().gap(6).items_start().children(names.map((nm, c) => {
        const list = iss ? iss.subs.filter((s) => s.col === c) : [];
        return v_flex().flex_1().min_w(0).gap(6).p(6).rounded(6).bg(col(PICK)).border_t(3).border_color(col(TOP(c)))
          .child(h_flex().gap(5).text_size(11).font_bold().text_color(col(PAPER)).child(div().truncate().child(nm)).child(div().text_color(col(DIM)).font_normal().child(String(list.length))))
          .children(list.map((s, i) => v_flex().id(`se-sub-${c}-${i}`).gap(3).p(7).rounded(3).bg(col(s.blocked ? "#ff8a80" : tint(c))).cursor_pointer()
            .border_l(s.blocked ? 4 : 0).border_color(col("#c62828"))
            .when(!s.blocked && !!s.by && !!s.at && Date.now() - s.at < 10 * 60000, (el) => el.border(2).border_color(col(BLUE)))
            .hover((x) => x.opacity(0.85)).tooltip(`${s.key} · ${s.summary}\n${s.status}`)
            .on_click(() => { if (!tower.demo) this.openKey(s.key); })
            .child(div().text_size(11.5).font_semibold().text_color(col(INK)).child(s.summary))
            .child(h_flex().flex_wrap().gap_x(6).gap_y(2).items_center().text_size(9.5).text_color(col("#5c6078"))
              .when(s.blocked && !!s.since, (el) => el.child(this.bars("#7a0f0f", 8)).child(div().font_bold().text_color(col("#4a1010")).child(fmtAge(Date.now() - s.since))))
              .when(!!s.by, (el) => el.child(svg(`${DIR}/icons/robot.svg`).size(11).text_color(col("#2b3a8f"))).child(div().font_semibold().text_color(col("#2b3a8f"))
                .child(s.at ? `${s.by} · ${t.ago.replace("{t}", fmtAge(Date.now() - s.at))}` : s.by)))
              .child(s.key)
              .children(s.status && (s.blocked || names.length <= 3 || s.status.toLowerCase() !== nm.toLowerCase()) ? [div().font_bold().text_color(col(s.blocked ? "#7a0f0f" : "#5c6078")).child(s.status)] : []))));
      }));
      // the squad: who is on it; whoever waits for you gets a banner with the way to answer
      const waiting = R.agents.filter((a) => a.state === "blocked");
      const squad = h_flex().gap(6).flex_wrap().children(R.agents.map((a, i) => h_flex().id(`se-sq-${i}`).gap(6).px(8).h(24).items_center().rounded(5).bg(col(PICK)).cursor_pointer()
        .border(1).border_color(col(STATUS[a.state]?.color ?? LINE)).tooltip(a.doing || a.name).text_size(11.5).text_color(col(PAPER))
        .on_click(() => { if (tower.demo) return; this.panel = null; this.go("agent.focus", { terminal: a.address }); })
        .child(div().flex_none().w(8).h(8).rounded(4).bg(col(STATUS[a.state]?.color ?? DIM)))
        .child(div().truncate().max_w(170).child(a.name))));
      const banners = waiting.map((a, i) => h_flex().id(`se-wait-${i}`).gap(10).items_center().pl(12).pr(6).py(6).rounded(8).border(2).border_color(col("#ffb020")).bg(col("#3a2a10"))
        .child(div().flex_none().w(10).h(10).rounded(5).bg(col("#ffb020")))
        .child(div().flex_1().min_w(0).truncate().text_size(12).text_color(col(PAPER)).child(t.waitsYou.replace("{who}", a.name)))
        .child(this.button(`se-reply-${i}`, t.reply, true, () => { if (tower.demo) return; this.panel = null; this.go("agent.focus", { terminal: a.address }); })));
      const open = this.cfg.jira && !tower.demo ? [this.button("se-open-jira", t.openJira, true, () => this.openKey(R.key))] : [];
      if (pr?.url) open.push(this.button("se-open-pr", t.openPr.replace("{n}", String(pr.number)), false, () => this.openUrl(pr.url)));
      const moved = readLog().events.filter((e) => e.story === R.key && ["move", "stopped", "done", "stale"].includes(e.kind)).slice(0, 3);
      const recent = moved.length ? [this.section(t.recent), v_flex().gap(4).children(moved.map((e, i) => h_flex().id(`se-rec-${i}`).gap(10).items_center().px(8).py(6).rounded(4).bg(col("#161d45")).text_size(12)
        .child(div().flex_none().w(40).text_color(col(DIM)).child(hhmm(e.at)))
        .child(svg(`${DIR}/icons/${e.by ? "robot" : "person"}.svg`).size(13).text_color(col(e.by ? "#9fb8ff" : SOFT)))
        .child(div().flex_none().font_semibold().text_color(col(PAPER)).child(e.key))
        .child(div().flex_1().truncate().text_color(col(e.kind === "stopped" || e.kind === "stale" ? "#ff8a80" : SOFT)).child(e.kind === "stale" ? e.text : `${e.from} → ${e.to}`))
        .when(!!e.by, (el) => el.child(div().flex_none().text_color(col(DIM)).child(e.by)))))] : [];
      const bodyH = Math.max(160, this.size.height - BAR_H - FOOT_H - 150);
      return v_flex().id("se-panel-issue").w(Math.min(760, this.size.width - 24)).max_h(this.size.height - BAR_H - FOOT_H - 24).p(14).gap(10).rounded(9).bg(col(PANEL)).border(1).border_color(col(LINE))
        .child(head)
        .child(v_flex().id("se-issue-body").gap(10).max_h(bodyH).overflow_y_scroll().child(board).children(recent).child(this.section(`${t.squad} (${R.agents.length})`)).child(squad).children(banners))
        .child(foot(open));
    }

    if (P.kind === "dev") {
      const d = [...tower.floors.flatMap((f) => f.spaces), ...tower.loose].find((x) => x.id === P.id);
      if (!d) { this.panel = null; return null; }
      const here = d.floor, rows = [];
      if (here) rows.push(this.row("se-dev-go", t.goSpace, { click: () => { this.panel = null; this.go("space.select", { id: d.id }); } }));
      st.workspaces.filter((w) => w.name !== here).forEach((w, i) => rows.push(this.row(`se-dev-to-${i}`, `${here ? t.moveTo : t.sendTo} ${w.name}`, { dot: w.color, click: () => this.move(d.id, w.name) })));
      if (here) rows.push(this.row("se-dev-none", t.noFloor, { dim: true, click: () => this.move(d.id, "") }));
      if (!here && (d.cwds[0] || d.start)) rows.push(this.row("se-dev-own", t.ownFloor, { dim: true, click: () => this.ownFloor(d) }));
      if (d.pinned) rows.push(this.row("se-dev-auto", t.auto, { dim: true, click: () => this.move(d.id, undefined) }));
      const color = st.workspaces.find((w) => w.name === here)?.color ?? DIM;
      return this.sheet("se-panel-dev", 300, d.name, here ?? t.outside, color, [...rows, foot()]);
    }

    if (P.kind === "edit") {
      const w = st.workspaces.find((x) => x.name === P.name);
      if (!w) { this.panel = null; return null; }
      const off = st.hidden.includes(w.name);
      const remove = this.button("se-remove", P.sure ? t.sure : t.removeFloor, false, (_e, cx) => {
        if (P.sure) this.removeFloor(w.name); else { P.sure = true; cx.notify(); }
      }).text_color(col("#ff6b6b")).border_color(col(P.sure ? "#ff6b6b" : LINE));
      return this.sheet("se-panel-edit", 360, t.editFloor, w.name, w.color, [
        this.section(t.nameLabel),
        h_flex().gap(8).items_center()
          .child(div().id("se-name").flex_1().min_w(0).h(30).px(8).flex().items_center().rounded(6).border(1).border_color(col(LINE)).bg(col(INK))
            .child(Input.new(this.rename).h_full().text_size(12.5).text_color(col(PAPER))))
          .child(this.button("se-rename", t.rename, false, () => this.renameFloor())),
        this.section(t.colorLabel),
        h_flex().gap(8).px(2).children(COLORS.map((c, i) => div().id(`se-color-${i}`).w(20).h(20).rounded(4).bg(col(c)).border(2).border_color(col(c === w.color ? PAPER : CLEAR)).cursor_pointer()
          .on_click(() => this.setColor(w.name, c)))),
        this.section(t.folderLabel),
        h_flex().gap(8).items_center()
          .child(div().flex_1().min_w(0).truncate().px(2).text_size(12).text_color(col(PAPER)).child(fromHome(w.root)))
          .child(this.button("se-root", t.change, false, (_e, cx) => this.pickRoot(w.name, cx))),
        div().h(6),
        this.row("se-hide", off ? t.showFloor : t.hideFloor, { icon: svg(`mods/sweat-equity/icons/${off ? "eye-off" : "eye"}.svg`).size(14).text_color(col(PAPER)), click: () => this.toggleHidden(w.name) }),
        foot([remove]),
      ]);
    }

    if (P.kind === "new") {
      const installed = P.agents.filter((a) => a.installed);
      const opened = new Set(spaces().filter((s) => !s.machine && s.folder).map((s) => s.folder));
      const pick = installed.length ? P.agent : -1;
      const folders = P.folders.map((f, i) => this.row(`se-folder-${i}`, f.label || t.wsFolder, {
        selected: i === P.pick, accent: P.color, hint: opened.has(f.path) ? t.addsTab : f.label ? t.newSpace : fromHome(P.root),
        click: (_e, cx) => { P.pick = i; cx.notify(); },
      }));
      const who = [
        ...installed.map((a, i) => this.row(`se-with-${i}`, a.name, {
          selected: pick === i, accent: P.color, icon: !a.icon ? null : a.tint ? svg(a.icon).size(14).text_color(col(PAPER)) : image(a.icon).size(14),
          click: (_e, cx) => { P.agent = i; cx.notify(); },
        })),
        this.row("se-with-terminal", t.terminal, { selected: pick === -1, accent: P.color, dim: true, click: (_e, cx) => { P.agent = -1; cx.notify(); } }),
      ];
      const note = P.missing ? t.missing : P.scanning ? t.scanning : "";
      const fromTicket = P.ticket ? [
        h_flex().px(2).pb(4).gap(6).text_size(11.5).text_color(col(DIM)).child(div().flex_none().font_bold().text_color(col("#ffb08a")).child(t.fromTicket.replace("{key}", P.ticket.key))).child(div().flex_1().truncate().child(P.ticket.summary)),
      ] : [];
      const moveRow = P.ticket && this.cfg.jira ? [this.toggle("se-move-start", t.moveOnStart.replace("{s}", P.startCol ?? "…"), P.moveOnStart, (_e, cx) => { P.moveOnStart = !P.moveOnStart; cx.notify(); })] : [];
      return this.sheet("se-panel-new", 460, t.newIn, P.name, P.color, [
        ...fromTicket,
        this.section(`1 · ${t.where}`),
        v_flex().id("se-folders").max_h(172).gap(2).overflow_y_scrollbar().children(folders),
        div().px(2).text_size(11).text_color(col(P.missing ? "#ff6b6b" : DIM)).child(note),
        this.section(`2 · ${t.who}`),
        v_flex().gap(2).children(who),
        this.section(`3 · ${t.first}`),
        div().id("se-message").h(34).px(8).flex().items_center().rounded(6).border(1).border_color(col(LINE)).bg(col(INK))
          .child(Input.new(this.message).h_full().text_size(12.5).text_color(col(PAPER))),
        ...moveRow,
        h_flex().pt(8).gap(8).items_center()
          .child(div().flex_1().truncate().text_size(11).text_color(col(DIM)).child(t.enterHint))
          .child(this.button("se-panel-close", t.cancel, false, close))
          .child(this.button("se-start", t.start, true, () => this.start())),
      ]);
    }
    if (P.kind === "pending") {
      // the reception: what Jira assigns you and no development works on; "Start" opens "+ new" filled from the ticket
      const floorName = P.floors[P.floor] ?? null;
      const RANK = { 1: STOP, 2: ORANGE, 3: "#56608f" };
      const rows = P.list.map((it, i) => h_flex().id(`se-pend-${i}`).gap(10).items_center().px(10).py(8).rounded(6).bg(col(PICK))
        .child(div().flex_none().w(4).h(30).rounded(2).bg(col(RANK[it.rank] ?? "#3b4262")))
        .child(v_flex().flex_1().min_w(0).gap(2)
          .child(div().truncate().text_size(12.5).font_semibold().text_color(col(PAPER)).child(it.summary))
          .child(div().truncate().text_size(11).text_color(col(DIM)).child([it.key, it.status, it.priority].filter(Boolean).join(" · "))))
        .child(this.button(`se-pend-jira-${i}`, "Jira", false, () => this.openKey(it.key)))
        .child(this.button(`se-pend-go-${i}`, t.startTicket, true, (_e, cx) => { if (floorName && !st.demo) this.openNew(floorName, cx, { key: it.key, summary: it.summary }); })));
      const where = P.floors.length > 1 ? [this.section(t.floorLabel), h_flex().gap(6).flex_wrap().children(P.floors.map((n, i) => {
        const c = st.workspaces.find((w) => w.name === n)?.color ?? DIM;
        return h_flex().id(`se-pend-floor-${i}`).gap(6).px(10).h(24).items_center().rounded(12).cursor_pointer().text_size(11.5)
          .border(1).border_color(col(i === P.floor ? c : LINE)).bg(col(i === P.floor ? PICK : CLEAR)).text_color(col(PAPER))
          .on_click((_e, cx) => { P.floor = i; cx.notify(); })
          .child(div().w(8).h(8).bg(col(c))).child(n);
      }))] : [];
      const state = P.loading ? t.readingJira : P.failed ? t.pendingErr : !P.list.length ? t.noPending : "";
      return v_flex().id("se-panel-pending").w(Math.min(720, this.size.width - 24)).max_h(this.size.height - BAR_H - FOOT_H - 24).p(14).gap(8).rounded(9).bg(col(PANEL)).border(1).border_color(col(LINE))
        .child(h_flex().gap(10).items_center()
          .child(svg(`${DIR}/icons/clipboard.svg`).size(16).text_color(col("#9fb8ff")))
          .child(div().text_size(16).font_bold().text_color(col(PAPER)).child(t.pending))
          .child(div().flex_1().truncate().text_size(11.5).text_color(col(DIM)).child(t.pendingHint)))
        .children(where)
        .child(div().px(2).text_size(11.5).text_color(col(P.failed ? STOP : DIM)).child(state))
        .child(v_flex().id("se-pend-list").gap(6).max_h(Math.max(160, this.size.height - BAR_H - FOOT_H - 230)).overflow_y_scrollbar().children(rows))
        .child(foot());
    }

    if (P.kind === "log") {
      // what happened while you were not looking: Jira moves, agents, PRs and CI; on the right, which of them make a notice
      const KINDS = { all: null, jira: ["move", "stopped", "done", "stale"], agents: ["waits", "finished"], ci: ["cifail", "cipass", "merged"] };
      const LOOK = {
        stopped: ["#2a1620", STOP, "pause", "#ff8a80"], stale: ["#2a1620", STOP, "pause", "#ff8a80"], waits: ["#2b2410", ALERT, null, ALERT],
        finished: ["#12301f", GREEN, "check", GREEN], done: ["#12301f", GREEN, "check", GREEN], cifail: ["#2b1c10", ORANGE, "x", "#ffb066"],
        move: ["#161d45", null, "arrow", "#9fb8ff"], cipass: ["#161d45", null, "check", "#9fb8ff"], merged: ["#161d45", null, "pr", "#c9b3ff"],
      };
      const log = readLog(), now = Date.now();
      const evs = log.events.filter((e) => !KINDS[P.filter] || KINDS[P.filter].includes(e.kind));
      const line = (e, i) => {
        const [bg, edge, icon, fg] = LOOK[e.kind] ?? LOOK.move;
        let el = h_flex().id(`se-log-${i}`).gap(10).items_center().px(10).py(7).rounded(5).bg(col(bg)).cursor_pointer()
          .hover((x) => x.opacity(0.85))
          .on_click(() => { if (e.key) this.openKey(e.key); })
          .child(div().flex_none().w(14).flex().justify_center().child(icon ? svg(`${DIR}/icons/${icon}.svg`).size(13).text_color(col(fg)) : div().text_size(13).font_bold().text_color(col(fg)).child("!")))
          .child(v_flex().flex_1().min_w(0).gap(2)
            .child(div().truncate().text_size(12.5).text_color(col(PAPER)).child(e.text))
            .when(!!(e.summary || e.story), (x) => x.child(div().truncate().text_size(11).text_color(col(DIM)).child([e.story !== e.key ? e.story : "", e.summary].filter(Boolean).join(" · ")))))
          .when(!!e.by, (x) => x.child(svg(`${DIR}/icons/robot.svg`).size(13).text_color(col("#9fb8ff"))))
          .child(div().flex_none().w(40).text_size(11).text_color(col(e.at > P.since ? PAPER : DIM)).child(hhmm(e.at)));
        if (edge) el = el.border_l(3).border_color(col(edge));
        return el;
      };
      const fresh = evs.filter((e) => now - e.at < 30 * 60000), older = evs.filter((e) => now - e.at >= 30 * 60000);
      const unseen = log.events.filter((e) => e.at > P.since).length;
      const chips = h_flex().gap(6).children(Object.keys(KINDS).map((k) => h_flex().id(`se-log-f-${k}`).px(10).h(24).items_center().rounded(12).cursor_pointer().text_size(11.5)
        .border(1).border_color(col(P.filter === k ? "#3a4ea8" : LINE)).bg(col(P.filter === k ? "#3a4ea8" : CLEAR)).text_color(col(PAPER))
        .on_click((_e, cx) => { P.filter = k; cx.notify(); })
        .child({ all: t.fAll, jira: t.fJira, agents: t.fAgents, ci: t.fCi }[k])));
      const list = v_flex().id("se-log-list").flex_1().min_w(0).gap(4).max_h(Math.max(180, this.size.height - BAR_H - FOOT_H - 170)).overflow_y_scrollbar()
        .when(!evs.length, (x) => x.child(div().px(2).py(8).text_size(12).text_color(col(DIM)).child(t.noEvents)))
        .when(fresh.length > 0, (x) => x.child(this.section(t.lastHalf)).children(fresh.map(line)))
        .when(older.length > 0, (x) => x.child(this.section(t.earlier)).children(older.map((e, i) => line(e, i + fresh.length))));
      const n = readPrefs().notify;
      const q = Array.isArray(this.cfg.quietHours) && this.cfg.quietHours.length === 2 ? this.cfg.quietHours : [20, 8];
      const set = (k) => (_e, cx) => { writePrefs({ notify: { ...readPrefs().notify, [k]: !n[k] } }); cx.notify(); };
      const prefs = v_flex().w(230).flex_none().gap(2).p(10).rounded(8).border(1).border_color(col(LINE))
        .child(div().pb(4).text_size(12.5).font_bold().text_color(col(PAPER)).child(t.notifs))
        .child(this.toggle("se-n-stopped", t.nStopped, n.stopped, set("stopped")))
        .child(this.toggle("se-n-agents", t.nAgents, n.agents, set("agents")))
        .child(this.toggle("se-n-people", t.nPeople, n.people, set("people")))
        .child(this.toggle("se-n-quiet", t.nQuiet.replace("{a}", String(q[0])).replace("{b}", String(q[1])), n.quiet, set("quiet")));
      return v_flex().id("se-panel-log").w(Math.min(880, this.size.width - 24)).max_h(this.size.height - BAR_H - FOOT_H - 24).p(14).gap(10).rounded(9).bg(col(PANEL)).border(1).border_color(col(LINE))
        .child(h_flex().gap(10).items_center()
          .child(div().text_size(16).font_bold().text_color(col(PAPER)).child(t.whileAway))
          .child(div().flex_1().truncate().text_size(11.5).text_color(col(DIM)).child(P.since ? t.sinceN.replace("{t}", hhmm(P.since)).replace("{n}", String(unseen)) : "")))
        .child(chips)
        .child(h_flex().gap(14).items_start().child(list).child(prefs))
        .child(foot());
    }

    if (P.kind === "legend") {
      // what each sign means, with the sign itself
      const sprite = (name) => image(`${DIR}/sprites/${name}.png`).w(22).h(24);
      const icon = {
        wait: sprite("beacon"), work: sprite("beacon_work"), done: sprite("beacon_done"),
        stop: div().w(22).h(24).bg(col("#5a1a1a")).p(2).child(div().size_full().bg(col(STOP)).flex().items_center().justify_center().child(this.bars("#2a0c0c", 10))),
        cloud: v_flex().items_center().gap(1).child(div().w(14).h(3).bg(col("#565d84"))).child(div().w(28).h(6).bg(col("#3f4566"))).child(h_flex().gap(4).child(div().w(1).h(4).bg(col("#8fa3d8"))).child(div().w(1).h(4).bg(col("#8fa3d8"))).child(div().w(1).h(4).bg(col("#8fa3d8")))),
        solar: h_flex().gap(2).child(div().w(8).h(16).bg(col("#ffd65a"))).child(div().w(8).h(16).bg(col("#ffd65a"))).child(div().w(8).h(16).bg(col("#1c2c7a"))),
        moon: image(`${DIR}/sprites/moon.png`).w(26).h(26),
        desk: h_flex().px(4).h(20).items_center().border(2).border_color(col(BLUE)).bg(col(INK)).child(svg(`${DIR}/icons/clipboard.svg`).size(12).text_color(col("#9fb8ff"))),
      };
      const rows = [["wait", t.lgWait, t.lgWaitD], ["work", t.lgWork, t.lgWorkD], ["done", t.lgDone, t.lgDoneD], ["stop", t.lgStop, t.lgStopD], ["cloud", t.lgCloud, t.lgCloudD], ["solar", t.lgSolar, t.lgSolarD], ["moon", t.lgMoon, t.lgMoonD], ["desk", t.lgDesk, t.lgDeskD]]
        .map(([k, a, b]) => h_flex().gap(14).items_center()
          .child(div().flex_none().w(40).h(30).flex().items_center().justify_center().child(icon[k]))
          .child(v_flex().flex_1().min_w(0).gap(1).child(div().text_size(13).font_semibold().text_color(col(PAPER)).child(a)).child(div().text_size(12).text_color(col(SOFT)).child(b))));
      const ok = (_e, cx) => { if (P.dont) writePrefs({ legendSeen: true }); this.closePanel(cx); };
      return v_flex().id("se-panel-legend").w(Math.min(560, this.size.width - 24)).max_h(this.size.height - BAR_H - FOOT_H - 24).p(18).gap(12).rounded(10).bg(col(PANEL)).border(1).border_color(col(LINE))
        .child(v_flex().gap(3).child(div().text_size(18).font_bold().text_color(col(PAPER)).child(t.help)).child(div().text_size(12).text_color(col(DIM)).child(t.legendSub)))
        .child(v_flex().id("se-legend-rows").gap(8).overflow_y_scrollbar().children(rows))
        .child(h_flex().pt(4).gap(8).items_center()
          .child(this.toggle("se-legend-dont", t.dontShow, P.dont, (_e, cx) => { P.dont = !P.dont; cx.notify(); }))
          .child(div().flex_1())
          .child(this.button("se-legend-ok", t.gotIt, true, ok)));
    }
    return null;
  }

  /** Everyone on the floor in a list: who, their job, what they are on, how long and how much. */
  roster(t, office, w, h, onAgent) {
    const seen = new Set();
    const line = (a) => h_flex().id(`se-roster-${a.id}`).px(8).py(5).gap(8).rounded(6).cursor_pointer()
      .hover((s) => s.bg(col(PICK)))
      .on_click(() => onAgent(a))
      .child(div().flex_none().mt(4).w(8).h(8).rounded(4).bg(col(STATUS[a.state]?.color ?? DIM)))
      .child(v_flex().flex_1().min_w(0).gap(1)
        .child(h_flex().gap(6).items_center()
          .child(div().flex_none().max_w(150).truncate().text_size(12).font_bold().text_color(col(PAPER)).child((a.lead ? "★ " : "") + (a.sub ? a.role : a.name)))
          .child(div().flex_1().truncate().text_size(10.5).text_color(col(DIM)).child(a.sub ? a.meta : a.role)))
        .when(Boolean(a.doing), (el) => el.child(div().truncate().text_size(11.5).text_color(col(SOFT)).child(a.doing))));
    const head = (label) => div().px(8).pt(8).pb(2).truncate().text_size(10.5).font_semibold().text_color(col(DIM)).child(label);
    const fresh = (list) => list.filter((a) => !seen.has(a.id) && seen.add(a.id));
    const groups = office.rooms.flatMap((r) => [head(r.title ? `${r.key} · ${r.title}` : r.key), ...fresh(r.agents).map(line)]);
    const rest = fresh(office.lounge);
    if (rest.length) groups.push(head(t.inLounge), ...rest.map(line));
    return v_flex().id("se-roster").w(w).h(h).flex_none().rounded(9).bg(col(PANEL)).border(1).border_color(col(LINE))
      .child(h_flex().h(34).flex_none().px(12).items_center().text_size(12.5).font_bold().text_color(col(PAPER))
        .child(div().flex_1().child(t.team))
        .child(div().flex_none().text_size(11).font_semibold().text_color(col(DIM)).child(String(seen.size))))
      .child(v_flex().id("se-roster-list").flex_1().min_h(0).px(4).pb(6).overflow_y_scrollbar().children(groups));
  }

  render() {
    try {
      return props()?.role === "mini" ? this.mini() : this.tower();
    } catch (e) {
      /** @type {any} */
      const err = e;
      this.error = String(err?.stack ?? err);
      writeDebug({ version: VERSION, error: this.error, at: Date.now() });
      return div().size_full().p(16).bg(col(INK)).text_color(col(ALERT)).text_size(12).child(`Sweat Equity: ${this.error.slice(0, 700)}`);
    }
  }

  /** The sidebar line, in the theme's own colors: one square per floor in its color, agents, and who needs you. */
  mini() {
    const th = theme();
    if (!this.ready) return div().size_full().bg(col(th.chrome));
    const t = this.t(), st = loadState(this.cfg);
    const model = st.demo ? demoTower() : liveTower(st);
    const all = model.floors.flatMap((f) => f.spaces);
    const agentsN = all.reduce((n, d) => n + d.agents, 0);
    const keys = new Set(all.flatMap((d) => d.keys));
    const stoppedN = st.demo ? 1 : [...keys].filter((k) => isStopped(this.jira.issues[k])).length;
    const log = readLog(), unseen = st.demo ? 0 : log.events.filter((e) => e.at > log.seen).length;
    return h_flex().id("se-mini").size_full().px(14).gap(8).items_center().cursor_pointer()
      .bg(col(th.chrome)).border_t(1).border_color(col(th.border)).text_size(11.8).text_color(col(th.muted)).tooltip(t.open)
      .hover((s) => s.bg(col(th.hover)))
      .on_click(() => run("mod.open", { name: "sweat-equity" }))
      .child(div().flex_none().font_bold().text_color(col(th.foreground)).child("▟ SE"))
      .children(model.floors.map((f) => div().flex_none().w(8).h(8).bg(col(f.color))))
      .child(div().flex_1().truncate().child(`${agentsN} ${agentsN === 1 ? t.agentWord : t.agentsWord}`))
      .when(model.waiting.length > 0, (el) => el.child(div().flex_none().font_bold().text_color(col(th.blocked)).child(`! ${model.waiting.length}`)))
      .when(stoppedN > 0, (el) => el.child(h_flex().flex_none().gap(3).items_center().font_bold().text_color(col(STOP)).tooltip(`${stoppedN} ${stoppedN === 1 ? t.stoppedOne : t.stoppedMany}`).child(this.bars(STOP, 9)).child(String(stoppedN))))
      .when(model.finished.length > 0, (el) => el.child(div().flex_none().font_bold().text_color(col(th.done)).child(`✓ ${model.finished.length}`)))
      .when(unseen > 0, (el) => el.child(div().flex_none().font_bold().text_color(col(BLUE)).tooltip(t.whileAway).child(`• ${unseen}`)));
  }

  tower() {
    if (!this.ready) {
      return div().id("se-root").size_full().bg(col(INK)).on_size_change((size, cx) => { this.size = size; cx.notify(); });
    }
    const t = this.t(), st = loadState(this.cfg);
    allowProjects(this.cfg.projects);
    const tower = st.demo ? demoTower() : liveTower(st, this.peek);
    if (!tower.hiddenN) this.peek = false;      // nothing is hidden any more: back to the plain tower
    const floor = tower.floors.find((f) => f.name === this.view && !f.hidden) ?? null;
    if (!floor) this.view = null;
    const real = tower.floors.filter((f) => !f.hidden);      // while peeking there are empty shells too; they count for nothing
    const office = floor ? (tower.demo ? demoOffice(floor, t) : liveOffice(floor, this.jira.issues, t, this.crew)) : null;
    this.keys = [...new Set(tower.floors.flatMap((f) => f.spaces.flatMap((d) => d.keys)))];
    const live = !tower.demo, tools = live && !st.presenting;
    // what the sidebar line found: PRs, tokens, pending tickets; and the stories stopped in Jira, with the floor each is on
    this.liveData = tower.demo ? demoLive() : readLive();
    const devsAll = tower.floors.filter((f) => !f.hidden).flatMap((f) => f.spaces.map((d) => ({ d, floor: f.name })));
    const stoppedKeys = tower.demo ? [{ key: "APP-151", floor: "PIXEL CO" }]
      : this.keys.filter((k) => isStopped(this.jira.issues[k])).map((k) => ({ key: k, floor: devsAll.find((x) => x.d.keys.includes(k))?.floor })).filter((x) => x.floor);
    const stoppedIds = new Set(tower.demo ? this.liveData.stopped ?? [] : devsAll.filter((x) => x.d.keys.some((k) => isStopped(this.jira.issues[k]))).map((x) => x.d.id));
    const budget = Number(this.cfg.tokenBudget) > 0 ? Number(this.cfg.tokenBudget) : 5e6;
    const usage = this.cfg.usage === false || !this.liveData.usage ? null : { tokens: this.liveData.usage.tokens, budget };
    const panel = this.panelEl(t, st, tower, office);
    // while a panel is open, what is under it does nothing
    const act = (fn) => (panel ? () => {} : fn);
    const focus = act((a) => { if (live) this.go("agent.focus", { terminal: a.address }); });

    const stageW = Math.max(200, this.size.width);
    const stageH = Math.max(160, this.size.height - BAR_H - FOOT_H);
    let k = 1, sceneW = stageW, sceneH = stageH, side = false, list = null, people = 0;
    /** @type {Scene} */
    let sc;
    if (office) {
      // an idle agent with a ticket is both at its desk (an empty chair) and in the lounge: count it once
      people = new Set([...office.rooms.flatMap((r) => r.agents), ...office.lounge].map((a) => a.id)).size;
      // the team list goes beside the floor or under it when that costs no scale; otherwise behind a button
      const rooms = office.rooms.length, whole = officeFit(stageW - 16, stageH - 16, rooms);
      const beside = officeFit(stageW - ROSTER_W - 30, stageH - 16, rooms), under = officeFit(stageW - 16, stageH - ROSTER_H - 30, rooms);
      const dock = !people ? null : beside.k === whole.k && stageW >= stageH ? "side" : under.k === whole.k ? "under" : beside.k === whole.k ? "side" : null;
      const fit = dock === "side" ? beside : dock === "under" ? under : whole;
      side = dock === "side";
      k = fit.k;
      sc = new Scene((n) => n * k);
      const talking = office.rooms.flatMap((r) => r.agents.slice(0, 6)).filter((a) => a.doing && a.state !== "idle");
      buildOffice(sc, fit, office, {
        t, spot: talking.length ? talking[this.spot % talking.length].id : null,
        onAgent: focus,
        onIssue: !tools && !(tower.demo && !st.presenting) ? null : act((room, cx) => { if (!room.general) { this.panel = { kind: "issue", key: room.key }; cx?.notify?.(); } }),
        onNew: tools ? act((cx) => this.openNew(floor.name, cx)) : null,
      });
      sceneW = fit.w * k; sceneH = fit.h * k;
      if (dock) list = this.roster(t, office, side ? ROSTER_W : Math.max(sceneW, 320), side ? Math.max(200, Math.min(sceneH, stageH - 16)) : ROSTER_H, focus);
    } else {
      const available = !st.presenting && live;
      k = facadeScale(stageW, stageH, stackOf(tower.floors).length + (available ? 1 : 0));
      sc = new Scene((n) => n * k);
      buildFacade(sc, { W: stageW / k, H: stageH / k }, { floors: tower.floors, available, waiting: tower.waiting.length, finished: tower.finished.length, loose: tools ? tower.loose : [], hiddenN: tower.hiddenN }, {
        t, peek: this.peek, issues: this.jira.issues,
        prs: this.liveData.prs ?? {}, stopped: stoppedIds, stoppedN: stoppedKeys.length, usage,
        pendingN: this.cfg.jira || tower.demo ? (this.liveData.pending?.list?.length ?? 0) : 0,
        onPending: !st.presenting ? act((cx) => this.openPending(st, cx)) : null,
        onPr: live ? act((pr) => this.openUrl(pr.url)) : null,
        onStopped: act((cx) => {
          const first = stoppedKeys[0];
          if (!first) return;
          this.view = first.floor; this.spot = 0;
          if (tools) this.panel = { kind: "issue", key: first.key };
          cx.notify();
          cx.spawn(async (cx) => { if (await this.readCrew()) cx.notify(); });
        }),
        onPeek: live ? act((cx) => { this.peek = !this.peek; cx.notify(); }) : null,
        onEnter: act((name, cx) => {
          this.view = name; this.spot = 0; cx.notify();
          cx.spawn(async (cx) => { if (await this.readCrew()) cx.notify(); });
        }),
        onSpace: act((d) => { if (live) this.go("space.select", { id: d.id }); }),
        onAdd: act((cx) => this.addWorkspace(cx)),
        onInbox: act(() => { const a = tower.waiting[0]; if (a && live) this.go("agent.focus", { terminal: a.address }); }),
        onDone: act(() => { const a = tower.finished[0]; if (a && live) this.go("agent.focus", { terminal: a.address }); }),
        onNew: tools ? act((name, cx) => this.openNew(name, cx)) : null,
        onEdit: tools ? act((name, cx) => this.openEdit(name, cx)) : null,
        onHide: tools || this.peek ? act((name) => this.toggleHidden(name)) : null,
        onDev: tools ? act((d, cx) => { this.panel = { kind: "dev", id: d.id }; cx.notify(); }) : null,
      });
    }
    const now = Date.now();
    const sig = [k, this.view, st.demo, st.presenting, this.peek, st.hidden.join(","), this.size.width, this.size.height, sc.items.length, this.jira.note, Object.values(this.jira.issues).map((i) => i ? `${i.status}:${i.cols.join(".")}` : "-").join(","), this.panel?.kind, this.outer?.width, this.outer?.height].join("|");
    if (sig !== this.lastSig || now - this.lastDebug > 5000) {
      this.lastDebug = now;
      this.lastSig = sig;
      writeDebug({
        version: VERSION, at: now, size: this.size, scale: k, view: this.view, lang: this.cfg.lang ?? "en", configError: this.cfg.error ?? null,
        workspaces: st.workspaces.length, hidden: st.hidden, peek: this.peek, presenting: st.presenting, demo: st.demo, jira: this.jira.note, missingSprites: sc.missing, elements: sc.items.length,
        panel: this.panel?.kind ?? null, pins: st.pins, outerWidth: this.outer?.width ?? null, outerHeight: this.outer?.height ?? null,
        floors: tower.floors.map((f) => ({ name: f.name, devs: f.spaces.map((d) => ({ name: d.name, machine: d.machine, status: d.status, agents: d.agents, keys: d.keys, branches: d.branches, folders: d.folders, pinned: d.pinned })) })),
        loose: tower.loose.map((d) => ({ name: d.name, machine: d.machine, branches: d.branches, folders: d.folders })),
        rooms: office ? office.rooms.map((r) => ({ key: r.key, agents: r.agents.map((a) => `${a.sub ? "+" : ""}${a.name}:${a.state}:${a.role}:${a.doing}`) })) : null,
        helpers: Object.fromEntries(Object.entries(this.crew).map(([key, v]) => [key, v.length])),
      });
    }

    const agentsN = tower.floors.reduce((n, f) => n + f.spaces.reduce((m, d) => m + d.agents, 0), 0);
    const devsN = tower.floors.reduce((n, f) => n + f.spaces.length, 0);
    const overlay = props()?.overlay;

    let bar = h_flex().h(BAR_H).flex_none().px(14).gap(8).items_center().border_b(1).border_color(col("#26305e"));
    if (office) bar = bar.child(this.button("se-back", `← ${t.tower}`, false, (_e, cx) => { this.view = null; this.panel = null; cx.notify(); }));
    bar = bar
      .child(div().flex_none().text_size(13).font_bold().text_color(col(office ? office.color : PAPER)).child(office ? office.name : t.title))
      .child(div().flex_1().truncate().text_size(11.5).text_color(col(SOFT))
        .child(`${real.length} ${real.length === 1 ? t.workspaceWord : t.workspacesWord} · ${devsN} ${t.devs} · ${agentsN} ${agentsN === 1 ? t.agentWord : t.agentsWord}${st.demo ? ` · ${t.demoOn}` : ""}`));
    if (office && people && !list) bar = bar.child(this.button("se-team", `${t.team} · ${people}`, false, (_e, cx) => { this.panel = { kind: "team" }; cx.notify(); }));
    if (live && !st.presenting) {
      const log = readLog(), unseen = log.events.filter((e) => e.at > log.seen).length;
      bar = bar.child(this.button("se-log", unseen ? `${t.log} · ${unseen}` : t.log, false, (_e, cx) => this.openLog(cx)));
    }
    bar = bar.child(this.button("se-help", "?", false, (_e, cx) => { this.panel = { kind: "legend", dont: !readPrefs().legendSeen }; cx.notify(); }).tooltip(t.help));
    if (this.cfg.jira && tools) {
      bar = bar.child(this.button("se-jira", t.refresh, false, (_e, cx) => {
        this.jira.note = "Jira…";
        cx.notify();
        cx.spawn(async (cx) => { await this.syncJira(); cx.notify(); });
      }));
    }
    if (!st.presenting && this.cfg.demo !== true) {
      bar = bar.child(this.button("se-demo", t.demo, st.demo, () => { this.view = null; this.panel = null; saveState(loadState(this.cfg), { demo: !st.demo }); }));
    }
    bar = bar.child(this.button("se-present", st.presenting ? t.stopPresent : t.present, st.presenting, () => {
      const cur = loadState(this.cfg);
      this.view = null; this.panel = null;
      saveState(cur, { presenting: !cur.presenting });
    }));
    if (overlay) bar = bar.child(this.button("se-close", "×", false, () => closeOverlay(overlay)));

    const notes = [];
    if (!st.workspaces.length && tools) notes.push(t.empty);
    if (this.jira.note && tools) notes.push(this.jira.note);
    if (this.cfg.error) notes.push(`sweat-equity.json: ${this.cfg.error}`);
    const foot = h_flex().h(FOOT_H).flex_none().px(14).items_center().text_size(11.5).text_color(col(SOFT))
      .child(div().flex_1().truncate().child(notes.join("   ·   ")));

    const scene = div().relative().flex_none().overflow_hidden().w(sceneW).h(sceneH).children(sc.elements());
    let stage = div().relative().flex_1().flex().items_center().justify_center().overflow_hidden().bg(col(office ? "#1a1c2c" : INK))
      .child(list ? (side ? h_flex() : v_flex()).gap(14).items_center().child(scene).child(list) : scene);
    if (panel) stage = stage.child(div().absolute().top(0).left(0).size_full().flex().items_center().justify_center().bg(col("#070a22b8")).child(panel));

    const frame = Array.isArray(this.cfg.frame) && this.cfg.frame.length === 2 ? this.cfg.frame : null;
    const root = v_flex().id("se-root").bg(col(INK))
      .on_size_change((size, cx) => { this.size = size; cx.notify(); })
      .child(bar)
      .child(stage)
      .child(foot);
    if (!frame) return root.size_full();
    // `frame: [width, height]` in the config: the whole view in a box of that size, centered in the window
    return div().id("se-frame").size_full().flex().items_center().justify_center().bg(col("#05071a"))
      .on_size_change((size, cx) => { this.outer = size; cx.notify(); })
      .child(root.flex_none().w(Number(frame[0])).h(Number(frame[1])).overflow_hidden());
  }
}

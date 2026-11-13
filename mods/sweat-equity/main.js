// Sweat Equity: your workspaces as a pixel-art tower at night.
// Each floor is a workspace (a folder you choose), each window a development
// (a Herdr space), and inside a floor each room is a squad: the agents whose
// git branch carries the same ticket key, sitting with the helpers they started.
//
// Roles (props.role): none = the tower, opened as a full-window overlay;
// "mini" = a one-line summary for the sidebar that opens the tower.

import { View, div, svg, image } from "gpui-kit";
import { h_flex, v_flex, InputState, Input } from "gpui-base";
import { props, run, closeOverlay, pickFolder, exec, theme, spaces, knownAgents, hc, shared, window as appWindow } from "herdr";
import { Scene, INK, ALERT, STATUS, col } from "./scene.js";
import { buildFacade, facadeScale, stackOf } from "./facade.js";
import { buildOffice, officeFit } from "./office.js";
import { TEXT, COLORS, loadConfig, loadState, saveState, liveTower, liveOffice, demoTower, demoOffice, Jira, writeDebug, fromHome, toAbs, findRepos, parseCrew, allowProjects } from "./data.js";

const BAR_H = 44, FOOT_H = 26, ROSTER_W = 312, ROSTER_H = 236;
const VERSION = "1.4.0-dev";
const PANEL = "#0f1436", LINE = "#56608f", SOFT = "#c9d6e0", DIM = "#94b0c2", PAPER = "#f4f4f8", PICK = "#1c2452", CLEAR = "#00000000";

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
    const tower = (initProps?.role ?? props()?.role) !== "mini";   // only the tower talks to Jira and reads screens
    writeDebug({ version: VERSION, at: Date.now(), started: tower ? "tower" : "mini" });   // proof that this build loaded
    cx.spawn(async (cx) => {
      this.cfg = await loadConfig();
      this.ready = true;
      cx.notify();
      if (!tower) return;
      await cx.sleep(1500);
      await this.syncJira();
      cx.notify();
    });
    if (tower) {
      cx.timer.every(120000, async (cx) => {
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
    const url = `${String(this.cfg.jira).replace(/\/+$/, "")}/browse/${key}`;
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
  openNew(name, cx) {
    const w = loadState(this.cfg).workspaces.find((x) => x.name === name);
    if (!w) return;
    const seen = (/** @type {any} */ (shared("new-menu.agents")) ?? {})[""];   // the agents Herdr's own menu last listed
    const root = toAbs(w.root);
    const P = { kind: "new", name, color: w.color, root, folders: [{ path: root, label: "" }], pick: 0, agents: Array.isArray(seen) ? seen : [], agent: 0, scanning: true, missing: false };
    this.panel = P;
    this.message.set_value("");
    cx.notify();
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
      const iss = this.jira.issues[R.key] ?? (R.cols ? { status: R.statusText, summary: R.title, cols: R.cols, curCol: R.curCol, solo: false, subs: [] } : null), names = t.colNames;
      const POSTIT = ["#f6e7a6", "#ffd7b0", "#dccbff", "#bdeccc"], TOP = (c) => (c === iss?.curCol ? "#e2532f" : LINE);
      const total = iss ? iss.cols.reduce((p, q) => p + q, 0) : 0;
      const head = v_flex().gap(4)
        .child(h_flex().gap(8).items_center().text_size(11.5)
          .child(div().font_bold().text_color(col("#ffb08a")).child(R.key))
          .child(div().px(8).py(1).rounded(10).border(1).border_color(col(LINE)).text_color(col(SOFT)).child(`Jira · ${iss?.status ?? "…"}`))
          .child(div().text_color(col(DIM)).child(iss ? (iss.solo ? t.noSubs : t.subsOf.replace("{d}", String(iss.cols[3])).replace("{n}", String(total))) : (this.jira.note || t.noBoard))))
        .child(div().text_size(16).font_bold().text_color(col(PAPER)).child(iss?.summary || R.title || R.key));
      const board = h_flex().gap(6).items_start().children(names.map((nm, c) => {
        const list = iss ? iss.subs.filter((s) => s.col === c) : [];
        return v_flex().flex_1().min_w(0).gap(6).p(6).rounded(6).bg(col(PICK)).border_t(3).border_color(col(TOP(c)))
          .child(div().text_size(11).font_bold().text_color(col(PAPER)).child(`${nm} `).child(div().text_color(col(DIM)).font_normal().child(String(list.length))))
          .children(list.map((s, i) => v_flex().id(`se-sub-${c}-${i}`).gap(3).p(7).rounded(3).bg(col(POSTIT[c])).cursor_pointer()
            .hover((x) => x.opacity(0.85)).tooltip(`${s.key} · ${s.summary}\n${s.status}`)
            .on_click(() => this.openKey(s.key))
            .child(div().text_size(11.5).font_semibold().text_color(col(INK)).child(s.summary))
            .child(div().text_size(9.5).text_color(col("#5c6078")).child(s.key))));
      }));
      // the squad: who is on it; whoever waits for you gets a banner with the way to answer
      const waiting = R.agents.filter((a) => a.state === "blocked");
      const squad = h_flex().gap(6).flex_wrap().children(R.agents.map((a, i) => h_flex().id(`se-sq-${i}`).gap(6).px(8).h(24).items_center().rounded(5).bg(col(PICK)).cursor_pointer()
        .border(1).border_color(col(STATUS[a.state]?.color ?? LINE)).tooltip(a.doing || a.name).text_size(11.5).text_color(col(PAPER))
        .on_click(() => { this.panel = null; this.go("agent.focus", { terminal: a.address }); })
        .child(div().flex_none().w(8).h(8).rounded(4).bg(col(STATUS[a.state]?.color ?? DIM)))
        .child(div().truncate().max_w(170).child(a.name))));
      const banners = waiting.map((a, i) => h_flex().id(`se-wait-${i}`).gap(10).items_center().pl(12).pr(6).py(6).rounded(8).border(2).border_color(col("#ffb020")).bg(col("#3a2a10"))
        .child(div().flex_none().w(10).h(10).rounded(5).bg(col("#ffb020")))
        .child(div().flex_1().min_w(0).truncate().text_size(12).text_color(col(PAPER)).child(t.waitsYou.replace("{who}", a.name)))
        .child(this.button(`se-reply-${i}`, t.reply, true, () => { this.panel = null; this.go("agent.focus", { terminal: a.address }); })));
      const open = this.cfg.jira ? [this.button("se-open-jira", t.openJira, true, () => this.openKey(R.key))] : [];
      const bodyH = Math.max(160, this.size.height - BAR_H - FOOT_H - 150);
      return v_flex().id("se-panel-issue").w(Math.min(760, this.size.width - 24)).max_h(this.size.height - BAR_H - FOOT_H - 24).p(14).gap(10).rounded(9).bg(col(PANEL)).border(1).border_color(col(LINE))
        .child(head)
        .child(v_flex().id("se-issue-body").gap(10).max_h(bodyH).overflow_y_scroll().child(board).child(this.section(`${t.squad} (${R.agents.length})`)).child(squad).children(banners))
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
      return this.sheet("se-panel-new", 460, t.newIn, P.name, P.color, [
        this.section(`1 · ${t.where}`),
        v_flex().id("se-folders").max_h(172).gap(2).overflow_y_scrollbar().children(folders),
        div().px(2).text_size(11).text_color(col(P.missing ? "#ff6b6b" : DIM)).child(note),
        this.section(`2 · ${t.who}`),
        v_flex().gap(2).children(who),
        this.section(`3 · ${t.first}`),
        div().id("se-message").h(34).px(8).flex().items_center().rounded(6).border(1).border_color(col(LINE)).bg(col(INK))
          .child(Input.new(this.message).h_full().text_size(12.5).text_color(col(PAPER))),
        h_flex().pt(8).gap(8).items_center()
          .child(div().flex_1().truncate().text_size(11).text_color(col(DIM)).child(t.enterHint))
          .child(this.button("se-panel-close", t.cancel, false, close))
          .child(this.button("se-start", t.start, true, () => this.start())),
      ]);
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
    return h_flex().id("se-mini").size_full().px(14).gap(8).items_center().cursor_pointer()
      .bg(col(th.chrome)).border_t(1).border_color(col(th.border)).text_size(11.8).text_color(col(th.muted)).tooltip(t.open)
      .hover((s) => s.bg(col(th.hover)))
      .on_click(() => run("mod.open", { name: "sweat-equity" }))
      .child(div().flex_none().font_bold().text_color(col(th.foreground)).child("▟ SE"))
      .children(model.floors.map((f) => div().flex_none().w(8).h(8).bg(col(f.color))))
      .child(div().flex_1().truncate().child(`${agentsN} ${agentsN === 1 ? t.agentWord : t.agentsWord}`))
      .when(model.finished.length > 0, (el) => el.child(div().flex_none().font_bold().text_color(col(th.done)).child(`✓ ${model.finished.length}`)))
      .when(model.waiting.length > 0, (el) => el.child(div().flex_none().font_bold().text_color(col(th.blocked)).child(`! ${model.waiting.length}`)));
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
        onIssue: !tools ? null : act((room, cx) => { if (!room.general) { this.panel = { kind: "issue", key: room.key }; cx?.notify?.(); } }),
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
    const sig = [k, this.view, st.demo, st.presenting, this.peek, st.hidden.join(","), this.size.width, this.size.height, sc.items.length, this.jira.note, Object.values(this.jira.issues).map((i) => i?.cols?.join(".") ?? "-").join(","), this.panel?.kind, this.outer?.width, this.outer?.height].join("|");
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

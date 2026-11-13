// From Herdr's live data to what the tower shows.
//   workspace (a folder you chose)  -> a floor
//   space under that folder         -> a window on the floor (a development),
//                                      on this computer or on another machine
//   ticket key in the git branch    -> a squad room inside the floor
// Plus the optional config file, the sample tower, and the Jira lookup.

import { spaces, agents, panes, terminals, shared, setShared, home, appHome, readTextFile, exec } from "herdr";
import { Buffer } from "buffer";
import * as fs from "fs/promises";
import { hash } from "./scene.js";
import { SEATS } from "./office.js";

const KEY = "sweat-equity";
const TICKET = /[A-Za-z][A-Za-z0-9]+-\d+/;
export const COLORS = ["#ff9b7a", "#73eff7", "#a7f070", "#d0a8ff", "#ffd27a", "#94b0c2"];

export const TEXT = {
  en: {
    title: "SWEAT EQUITY", tower: "Tower", present: "Present", stopPresent: "Stop presenting",
    devs: "dev", enter: "enter", vacant: "Floor to let", addWorkspace: "+ workspace", ground: "GF", waitsOne: "agent needs you", waitsMany: "agents need you",
    you: "You", spare: "Spare room", general: "NO TICKET", generalTitle: "Agents working without a ticket", noTitle: "", demo: "Sample", demoOn: "Sample on",
    refresh: "Refresh Jira", pick: "Use as workspace", empty: "No workspaces yet. Click “+ workspace” on the top floor and pick a folder.",
    agentsWord: "agents", agentWord: "agent", workspacesWord: "workspaces", workspaceWord: "workspace", close: "Close", open: "Open the tower",
    doneOne: "agent finished", doneMany: "agents finished", jiraTickets: "tickets",
    newBtn: "+ new", newIn: "New in", where: "WHERE", who: "WITH", first: "FIRST MESSAGE (OPTIONAL)", start: "Start", cancel: "Cancel", wsFolder: "workspace folder",
    addsTab: "open: adds a tab", newSpace: "new space", scanning: "Looking for repositories…", missing: "This folder does not exist on this computer", terminal: "Terminal only",
    editFloor: "Edit floor", nameLabel: "Name", rename: "Rename", colorLabel: "Color", folderLabel: "Folder", change: "Change…", hideFloor: "Hide this floor", showFloor: "Show this floor again", ghost: "Hidden", peekOn: "Show hidden floors", peekNone: "Nothing hidden", peekHint: "the eye on a floor hides it", peekOff: "Hide them again",
    removeFloor: "Remove floor", sure: "Remove it for good", goSpace: "Go to the space", moveTo: "Move to", sendTo: "Send to", noFloor: "Leave without a floor", auto: "Back to automatic",
    ownFloor: "A floor of its own, from its folder", outside: "no floor", team: "Team", inLounge: "In the lounge", enterHint: "Enter starts · Esc closes the tower", colNames: ["TO DO", "DOING", "REVIEW", "DONE"], subsOf: "{d} of {n} subtasks", waitsYou: "{who} is waiting for you", reply: "Reply", noSubs: "no subtasks", openJira: "Open in Jira", noBoard: "No Jira data for this story yet", squad: "Squad", board: "Board", jira401: "Jira: 401, check the email and the token in the keychain",
    catNames: ["To Do", "In Progress", "Done"], moved: "{key} moved: {from} → {to}", movedStopped: "{key} stopped: {from} → {to}",
    jiraNoKeys: "Jira connected · no branch carries a ticket key yet (like feature/ABC-12-name)",
  },
  es: {
    title: "SWEAT EQUITY", tower: "Edificio", present: "Presentar", stopPresent: "Salir de presentar",
    devs: "des.", enter: "entrar", vacant: "Piso disponible", addWorkspace: "+ workspace", ground: "PB", waitsOne: "agente te espera", waitsMany: "agentes te esperan",
    you: "Tú", spare: "Cuarto libre", general: "SIN US", generalTitle: "Agentes trabajando sin historia", noTitle: "", demo: "Demo", demoOn: "Demo activa",
    refresh: "Actualizar Jira", pick: "Usar como workspace", empty: "Aún no hay workspaces. Haz clic en “+ workspace” en el piso de arriba y elige una carpeta.",
    agentsWord: "agentes", agentWord: "agente", workspacesWord: "workspaces", workspaceWord: "workspace", close: "Cerrar", open: "Abrir el edificio",
    doneOne: "agente terminó", doneMany: "agentes terminaron", jiraTickets: "US",
    newBtn: "+ nuevo", newIn: "Nuevo en", where: "DÓNDE", who: "CON QUIÉN", first: "PRIMER MENSAJE (OPCIONAL)", start: "Iniciar", cancel: "Cancelar", wsFolder: "carpeta del workspace",
    addsTab: "abierto: se suma una pestaña", newSpace: "space nuevo", scanning: "Buscando repositorios…", missing: "Esta carpeta no existe en esta computadora", terminal: "Terminal sola",
    editFloor: "Editar piso", nameLabel: "Nombre", rename: "Renombrar", colorLabel: "Color", folderLabel: "Carpeta", change: "Cambiar…", hideFloor: "Ocultar este piso", showFloor: "Volver a mostrar este piso", ghost: "Oculto", peekOn: "Ver pisos ocultos", peekNone: "Nada oculto", peekHint: "el ojo de cada piso lo oculta", peekOff: "Volver a ocultarlos",
    removeFloor: "Quitar piso", sure: "Quitarlo de verdad", goSpace: "Ir al space", moveTo: "Mover a", sendTo: "Mandar a", noFloor: "Dejar sin piso", auto: "Volver a automático",
    ownFloor: "Piso propio, con su carpeta", outside: "sin piso", team: "Equipo", inLounge: "En la sala", enterHint: "Enter inicia · Esc cierra el edificio", colNames: ["HACER", "CURSO", "REVIEW", "HECHO"], subsOf: "{d} de {n} subtareas", waitsYou: "{who} te espera", reply: "Responder", noSubs: "sin subtareas", openJira: "Abrir en Jira", noBoard: "Aún no hay datos de Jira para esta US", squad: "Escuadrón", board: "Tablero", jira401: "Jira: 401, revisa el correo y el token del llavero",
    catNames: ["Por hacer", "En curso", "Hecho"], moved: "{key} se movió: {from} → {to}", movedStopped: "{key} se detuvo: {from} → {to}",
    jiraNoKeys: "Jira conectado · ninguna rama trae clave de US todavía (como feature/ABC-12-nombre)",
  },
};

const STRICT = /\b[A-Z][A-Z0-9]+-\d+\b/;
// Words that look like ticket keys and are not (UTF-8, SHA-1, ISO-8601...). With `projects` in the config, only those prefixes count.
const NOT_TICKETS = new Set(["UTF", "SHA", "ISO", "RFC", "HTTP", "HTTPS", "TLS", "SSL", "AES", "MD", "CVE", "COVID", "X", "X86", "IPV", "TCP", "UDP", "CRC", "RSA", "SQL", "WIN", "MAC", "IOS", "ES", "PEP", "GPT"]);
let ALLOWED = null;
/** The Jira project prefixes that count as tickets (`projects` in the config), or none for any prefix but the known false ones. */
export function allowProjects(list) { ALLOWED = Array.isArray(list) && list.length ? new Set(list.map((x) => String(x).toUpperCase())) : null; }
function validKey(key) {
  const prefix = key.slice(0, key.lastIndexOf("-")).toUpperCase();
  return ALLOWED ? ALLOWED.has(prefix) : !NOT_TICKETS.has(prefix);
}
/** A ticket key written in capitals inside any text (a terminal title, a worktree folder): stricter than a branch, so `utf-8` is not one. */
function strictTicket(s) {
  const m = s ? STRICT.exec(String(s)) : null;
  return m && validKey(m[0]) ? m[0] : null;
}

/** The ticket a branch works on: `feature/TEL-142-validate-pin` -> `TEL-142`. */
export function ticketOf(branch) {
  const m = branch ? TICKET.exec(branch) : null;
  const key = m ? m[0].toUpperCase() : null;
  return key && validKey(key) ? key : null;
}

// Home folders differ by machine and by user (`/Users/ana`, `/home/ana`, `/root`). Paths are
// compared from the home folder, so a space on another machine falls on the same floor when
// its folder sits at the same place under that machine's home.
const HOME_DIR = /^(\/Users\/[^/]+|\/home\/[^/]+|\/root)(?=\/|$)/;

/** A path with its home folder written as `~`, whichever machine it is on. */
export function fromHome(p) {
  if (p.startsWith("~")) return p;
  const h = home();
  if (h && (p === h || p.startsWith(h + "/"))) return "~" + p.slice(h.length);
  const m = HOME_DIR.exec(p);
  return m ? "~" + p.slice(m[0].length) : p;
}

function under(folder, root) {
  const r = fromHome(root).replace(/\/+$/, ""), f = fromHome(folder);
  return f === r || f.startsWith(r + "/");
}

/** A path as this computer writes it: `~/x` -> `/Users/me/x`. */
export function toAbs(p) {
  return p.startsWith("~") ? home() + p.slice(1) : p;
}

/** Git checkouts under a folder, three levels deep at most. Null when the folder is not there. */
export async function findRepos(root) {
  try {
    const r = await exec("find", [root, "-maxdepth", "3", "-name", ".git", "-not", "-path", "*/node_modules/*"], { timeout: 8000 });
    if (r.code !== 0 && !r.stdout.trim()) return null;
    return r.stdout.split("\n").filter((l) => l.endsWith("/.git")).map((l) => l.slice(0, -5)).filter((p) => p !== root).sort().slice(0, 60);
  } catch (_e) {
    return null;
  }
}

/** What a terminal's title says the agent is on, when it says something (not a path, not the program's name). */
export function telling(title, program) {
  const raw = String(title ?? "").trim(), s = raw.replace(/^[^\p{L}\p{N}]+/u, "").trim();
  if (!s || /^[~/]/.test(raw) || /^[A-Za-z]:\\/.test(raw) || s.includes("@")) return "";
  if (program && (s === program.name || s.toLowerCase() === program.key)) return "";
  return s;
}

// A line of the list an agent keeps on screen while the helpers it started run:
//   ○ general-purpose  Writing design mockup and brief     11m 17s · ↓ 251.9k tokens
const CREW_LINE = /^\s*[^\w\s]\s+(\S+(?: \S+)?)\s{2,}(.+?)\s{2,}((?:\d+\s?[hms]\s?)+)·\s*[^\d\s]?\s*([\d.,]+\s?[kKmM]?)\s*tokens/;

/** The helpers an agent lists on its own screen: [{ role, doing, meta }]. */
export function parseCrew(text) {
  const out = [];
  for (const line of String(text ?? "").split("\n")) {
    const m = CREW_LINE.exec(line);
    if (m && !out.some((c) => c.role === m[1] && c.doing === m[2].trim())) out.push({ role: m[1], doing: m[2].trim(), meta: `${m[3].trim()} · ${m[4].replace(/\s/g, "")} tokens` });
  }
  return out.slice(0, 8);
}

/** A machine's name short enough for a label: `ana-mbp.local` -> `ana-mbp`. */
function shortMachine(m) {
  const s = String(m).split(".")[0];
  return s.length > 12 ? s.slice(0, 11) + "…" : s;
}

/** Optional `~/.config/herdr-app/sweat-equity.json`: { lang, jira, keychain, jiraBoards, jiraBlocked, workspaces, demo, frame }. */
export async function loadConfig() {
  try {
    const text = await readTextFile(`${appHome()}/sweat-equity.json`);
    return text ? JSON.parse(text) : {};
  } catch (e) {
    return { error: String(e) };
  }
}

/** Workspaces, which ones are hidden, and whether we are presenting. Persisted by Herdr. */
export function loadState(cfg) {
  /** @type {any} */
  const s = shared(KEY);
  const base = { workspaces: Array.isArray(cfg?.workspaces) ? cfg.workspaces : [], hidden: [], pins: {}, presenting: false, demo: false };
  const st = s && Array.isArray(s.workspaces) ? { ...base, ...s } : base;
  if (!st.pins || typeof st.pins !== "object") st.pins = {};      // developments moved by hand: space id -> floor name, "" for none
  if (cfg?.demo === true) st.demo = true;      // the config file can force the sample tower (screenshots)
  return st;
}

export function saveState(st, patch) {
  setShared(KEY, { workspaces: st.workspaces, hidden: st.hidden, pins: st.pins, presenting: st.presenting, demo: st.demo, ...patch });
}

/** Floors (bottom-up) with their developments, spaces that match no workspace, and who waits for you.
 * A hidden floor is not in the tower: not its sign, its developments, its agents nor its counts. With
 * `showHidden` it comes back as an empty, marked shell, so it can be shown again. */
export function liveTower(st, showHidden = false) {
  const allPanes = panes(), allAgents = agents();
  const devs = spaces().map((s) => {
    const tabs = new Set(s.tabs.map((t) => t.id));
    const mine = allPanes.filter((p) => tabs.has(p.tab));
    const cwds = mine.map((p) => p.cwd).filter(Boolean);
    const folders = s.folder ? [...cwds, s.folder] : cwds;
    const list = allAgents.filter((a) => a.space === s.id);
    // the tickets of a development: its branches first, then what its terminals' titles and folders say in capitals (an agent
    // told "US RBWEB-2484 ..." works on that story even when the branch is `main`), the same rule the rooms use
    const keys = [...new Set([...mine.map((p) => ticketOf(p.branch)), ticketOf(s.branch), ...list.map((a) => strictTicket(a.title)), ...mine.map((p) => strictTicket(p.cwd))].filter(Boolean))];
    const machine = s.machine ?? null;
    const name = machine ? `${s.name}@${shortMachine(machine)}` : s.name;
    const branches = [...new Set([...mine.map((p) => p.branch), s.branch].filter(Boolean))];
    return { id: s.id, name, title: machine ? `${s.name} · ${machine}` : s.name, machine, status: list.length ? s.status : null, cwds, start: s.folder || "", folders, branches, keys, agents: list.length, list, floor: null, pinned: false };
  });
  // A development is on one floor only: where it was moved by hand, else where most of its
  // terminals are working now, else where it starts. Between nested workspace folders the deeper one wins.
  devs.forEach((d) => {
    const pin = (st.pins ?? {})[d.id];
    if (pin !== undefined && (pin === "" || st.workspaces.some((w) => w.name === pin))) { d.floor = pin || null; d.pinned = true; return; }
    let best = null, most = 0, depth = -1;
    for (const w of st.workspaces) {
      const n = d.cwds.filter((f) => under(f, w.root)).length, len = fromHome(w.root).length;
      if (n > most || (n === most && n > 0 && len > depth)) { best = w; most = n; depth = len; }
    }
    if (!best && d.start) {
      for (const w of st.workspaces) {
        const len = fromHome(w.root).length;
        if (under(d.start, w.root) && len > depth) { best = w; depth = len; }
      }
    }
    d.floor = best ? best.name : null;
  });
  const off = new Set(st.hidden ?? []);
  const floors = st.workspaces.filter((w) => showHidden || !off.has(w.name))
    .map((w) => ({ name: w.name, color: w.color, hidden: off.has(w.name), spaces: off.has(w.name) ? [] : devs.filter((d) => d.floor === w.name) }));
  const hiddenN = st.workspaces.filter((w) => off.has(w.name)).length;
  const loose = devs.filter((d) => !d.floor);
  const waiting = floors.flatMap((f) => f.spaces.flatMap((d) => d.list.filter((a) => a.status === "blocked")));
  const finished = floors.flatMap((f) => f.spaces.flatMap((d) => d.list.filter((a) => a.status === "done")));
  return { floors, loose, waiting, finished, hiddenN, demo: false };
}

/** One floor's inside: a room per ticket, a room for agents working without one, and the lounge. */
export function liveOffice(floor, issues, t, crew = {}) {
  const paneOf = new Map(panes().map((p) => [p.pane, p]));
  const all = terminals();
  const word = (s) => (s === "error" ? "blocked" : s === "working" || s === "blocked" ? s : "idle");
  // everyone is a coworker with a job and a task; helpers sit with the agent that started them
  const people = floor.spaces.flatMap((d) => d.list.flatMap((a) => {
    // the ticket an agent is on: its branch, else what its terminal title or folder says, else the one ticket its development has
    const pn = paneOf.get(a.pane);
    const key = ticketOf(pn?.branch) ?? strictTicket(a.title) ?? strictTicket(pn?.cwd) ?? (d.keys.length === 1 ? d.keys[0] : null);
    const lead = { id: a.address, address: a.address, state: a.status, persona: hash(a.address), name: d.list.length > 1 ? `${d.name} ${a.tab_name}` : d.name,
      role: a.program?.name ?? "", doing: telling(a.title, a.program), meta: "", key, sub: false, lead: false };
    // helpers: terminals this agent started through Herdr, and the ones it lists on its own screen
    const started = all.filter((k) => k.parent === a.address && k.state === "live" && word(k.status) !== "idle").map((k) => ({
      id: String(k.address), address: k.address, state: word(k.status), persona: hash(String(k.address)), name: k.program?.name || k.name || "agent",
      role: k.program?.name || k.name || "agent", doing: telling(k.title, k.program) || k.name || "", meta: "", key, sub: true, lead: false }));
    const listed = (crew[a.address] ?? []).map((c, i) => ({
      id: `${a.address}-h${i}`, address: a.address, state: "working", persona: hash(`${a.address}${c.role}${i}`), name: c.role,
      role: c.role, doing: c.doing, meta: c.meta, key, sub: true, lead: false }));
    lead.lead = started.length + listed.length > 0;
    return [lead, ...started, ...listed];
  }));
  const byKey = new Map();
  people.filter((p) => p.key).forEach((p) => byKey.set(p.key, [...(byKey.get(p.key) ?? []), p]));
  /** @type {any[]} */
  const rooms = [...byKey.keys()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map((key) => {
    const list = byKey.get(key), issue = issues[key];
    return { key, title: issue?.summary ?? "", statusText: issue?.status ?? "", counts: issue?.counts ?? null, cols: issue?.cols ?? null, names: issue?.names ?? null, blocked: issue?.blocked ?? false, blockedCols: issue?.blockedCols ?? null, curCol: issue?.curCol ?? -1, cur: issue?.cur ?? -1, agents: list, more: Math.max(0, list.length - SEATS) };
  });
  const general = people.filter((p) => !p.key && (p.state === "working" || p.state === "blocked" || p.sub));
  if (general.length) rooms.push({ key: t.general, title: t.generalTitle, statusText: "", counts: null, cur: -1, agents: general, more: Math.max(0, general.length - SEATS), general: true });
  const lounge = people.filter((p) => !p.sub && (p.state === "idle" || (!p.key && p.state === "done")));
  return { name: floor.name, color: floor.color, rooms, lounge };
}

// ---- a sample tower, for a first look and for screenshots

const DOING = { a1: "Why does the PIN check time out?", a2: "PIN endpoint and its tests", a3: "PIN screen", a4: "Release notes", a5: "Card vault client", a6: "Top-up flow", a7: "Card edge cases", a8: "Which carrier profile?" };
const demoAgent = (id, name, state) => ({ id, address: id, name, state, persona: hash(id), role: "Agent", doing: DOING[id] ?? "", meta: "", sub: false, lead: false });
const demoDev = (id, name, status, n, keys) => ({ id, name, title: name, machine: null, status, agents: n, keys, cwds: [], start: "", folders: [], branches: [], list: [], floor: null });

export function demoTower() {
  return {
    floors: [
      { name: "PIXEL CO", color: COLORS[0], hidden: false, spaces: [demoDev("d1", "mobile-app", "blocked", 3, ["APP-142"]), demoDev("d2", "backend", "working", 2, ["APP-151"]), demoDev("d3", "infra", "blocked", 1, ["APP-158"])] },
      { name: "MOONLIGHT", color: COLORS[1], hidden: false, spaces: [demoDev("d4", "portal", "working", 2, ["WEB-31"]), demoDev("d5", "billing-api", "done", 1, ["WEB-34"])] },
    ],
    loose: [], waiting: [demoAgent("x1", "qa", "blocked"), demoAgent("x2", "infra", "blocked")], finished: [demoAgent("x3", "billing-api", "done")], hiddenN: 0, demo: true,
  };
}

export function demoOffice(floor, t) {
  const room = (key, title, statusText, counts, cur, list, cols = [counts[0], counts[1], 0, counts[2]], curCol = cur === 2 ? 3 : cur) => ({ key, title, statusText, counts, cols, curCol, cur, agents: list, more: 0 });
  return {
    name: floor.name, color: floor.color,
    rooms: [
      room("APP-142", "Validate the PIN on number transfer", "In progress", [1, 2, 2], 1, [demoAgent("a1", "qa", "blocked"), demoAgent("a2", "backend", "working"), demoAgent("a3", "mobile-app", "working"), demoAgent("a4", "docs", "done")]),
      room("APP-151", "Top up with a saved card", "In review", [0, 3, 3], 1, [demoAgent("a5", "backend", "done"), demoAgent("a6", "mobile-app", "working"), demoAgent("a7", "qa", "working")], [0, 1, 2, 3], 2),
      room("APP-158", "eSIM activation", "To do", [4, 0, 0], 0, [demoAgent("a8", "backend", "blocked"), demoAgent("a9", "infra", "idle")]),
    ],
    lounge: [demoAgent("a9", "infra", "idle"), demoAgent("a10", "web", "idle"), demoAgent("a11", "tools", "done"), demoAgent("a12", "ops", "idle"), demoAgent("a13", "design", "idle")],
  };
}

// ---- Jira (optional): status, title and subtasks of each ticket on screen
//
// The columns are the ones on each project's Jira board (Agile API), read once in a while and never
// written here: a status lands in the column that lists its id. Without a board (no Jira Software, no
// access) the fallback is Jira's own three categories, named by Jira. A status is "stopped" when the
// config's `jiraBlocked` (a regex) or the default one matches its name: it keeps its column and turns red.

const CAT = { new: 0, indeterminate: 1, done: 2 };
const BOARD_TTL = 30 * 60 * 1000;
const BLOCKED = /deten|bloque|blocked|on hold|hold\b|impedi|paus|espera/i;

export class Jira {
  constructor() {
    this.auth = null;
    /** @type {Record<string, { status: string, summary: string, counts: number[], cols: number[], names: string[], cur: number, curCol: number, done: number, blocked: boolean, blockedCols: boolean[], board: string, solo?: boolean, subs: { key: string, summary: string, status: string, col: number, blocked: boolean }[] } | null>} */
    this.issues = {};
    /** project key -> { at, name, columns: { name, ids: Set<string> }[] | null } */
    this.boards = {};
    /** last status seen per issue key (stories and subtasks), to tell who moved */
    this.seen = {};
    /** @type {{ key: string, story: string, summary: string, from: string, to: string, blocked: boolean, done: boolean }[]} moves found by the last sync */
    this.moves = [];
    this.note = "";
  }

  /** Email and API token come from the macOS keychain and stay in memory. */
  async credentials(service) {
    if (this.auth) return this.auth;
    const pass = await exec("security", ["find-generic-password", "-s", service, "-w"]);
    if (pass.code !== 0 || !pass.stdout.trim()) throw new Error(`no token in the keychain (${service})`);
    const meta = await exec("security", ["find-generic-password", "-s", service]);
    const acct = /"acct"<blob>="([^"]+)"/.exec(meta.stdout + meta.stderr);
    if (!acct) throw new Error("the keychain entry has no account (-a EMAIL)");
    this.auth = "Basic " + Buffer.from(`${acct[1]}:${pass.stdout.trim()}`).toString("base64");
    return this.auth;
  }

  /**
   * The project's board columns, as Jira lists them. `cfg.jiraBoards` ({ PROJ: boardId }) picks one
   * when a project has several; otherwise the first board Jira returns for the project.
   */
  async board(host, headers, project, cfg) {
    const old = this.boards[project];
    if (old && Date.now() - old.at < BOARD_TTL) return old;
    const entry = { at: Date.now(), name: "", columns: null };
    try {
      let id = cfg.jiraBoards?.[project];
      if (!id) {
        const r = await fetch(`${host}/rest/agile/1.0/board?projectKeyOrId=${encodeURIComponent(project)}&maxResults=50`, { headers });
        if (r.ok) {
          /** @type {any} */
          const j = await r.json();
          const list = j.values ?? [];
          id = (list.find((b) => b.type === "kanban" || b.type === "simple") ?? list[0])?.id;
        }
      }
      if (id) {
        const r = await fetch(`${host}/rest/agile/1.0/board/${id}/configuration`, { headers });
        if (r.ok) {
          /** @type {any} */
          const j = await r.json();
          const cols = (j.columnConfig?.columns ?? []).map((c) => ({ name: String(c.name ?? ""), ids: new Set((c.statuses ?? []).map((s) => String(s.id))) })).filter((c) => c.ids.size);
          if (cols.length) { entry.columns = cols; entry.name = String(j.name ?? ""); }
        }
      }
    } catch (_e) { /* no board: the categories will do */ }
    // a failed read is kept a short while only, so a fix in Jira shows up soon
    if (!entry.columns) entry.at = Date.now() - BOARD_TTL + 5 * 60 * 1000;
    this.boards[project] = entry;
    return entry;
  }

  /** @param {{ jira?: string, keychain?: string, jiraBoards?: Record<string, number>, jiraBlocked?: string }} cfg @param {string[]} keys @param {Record<string, string>} t */
  async sync(cfg, keys, t) {
    this.moves = [];
    if (!cfg.jira) { this.note = ""; return; }
    const host = cfg.jira.replace(/\/+$/, "");
    let stopped = BLOCKED;
    try { if (cfg.jiraBlocked) stopped = new RegExp(cfg.jiraBlocked, "i"); } catch (_e) { /* a bad pattern: keep the default */ }
    try {
      const headers = { Authorization: await this.credentials(cfg.keychain || "herdr-jira"), Accept: "application/json" };
      if (!keys.length) {
        // nothing to look up: say whether the credentials work, and why there is no whiteboard
        const r = await fetch(`${host}/rest/api/3/myself`, { headers });
        if (r.status === 401) this.auth = null;
        this.note = r.status === 401 ? t.jira401 : r.ok ? t.jiraNoKeys : `Jira: HTTP ${r.status}`;
        return;
      }
      let found = 0;
      for (const k of Object.keys(this.issues)) if (!keys.includes(k)) delete this.issues[k];   // stories that left the tower
      for (const key of keys) {
        const r = await fetch(`${host}/rest/api/3/issue/${key}?fields=status,summary,subtasks`, { headers });
        if (r.status === 429) { this.note = `Jira: HTTP 429`; return; }   // rate limited: try again next round
        if (r.status === 401) { this.auth = null; this.note = t.jira401; return; }
        if (r.status === 404) { this.issues[key] = null; continue; }
        if (!r.ok) continue;
        /** @type {any} */
        const j = await r.json();
        const project = key.slice(0, key.lastIndexOf("-"));
        const bd = await this.board(host, headers, project, cfg);
        const names = bd.columns ? bd.columns.map((c) => c.name) : (t.catNames ?? ["To Do", "In Progress", "Done"]);
        const last = names.length - 1;
        /** the board column of a status: the one that lists its id; a status the board leaves out goes by its category */
        const column = (st) => {
          const c = CAT[st?.statusCategory?.key];
          if (bd.columns) {
            const i = bd.columns.findIndex((col) => col.ids.has(String(st?.id)));
            if (i >= 0) return i;
            if (c === undefined) return -1;
            return c === 2 ? last : c === 0 ? 0 : Math.min(1, last);
          }
          return c === undefined ? -1 : c;
        };
        const counts = [0, 0, 0], cols = names.map(() => 0), blockedCols = names.map(() => false);
        let done = 0;
        const place = (f) => {
          const c = CAT[f?.status?.statusCategory?.key];
          const k = column(f?.status);
          if (c === undefined || k < 0) return { col: -1, blocked: false };
          counts[c]++;
          if (c === 2) done++;
          cols[k]++;
          const blocked = c !== 2 && stopped.test(f.status.name ?? "");
          if (blocked) blockedCols[k] = true;
          return { col: k, blocked };
        };
        const subs = j.fields?.subtasks ?? [];
        /** each subtask with its column, for the board panel */
        const list = subs.map((s) => ({ key: s.key, summary: s.fields?.summary ?? "", status: s.fields?.status?.name ?? "", ...place(s.fields) })).filter((s) => s.col >= 0);
        const solo = !subs.length;
        if (solo) list.push({ key, summary: j.fields?.summary ?? "", status: j.fields?.status?.name ?? "", ...place(j.fields) });
        const st = j.fields?.status;
        const cur = CAT[st?.statusCategory?.key] ?? -1;
        const status = st?.name ?? "";
        const blocked = cur !== 2 && stopped.test(status);
        this.issues[key] = { status, summary: j.fields?.summary ?? "", counts, cols, names, cur, curCol: column(st), done, blocked, blockedCols, board: bd.name, solo, subs: list };
        // who moved since the last look: the story itself, then each subtask
        const watch = [{ key, summary: j.fields?.summary ?? "", status, cat: cur }, ...(solo ? [] : subs.map((s) => ({ key: s.key, summary: s.fields?.summary ?? "", status: s.fields?.status?.name ?? "", cat: CAT[s.fields?.status?.statusCategory?.key] ?? -1 })))];
        for (const w of watch) {
          const before = this.seen[w.key];
          if (before !== undefined && before !== w.status && w.status) {
            this.moves.push({ key: w.key, story: key, summary: w.summary, from: before, to: w.status, blocked: w.cat !== 2 && stopped.test(w.status), done: w.cat === 2 });
          }
          if (w.status) this.seen[w.key] = w.status;
        }
        found++;
      }
      this.note = `Jira: ${found}/${keys.length} ${t.jiraTickets}`;
    } catch (e) {
      /** @type {any} */
      const err = e;
      this.note = `Jira: ${String(err?.message ?? err).slice(0, 80)}`;
    }
  }
}

/** A snapshot for troubleshooting, in a hidden file so saving it never reloads the mod. */
export async function writeDebug(info) {
  try {
    await fs.writeFile(`${appHome()}/mods/${KEY}/.debug.json`, JSON.stringify(info, null, 1));
  } catch (_e) { /* best effort */ }
}

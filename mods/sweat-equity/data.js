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
    stoppedOne: "stopped", stoppedMany: "stopped", pendingBadge: "{n} in Jira with no agent", pending: "Pending", pendingHint: "Assigned to you in Jira, with no agent on any branch",
    readingJira: "Reading Jira…", startTicket: "Start", noPending: "Nothing assigned to you without an agent", pendingErr: "Could not read Jira", moveOnStart: "Move the ticket to {s} when starting", fromTicket: "From {key}",
    ticketMsg: "Work on {key} on a branch named {branch}: {summary}. Read the ticket in Jira before starting.", floorLabel: "Floor", priority: "priority",
    log: "Log", whileAway: "While you were away", sinceN: "since {t} · {n} events", markSeen: "Mark all seen", fAll: "All", fJira: "Jira", fAgents: "Agents", fCi: "PR and CI",
    lastHalf: "LAST HALF HOUR", earlier: "EARLIER", noEvents: "Nothing new", notifs: "Notifications", nStopped: "Stopped and finished", nAgents: "Moves by agents", nPeople: "Moves by people", nQuiet: "Quiet from {a}:00 to {b}:00",
    evWaits: "{who} is waiting for you", evDone: "{who} finished", evCiFail: "CI failed on {branch}", evCiPass: "CI passes again on {branch}", evMerged: "PR #{n} merged", evStale: "{key} has been stopped for {age}",
    grouped: "{key}: {n} subtasks moved", groupedTo: "{n} to {s}", by: "by {who}", byAgent: "agent", recent: "LATEST MOVES", ago: "{t} ago",
    tokensOf: "{t} tokens · {d} of agents", prChecks: "PR #{n} · checks {ok}/{all}", openPr: "Open PR #{n}", solarTip: "{p}% · {u} of {b} tokens today", ciFailTip: "CI failing on {n}",
    help: "How to read the tower", legendSub: "Shown once. Then it lives in the ? button on the bar.", dontShow: "Don't show again", gotIt: "Got it",
    lgWait: "An agent is waiting for you", lgWaitD: "Amber beacon with “!”. A click takes you to its terminal.", lgWork: "Working", lgWorkD: "Blue badge with dots; the window breathes.",
    lgDone: "Finished and not seen yet", lgDoneD: "Green flag with “✓”. It goes when you visit.", lgStop: "Stopped in Jira", lgStopD: "Red pause and the blind half down.",
    lgCloud: "Cloud with rain", lgCloudD: "A branch with CI failing. No clouds, everything passes.", lgSolar: "Solar panels", lgSolarD: "Today's tokens against your budget.",
    lgMoon: "The moon", lgMoonD: "If it reacts on hover, floors are hidden. A click shows them for a moment.", lgDesk: "Reception", lgDeskD: "What Jira assigns you and no agent works on.",
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
    stoppedOne: "detenida", stoppedMany: "detenidas", pendingBadge: "{n} en Jira sin agente", pending: "Pendientes", pendingHint: "Asignadas a ti en Jira, sin agente en ninguna rama",
    readingJira: "Leyendo Jira…", startTicket: "Empezar", noPending: "Nada asignado a ti sin agente", pendingErr: "No se pudo leer Jira", moveOnStart: "Mover el ticket a {s} al iniciar", fromTicket: "Desde {key}",
    ticketMsg: "Trabaja {key} en una rama llamada {branch}: {summary}. Lee el ticket en Jira antes de empezar.", floorLabel: "Piso", priority: "prioridad",
    log: "Bitácora", whileAway: "Mientras no veías", sinceN: "desde las {t} · {n} eventos", markSeen: "Marcar todo visto", fAll: "Todo", fJira: "Jira", fAgents: "Agentes", fCi: "PR y CI",
    lastHalf: "ÚLTIMA MEDIA HORA", earlier: "ANTES", noEvents: "Nada nuevo", notifs: "Avisos", nStopped: "Detenidas y terminadas", nAgents: "Movimientos de agentes", nPeople: "Movimientos de personas", nQuiet: "Silencio de {a}:00 a {b}:00",
    evWaits: "{who} te espera", evDone: "{who} terminó", evCiFail: "CI falló en {branch}", evCiPass: "CI vuelve a pasar en {branch}", evMerged: "PR #{n} mergeado", evStale: "{key} lleva {age} detenida",
    grouped: "{key}: {n} subtareas se movieron", groupedTo: "{n} a {s}", by: "por {who}", byAgent: "agente", recent: "ÚLTIMOS MOVIMIENTOS", ago: "hace {t}",
    tokensOf: "{t} tokens · {d} de agentes", prChecks: "PR #{n} · checks {ok}/{all}", openPr: "Abrir PR #{n}", solarTip: "{p}% · {u} de {b} tokens hoy", ciFailTip: "CI fallando en {n}",
    help: "Cómo leer el edificio", legendSub: "Sale una vez. Luego vive en el botón «?» de la barra.", dontShow: "No volver a mostrar", gotIt: "Entendido",
    lgWait: "Un agente te espera", lgWaitD: "Baliza ámbar con «!». Clic y vas a su terminal.", lgWork: "Trabajando", lgWorkD: "Insignia azul con puntos; la ventana respira.",
    lgDone: "Terminó y no lo has visto", lgDoneD: "Bandera verde con «✓». Se quita al visitarlo.", lgStop: "Detenida en Jira", lgStopD: "Pausa roja y persiana a media altura.",
    lgCloud: "Nube con lluvia", lgCloudD: "Una rama con CI fallando. Sin nubes, todo pasa.", lgSolar: "Paneles solares", lgSolarD: "Tokens de hoy contra tu presupuesto.",
    lgMoon: "La luna", lgMoonD: "Si reacciona al pasar, hay pisos ocultos. Clic para verlos un momento.", lgDesk: "Recepción", lgDeskD: "Lo que Jira te asigna y ningún agente trabaja.",
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

/** Optional `~/.config/herdr-app/sweat-equity.json`: { lang, jira, keychain, jiraBoards, jiraBlocked, staleHours, quietHours, pendingJql, tokenBudget, usage, workspaces, demo, frame }. */
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

/** What the sidebar line would have found, for the sample tower: a PR with its checks green, one failing, a stopped story, tokens, pending tickets. */
export function demoLive() {
  return {
    prs: { d4: { number: 12, url: "", state: "OPEN", branch: "feature/WEB-31-portal", ok: 12, fail: 0, all: 12, ci: "pass" }, d1: { number: 9, url: "", state: "OPEN", branch: "feature/APP-142-pin", ok: 5, fail: 2, all: 7, ci: "fail" } },
    usage: { tokens: 1.9e6, at: Date.now() },
    pending: { at: Date.now(), list: [
      { key: "APP-160", summary: "Roaming bundles in the plan picker", status: "To Do", cat: 0, priority: "High", rank: 2, type: "Story" },
      { key: "WEB-40", summary: "Invoice download for business accounts", status: "In Progress", cat: 1, priority: "Medium", rank: 3, type: "Story" },
      { key: "APP-163", summary: "Crash on the top-up receipt", status: "To Do", cat: 0, priority: "Highest", rank: 1, type: "Bug" },
    ] },
    stopped: ["d2"],
  };
}

// the sample story's subtasks, so the sample's board has post-its: one stopped, one moved by an agent a moment ago
const demoSubs = () => [
  { key: "APP-160", summary: "Error copy for a wrong PIN", status: "To do", col: 0 },
  { key: "APP-143", summary: "PIN endpoint with rate limit", status: "In progress", col: 1, by: "backend", at: Date.now() - 4 * 60000 },
  { key: "APP-144", summary: "PIN screen on the transfer flow", status: "On hold", col: 1, blocked: true, since: Date.now() - 26 * 3600000 },
  { key: "APP-145", summary: "Carrier API contract", status: "Done", col: 3 },
  { key: "APP-146", summary: "Audit log for transfers", status: "Done", col: 3, by: "docs" },
];

export function demoOffice(floor, t) {
  const room = (key, title, statusText, counts, cur, list, cols = [counts[0], counts[1], 0, counts[2]], curCol = cur === 2 ? 3 : cur) => ({ key, title, statusText, counts, cols, curCol, cur, agents: list, more: 0 });
  return {
    name: floor.name, color: floor.color,
    rooms: [
      { ...room("APP-142", "Validate the PIN on number transfer", "In progress", [1, 2, 2], 1, [demoAgent("a1", "qa", "blocked"), demoAgent("a2", "backend", "working"), demoAgent("a3", "mobile-app", "working"), demoAgent("a4", "docs", "done")]), subs: demoSubs() },
      room("APP-151", "Top up with a saved card", "In review", [0, 3, 3], 1, [demoAgent("a5", "backend", "done"), demoAgent("a6", "mobile-app", "working"), demoAgent("a7", "qa", "working")], [0, 1, 2, 3], 2),
      room("APP-158", "eSIM activation", "To do", [4, 0, 0], 0, [demoAgent("a8", "backend", "blocked"), demoAgent("a9", "infra", "idle")]),
    ],
    lounge: [demoAgent("a9", "infra", "idle"), demoAgent("a10", "web", "idle"), demoAgent("a11", "tools", "done"), demoAgent("a12", "ops", "idle"), demoAgent("a13", "design", "idle")],
  };
}

// ---- what the sidebar line watches and the tower shows: kept in Herdr's shared state

const LIVE = "sweat-equity.live", LOG = "sweat-equity.log", PREFS = "sweat-equity.prefs";

/** PRs by development id, today's tokens, and the pending tickets: written by the sidebar line, read by the tower. */
export function readLive() {
  /** @type {any} */
  const v = shared(LIVE);
  return v && typeof v === "object" ? v : {};
}
export function writeLive(patch) { setShared(LIVE, { ...readLive(), ...patch }); }

/** The log: newest first, at most 80 events, and when it was last looked at. */
export function readLog() {
  /** @type {any} */
  const v = shared(LOG);
  return v && Array.isArray(v.events) ? v : { events: [], seen: 0 };
}
export function logEvents(list) {
  if (!list.length) return;
  const cur = readLog();
  setShared(LOG, { ...cur, events: [...list.sort((a, b) => b.at - a.at), ...cur.events].slice(0, 80) });
}
export function markSeen() { setShared(LOG, { ...readLog(), seen: Date.now() }); }

/** What the person chose: the legend seen, and which notices to post. */
export function readPrefs() {
  /** @type {any} */
  const v = shared(PREFS);
  const p = v && typeof v === "object" ? v : {};
  return { legendSeen: !!p.legendSeen, notify: { stopped: true, agents: true, people: false, quiet: true, ...(p.notify ?? {}) } };
}
export function writePrefs(patch) { setShared(PREFS, { ...readPrefs(), ...patch }); }

/** 1234567 -> "1.2 M"; 45200 -> "45 k". */
export function fmtTokens(n) {
  return n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)} M` : n >= 1e3 ? `${Math.round(n / 1e3)} k` : String(Math.round(n));
}
/** A span of time, short: "4 min", "5 h", "2 d". */
export function fmtAge(ms) {
  const m = Math.max(1, Math.round(ms / 60000));
  return m < 60 ? `${m} min` : m < 48 * 60 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} d`;
}
/** "11m 17s · 251.9k tokens" (a helper's line on its agent's screen) -> its tokens and seconds. */
export function crewCost(meta) {
  const m = /([\d.,]+)\s?([kKmM]?)\s*tokens/.exec(meta ?? "");
  const n = m ? parseFloat(m[1].replace(/,/g, "")) * (/[kK]/.test(m[2]) ? 1e3 : /[mM]/.test(m[2]) ? 1e6 : 1) : 0;
  let secs = 0;
  for (const [, v, u] of (meta ?? "").matchAll(/(\d+)\s?([hms])/g)) secs += Number(v) * (u === "h" ? 3600 : u === "m" ? 60 : 1);
  return { tokens: n, secs };
}

let GH = null;
/** `gh` where the app's PATH may not reach it. */
async function gh(args, cwd) {
  for (const bin of GH ? [GH] : ["gh", "/opt/homebrew/bin/gh", "/usr/local/bin/gh", "/usr/bin/gh"]) {
    try {
      const r = await exec(bin, args, { cwd, timeout: 20000 });
      if (r.code === 127 || /not found|ENOENT/i.test(r.stderr ?? "")) continue;
      GH = bin;
      return r;
    } catch (_e) { /* not this one */ }
  }
  return null;
}

/**
 * The PR of each development's branch, with its checks: { [devId]: { number, url, state, branch, ok, fail, all, ci } }.
 * `ci` is "pass", "fail" or "pending". Developments on main (or with no PR, or another machine) have none.
 */
export async function readPrs(devs) {
  const out = {};
  for (const d of devs) {
    if (d.machine) continue;
    const branch = (d.branches ?? []).find((b) => b && !/^(main|master|develop|dev|HEAD)$/.test(b));
    const cwd = d.cwds?.[0] || d.start;
    if (!branch || !cwd) continue;
    const r = await gh(["pr", "view", branch, "--json", "number,url,state,statusCheckRollup"], cwd);
    if (!r || r.code !== 0) continue;
    try {
      /** @type {any} */
      const j = JSON.parse(r.stdout);
      const checks = j.statusCheckRollup ?? [];
      const st = (c) => String(c.conclusion || c.state || c.status || "");
      const fail = checks.filter((c) => /FAIL|ERROR|CANCELLED|TIMED_OUT|ACTION_REQUIRED/i.test(st(c))).length;
      const ok = checks.filter((c) => /SUCCESS|NEUTRAL|SKIPPED/i.test(st(c))).length;
      out[d.id] = { number: j.number, url: j.url, state: j.state, branch, ok, fail, all: checks.length, ci: fail ? "fail" : ok === checks.length ? "pass" : "pending" };
    } catch (_e) { /* not JSON: no PR shown */ }
  }
  return out;
}

// Today's tokens, from Claude Code's own session logs on this computer (input + output + cache writes; cache reads left out).
const USAGE = `
import os, json, glob, time, datetime
root = os.path.expanduser('~/.claude/projects'); today = datetime.date.today(); start = time.mktime(today.timetuple())
seen, total = set(), 0
for f in glob.glob(root + '/**/*.jsonl', recursive=True):
    try:
        if os.path.getmtime(f) < start: continue
        with open(f, 'rb') as fh:
            for line in fh:
                if b'"usage"' not in line: continue
                try: d = json.loads(line)
                except Exception: continue
                m = d.get('message') if isinstance(d, dict) else None
                u = m.get('usage') if isinstance(m, dict) else None
                if not isinstance(u, dict): continue
                try: t = datetime.datetime.fromisoformat(str(d.get('timestamp', '')).replace('Z', '+00:00')).astimezone()
                except Exception: continue
                if t.date() != today: continue
                k = (m.get('id'), d.get('requestId'))
                if k in seen: continue
                seen.add(k)
                total += (u.get('input_tokens') or 0) + (u.get('output_tokens') or 0) + (u.get('cache_creation_input_tokens') or 0)
    except Exception: pass
print(total)
`;
export async function readUsage() {
  try {
    const r = await exec("python3", ["-I", "-c", USAGE], { timeout: 90000 });
    const n = r.code === 0 ? Number(r.stdout.trim()) : NaN;
    return Number.isFinite(n) ? n : null;
  } catch (_e) { return null; }
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
/** The issue property an agent sets when it moves a ticket: { by: "qa-verificador", status: "QA", at: 1731500000000 }. */
export const MOVER_PROP = "sweat-equity.mover";

export class Jira {
  constructor() {
    this.auth = null;
    /** @type {Record<string, any>} key -> { status, summary, counts, cols, names, cur, curCol, done, blocked, blockedCols, board, since, by, solo, subs: [{ key, summary, status, col, blocked, since, by, at }] } | null */
    this.issues = {};
    /** project key -> { at, name, columns: { name, ids: Set<string> }[] | null } */
    this.boards = {};
    /** last status seen per issue key (stories and subtasks), to tell who moved */
    this.seen = {};
    /** key -> { status, at }: since when an issue is in its status (read from the changelog, for stopped ones) */
    this.since = {};
    /** key -> { by, status, at }: the agent that last moved it, from the issue property agents set */
    this.movers = {};
    /** keys already told about being stopped too long, with the status they were in */
    this.stale = {};
    /** @type {any[]} moves found by the last sync: { kind: "move"|"stale", key, story, summary, from, to, blocked, done, by, age } */
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

  async headers(cfg) {
    return { Authorization: await this.credentials(cfg.keychain || "herdr-jira"), Accept: "application/json" };
  }

  host(cfg) { return String(cfg.jira).replace(/\/+$/, ""); }

  stopped(cfg) {
    try { if (cfg.jiraBlocked) return new RegExp(cfg.jiraBlocked, "i"); } catch (_e) { /* a bad pattern: keep the default */ }
    return BLOCKED;
  }

  /**
   * The project's board columns, as Jira lists them. `cfg.jiraBoards` ({ PROJ: boardId }) picks one
   * when a project has several; otherwise the first kanban board Jira returns for the project.
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

  /** Since when `key` is in `status`: the last change into it in the changelog. Cached until the status changes. */
  async sinceOf(host, headers, key, status) {
    const c = this.since[key];
    if (c && c.status === status) return c.at;
    let at = null;
    try {
      let r = await fetch(`${host}/rest/api/3/issue/${key}/changelog?maxResults=100`, { headers });
      /** @type {any} */
      let j = r.ok ? await r.json() : null;
      if (j && j.total > 100) {
        r = await fetch(`${host}/rest/api/3/issue/${key}/changelog?startAt=${j.total - 100}&maxResults=100`, { headers });
        j = r.ok ? await r.json() : j;
      }
      for (const h of j?.values ?? []) {
        if ((h.items ?? []).some((it) => it.field === "status" && it.toString === status)) at = Date.parse(h.created);
      }
    } catch (_e) { /* no age shown */ }
    this.since[key] = { status, at };
    return at;
  }

  /** Who moved `key` last, when an agent said so in the issue property. */
  async moverOf(host, headers, key) {
    try {
      const r = await fetch(`${host}/rest/api/3/issue/${key}/properties/${MOVER_PROP}`, { headers });
      if (!r.ok) { delete this.movers[key]; return null; }
      /** @type {any} */
      const j = await r.json();
      const v = j?.value;
      if (v && typeof v === "object" && v.by) { this.movers[key] = { by: String(v.by), status: String(v.status ?? ""), at: Number(v.at) || null }; return this.movers[key]; }
    } catch (_e) { /* nobody said */ }
    delete this.movers[key];
    return null;
  }

  /** The mover, only while the issue is still in the status the agent moved it to. */
  byOf(key, status) {
    const m = this.movers[key];
    return m && (!m.status || m.status === status) ? m : null;
  }

  /** @param {any} cfg @param {string[]} keys @param {Record<string, any>} t */
  async sync(cfg, keys, t) {
    this.moves = [];
    if (!cfg.jira) { this.note = ""; return; }
    const host = this.host(cfg), stopped = this.stopped(cfg);
    const staleMs = (Number(cfg.staleHours) > 0 ? Number(cfg.staleHours) : 24) * 3600 * 1000;
    try {
      const headers = await this.headers(cfg);
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
          if (c === undefined || k < 0) return { col: -1, blocked: false, cat: -1 };
          counts[c]++;
          if (c === 2) done++;
          cols[k]++;
          const blocked = c !== 2 && stopped.test(f.status.name ?? "");
          if (blocked) blockedCols[k] = true;
          return { col: k, blocked, cat: c };
        };
        const subs = j.fields?.subtasks ?? [];
        const solo = !subs.length;
        const list = subs.map((s) => ({ key: s.key, summary: s.fields?.summary ?? "", status: s.fields?.status?.name ?? "", ...place(s.fields) })).filter((s) => s.col >= 0);
        if (solo) list.push({ key, summary: j.fields?.summary ?? "", status: j.fields?.status?.name ?? "", ...place(j.fields) });
        const st = j.fields?.status;
        const cur = CAT[st?.statusCategory?.key] ?? -1;
        const status = st?.name ?? "";
        const blocked = cur !== 2 && stopped.test(status);
        // who moved since the last look: the story itself, then each subtask. A key seen for the first time asks
        // whether an agent left its mark, so the robot shows from the start
        const watch = [{ key, summary: j.fields?.summary ?? "", status, cat: cur }, ...(solo ? [] : list.map((s) => ({ key: s.key, summary: s.summary, status: s.status, cat: s.cat })))];
        for (const w of watch) {
          const before = this.seen[w.key];
          if (before === undefined && w.cat !== 2) await this.moverOf(host, headers, w.key);
          if (before !== undefined && before !== w.status && w.status) {
            const by = await this.moverOf(host, headers, w.key);
            this.moves.push({ kind: "move", key: w.key, story: key, summary: w.summary, from: before, to: w.status, blocked: w.cat !== 2 && stopped.test(w.status), done: w.cat === 2, by: by && by.status === w.status ? by.by : null });
          }
          if (w.status) this.seen[w.key] = w.status;
        }
        // stopped ones: since when, and one more notice once they pass `staleHours`
        const ages = {};
        for (const w of watch) {
          if (w.cat === 2 || !stopped.test(w.status)) continue;
          const at = await this.sinceOf(host, headers, w.key, w.status);
          ages[w.key] = at;
          const tag = `${w.status}@${at}`;
          if (at && Date.now() - at > staleMs && this.stale[w.key] !== tag) {
            const first = this.stale[w.key] === undefined && !this.started;
            this.stale[w.key] = tag;
            if (!first) this.moves.push({ kind: "stale", key: w.key, story: key, summary: w.summary, from: w.status, to: w.status, blocked: true, done: false, by: null, age: Date.now() - at });
          }
        }
        const sub = list.map((s) => {
          const m = this.byOf(s.key, s.status);
          return { ...s, since: ages[s.key] ?? null, by: m?.by ?? null, at: m?.at ?? null };
        });
        const me = this.byOf(key, status);
        this.issues[key] = { status, summary: j.fields?.summary ?? "", counts, cols, names, cur, curCol: column(st), done, blocked, blockedCols, board: bd.name, since: ages[key] ?? null, by: me?.by ?? null, solo, subs: sub };
        found++;
      }
      this.started = true;
      this.note = `Jira: ${found}/${keys.length} ${t.jiraTickets}`;
    } catch (e) {
      /** @type {any} */
      const err = e;
      this.note = `Jira: ${String(err?.message ?? err).slice(0, 80)}`;
    }
  }

  /**
   * What Jira assigns to the person and no development works on: the reception's list.
   * `cfg.pendingJql` replaces the default query. Returns null when Jira cannot be read.
   */
  async pending(cfg, exclude = []) {
    if (!cfg.jira) return null;
    const jql = cfg.pendingJql || "assignee = currentUser() AND statusCategory != Done AND issuetype not in subTaskIssueTypes() ORDER BY priority DESC, updated DESC";
    try {
      const headers = { ...(await this.headers(cfg)), "Content-Type": "application/json" };
      const r = await fetch(`${this.host(cfg)}/rest/api/3/search/jql`, { method: "POST", headers, body: JSON.stringify({ jql, fields: ["summary", "status", "priority", "issuetype"], maxResults: 40 }) });
      if (r.status === 401) { this.auth = null; return null; }
      if (!r.ok) return null;
      /** @type {any} */
      const j = await r.json();
      const skip = new Set(exclude);
      return (j.issues ?? []).filter((i) => !skip.has(i.key)).map((i) => ({
        key: i.key, summary: i.fields?.summary ?? "", status: i.fields?.status?.name ?? "", cat: CAT[i.fields?.status?.statusCategory?.key] ?? -1,
        priority: i.fields?.priority?.name ?? "", rank: Number(i.fields?.priority?.id) || 3, type: i.fields?.issuetype?.name ?? "",
      }));
    } catch (_e) { return null; }
  }

  /** The column a ticket goes to when work starts on it: the board's second column, or Jira's "in progress". */
  async startColumn(cfg, key, t) {
    try {
      const host = this.host(cfg), headers = await this.headers(cfg);
      const bd = await this.board(host, headers, key.slice(0, key.lastIndexOf("-")), cfg);
      return bd.columns && bd.columns.length > 1 ? bd.columns[1].name : (t.catNames ?? [])[1] ?? "In Progress";
    } catch (_e) { return (t.catNames ?? [])[1] ?? "In Progress"; }
  }

  /** Moves a ticket into the start column: the transition whose target the board puts there, else the first one into "in progress". */
  async startWork(cfg, key) {
    const host = this.host(cfg), headers = await this.headers(cfg), stopped = this.stopped(cfg);
    const bd = await this.board(host, headers, key.slice(0, key.lastIndexOf("-")), cfg);
    const r = await fetch(`${host}/rest/api/3/issue/${key}/transitions`, { headers });
    if (!r.ok) return false;
    /** @type {any} */
    const j = await r.json();
    const list = j.transitions ?? [];
    const ids = bd.columns && bd.columns.length > 1 ? bd.columns[1].ids : null;
    const pick = (ids && list.find((x) => ids.has(String(x.to?.id)))) ?? list.find((x) => x.to?.statusCategory?.key === "indeterminate" && !stopped.test(x.to?.name ?? ""));
    if (!pick) return false;
    const w = await fetch(`${host}/rest/api/3/issue/${key}/transitions`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ transition: { id: pick.id } }) });
    return w.ok;
  }
}

/** A snapshot for troubleshooting, in a hidden file so saving it never reloads the mod. */
export async function writeDebug(info) {
  try {
    await fs.writeFile(`${appHome()}/mods/${KEY}/.debug.json`, JSON.stringify(info, null, 1));
  } catch (_e) { /* best effort */ }
}

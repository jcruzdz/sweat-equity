// Phase A: which room each agent lands in (one agent is enough), straight from the data layer.
import { liveTower, liveOffice } from "./sweat-equity/data.js";
const R = "/Users/someone/Documents/acme";
const tab = (id) => ({ id, index: 1, name: "1", named: false, active: true, status: null, panes: 1 });
const sp = (id, branch) => ({ id, index: 1, name: id, named: false, folder: R + "/" + id, machine: null, branch, active: false, status: "working", tabs: [tab("t-" + id)] });
const pn = (id, cwd, branch) => ({ pane: "p-" + id, terminal: "a-" + id, tab: "t-" + id, cwd, branch, status: "working" });
const ag = (id, space, title) => ({ address: "a-" + id, pane: "p-" + id, space, space_name: space, tab: "t-" + space, tab_index: 1, tab_name: "1", status: "working", title });
globalThis.__h = { shared: {}, props: {}, ran: [], terminals: [],
  spaces: [sp("one", "main"), sp("two", "feature/TEL-9-esim"), sp("three", "main")],
  panes: [
    pn("a", R + "/one/TEL-200-notas", "main"),      // key only in the worktree folder
    pn("b", R + "/one", "main"),                    // key only in the terminal title
    pn("c", R + "/two", "main"),                    // nothing, but its development has exactly one ticket
    pn("d", R + "/three", "main"),                  // nothing anywhere: no ticket
    pn("e", R + "/three", "main"),                  // a title that only looks like a ticket
    pn("f", R + "/two", "feature/TEL-9-esim"),
  ],
  agents: [ag("a", "one", ""), ag("b", "one", "Revisando TEL-300"), ag("c", "two", ""), ag("d", "three", ""), ag("e", "three", "utf-8 y claude-3"), ag("f", "two", "")] };
const st = { workspaces: [{ name: "ACME", root: "~/Documents/acme", color: "#f00" }], hidden: [], presenting: false, demo: false };
const tower = liveTower(st);
const t = { general: "NO TICKET", generalTitle: "sin ticket" };
const o = liveOffice(tower.floors[0], {}, t, {});
const rooms = Object.fromEntries(o.rooms.map((r) => [r.key, r.agents.map((a) => a.address).sort().join(",")]));
console.log(rooms);
const want = { "TEL-200": "a-a", "TEL-300": "a-b", "TEL-9": "a-c,a-f", "NO TICKET": "a-d,a-e" };
const ok = Object.keys(want).every((k) => rooms[k] === want[k]) && Object.keys(rooms).length === 4;
console.log(ok ? "phase A rooms: ok" : "phase A rooms: FAILED");
if (!ok) process.exitCode = 1;

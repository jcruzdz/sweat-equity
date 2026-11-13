// Which floor each development lands on, straight from the data layer.
import { liveTower } from "./sweat-equity/data.js";
const R = "/Users/someone/Documents/acme";
const tab = (id) => ({ id, index: 1, name: "1", named: false, active: true, status: null, panes: 1 });
const sp = (id, name, folder, machine = null) => ({ id, index: 1, name, named: false, folder, machine, branch: "main", active: false, status: "idle", tabs: [tab("t-" + id)] });
const pane = (id, cwd) => ({ pane: "p-" + id + cwd.length, terminal: "a-" + id, tab: "t-" + id, cwd, branch: "main", status: "idle" });
const ag = (id) => ({ address: "a-" + id, pane: "p", space: id, space_name: id, tab: "t-" + id, tab_index: 1, tab_name: "1", status: "idle" });
globalThis.__h = { shared: {}, props: {}, ran: [],
  spaces: [sp("a", "blak", "/Users/someone"), sp("b", "code", R + "/code"), sp("c", "trading", R + "/code"), sp("d", "space", "/Users/dany/Documents/acme/code/space", "macdany"), sp("e", "notes", "/Users/someone/notes"), sp("f", "deep", "/Users/someone/Documents")],
  panes: [pane("a", R + "/code/blak"), pane("a", "/Users/someone"), pane("b", R + "/code"), pane("b", R + "/code/blak"), pane("c", "/Users/someone/Documents/other/trading"), pane("d", "/Users/dany/Documents/acme/code/space"), pane("e", "/Users/someone/notes"), pane("f", R + "/x")],
  agents: ["a", "b", "c", "d", "e", "f"].map(ag) };
const st = { workspaces: [{ name: "ACME", root: "~/Documents/acme", color: "#f00" }, { name: "OTHER", root: "~/Documents/other", color: "#0f0" }, { name: "DOCS", root: "/Users/someone/Documents", color: "#00f" }], hidden: [], presenting: false, demo: false };
const t = liveTower(st);
for (const f of t.floors) console.log(f.name.padEnd(6), f.spaces.map((d) => d.name).join(", "));
console.log("loose ", t.loose.map((d) => d.name).join(", "));

// hidden floors: out of the tower, their developments out of everything, back as empty shells on request
const hid = liveTower({ ...st, hidden: ["ACME"] });
console.log("hidden ACME ->", hid.floors.map((d) => d.name).join(", "), "| loose:", hid.loose.map((d) => d.name).join(", "), "| hiddenN", hid.hiddenN);
const shells = liveTower({ ...st, hidden: ["ACME"] }, true);
console.log("showing them ->", shells.floors.map((d) => `${d.name}${d.hidden ? ` (hidden, ${d.spaces.length} devs)` : ""}`).join(", "));
const ok = !hid.floors.some((d) => d.name === "ACME") && hid.hiddenN === 1 && hid.loose.map((d) => d.name).join() === t.loose.map((d) => d.name).join()
  && shells.floors.find((d) => d.name === "ACME")?.hidden === true && shells.floors.find((d) => d.name === "ACME").spaces.length === 0;
console.log(ok ? "hidden floors: ok" : "hidden floors: FAILED");
if (!ok) process.exitCode = 1;


// localStorage persistence. The diagram name is the primary identifier:
// the index holds the ordered list of names, and each diagram's scene data
// lives under its own key so large scenes don't rewrite the whole workspace.

const INDEX_KEY = "armory.index";
const DIAGRAM_PREFIX = "armory.diagram.";
const THEME_KEY = "armory.theme";
const SIDEBAR_KEY = "armory.sidebar";

export function loadTheme() {
  return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
}

export function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

export function loadSidebarCollapsed() {
  return localStorage.getItem(SIDEBAR_KEY) !== "expanded";
}

export function saveSidebarCollapsed(collapsed) {
  localStorage.setItem(SIDEBAR_KEY, collapsed ? "collapsed" : "expanded");
}

export function listNames() {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    const names = raw ? JSON.parse(raw) : [];
    return Array.isArray(names) ? names : [];
  } catch {
    return [];
  }
}

export function saveIndex(names) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(names));
}

const LIBRARY_KEY = "armory.library";

export function loadLibrary() {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    const items = raw ? JSON.parse(raw) : [];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export function saveLibrary(items) {
  const json = JSON.stringify(items ?? []);
  // Same identical-write guard as saveDiagram, for the same cross-tab reason.
  if (localStorage.getItem(LIBRARY_KEY) !== json) {
    localStorage.setItem(LIBRARY_KEY, json);
  }
}

export function loadDiagram(name) {
  try {
    const raw = localStorage.getItem(DIAGRAM_PREFIX + name);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDiagram(name, data) {
  const key = DIAGRAM_PREFIX + name;
  const json = JSON.stringify(data);
  // Skipping identical writes keeps no-op onChange events (pointer moves,
  // the mount-time onChange after a cross-tab reload) from firing `storage`
  // events in other tabs, which would ping-pong remounts between them.
  if (localStorage.getItem(key) !== json) {
    localStorage.setItem(key, json);
  }
}

export function deleteDiagram(name) {
  localStorage.removeItem(DIAGRAM_PREFIX + name);
}

export function renameDiagram(oldName, newName) {
  const raw = localStorage.getItem(DIAGRAM_PREFIX + oldName);
  if (raw !== null) {
    localStorage.setItem(DIAGRAM_PREFIX + newName, raw);
  }
  localStorage.removeItem(DIAGRAM_PREFIX + oldName);
}

// "Diagram" -> "Diagram (2)" -> "Diagram (3)" ... first name not in `taken`.
export function nextAvailableName(base, taken) {
  const set = new Set(taken);
  if (!set.has(base)) return base;
  // If base already ends in "(n)", bump from its root instead of nesting parens.
  const match = base.match(/^(.*) \((\d+)\)$/);
  const root = match ? match[1] : base;
  let i = match ? parseInt(match[2], 10) + 1 : 2;
  while (set.has(`${root} (${i})`)) i++;
  return `${root} (${i})`;
}

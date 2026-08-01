import { useCallback, useEffect, useRef, useState } from "react";
import * as storage from "./storage.js";
import { buildPack, parseImport, downloadJson } from "./pack.js";
import { sceneFromChange } from "./scene.js";
import Sidebar from "./components/Sidebar.jsx";
import Editor from "./components/Editor.jsx";
import ExportDialog from "./components/ExportDialog.jsx";
import { ConflictDialog, SummaryDialog } from "./components/ImportDialogs.jsx";
import "./global.css";

export default function App() {
  const [names, setNames] = useState(() => storage.listNames());
  const [active, setActive] = useState(() => storage.listNames()[0] ?? null);
  const [theme, setTheme] = useState(() => storage.loadTheme());
  const [collapsed, setCollapsed] = useState(() =>
    storage.loadSidebarCollapsed()
  );
  // Bumped to force the editor to remount when the active scene is replaced
  // from the outside (e.g. an import overwrote it).
  const [sceneNonce, setSceneNonce] = useState(0);
  const [renaming, setRenaming] = useState(null); // name being renamed
  const [exportOpen, setExportOpen] = useState(false);
  const [conflict, setConflict] = useState(null); // { items, index, workingNames }
  const [importSummary, setImportSummary] = useState(null);

  const saveTimer = useRef(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  const excalidrawApiRef = useRef(null);

  const commitNames = useCallback((list) => {
    storage.saveIndex(list);
    setNames(list);
  }, []);

  // Cross-tab sync: the `storage` event fires in every OTHER tab when one
  // tab writes localStorage. Refresh whatever the remote tab changed so no
  // tab is left holding a stale copy of the index it would later clobber.
  useEffect(() => {
    function onStorage(e) {
      if (e.key !== null && !e.key.startsWith("armory.")) return;
      if (e.key === null || e.key === "armory.index") {
        // null key means localStorage.clear() happened elsewhere
        const list = storage.listNames();
        setNames(list);
        setActive((prev) =>
          prev && list.includes(prev) ? prev : (list[0] ?? null)
        );
      }
      if (e.key === null || e.key === "armory.theme") {
        setTheme(storage.loadTheme());
      }
      if (e.key === null || e.key === "armory.sidebar") {
        setCollapsed(storage.loadSidebarCollapsed());
      }
      if (e.key === null || e.key === "armory.library") {
        excalidrawApiRef.current?.updateLibrary({
          libraryItems: storage.loadLibrary(),
        });
      }
      if (e.key !== null && e.key.startsWith("armory.diagram.")) {
        const name = e.key.slice("armory.diagram.".length);
        // Active diagram was rewritten by another tab: reload it from
        // storage (last write wins).
        if (name === activeRef.current) setSceneNonce((n) => n + 1);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ---- editing / autosave -------------------------------------------------

  const handleChange = useCallback(
    (elements, appState, files) => {
      if (!active) return;
      const name = active;
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        storage.saveDiagram(name, sceneFromChange(elements, appState, files));
      }, 300);
    },
    [active]
  );

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  // ---- diagram management -------------------------------------------------

  function createDiagram() {
    const name = storage.nextAvailableName("Untitled", names);
    storage.saveDiagram(name, { elements: [], appState: {}, files: {} });
    commitNames([...names, name]);
    setActive(name);
    // The new row opens in rename mode, so the list has to be on screen.
    if (collapsed) setSidebarCollapsed(false);
    setRenaming(name);
  }

  function deleteDiagramByName(name) {
    if (!window.confirm(`Delete “${name}”? This cannot be undone.`)) return;
    storage.deleteDiagram(name);
    const list = names.filter((n) => n !== name);
    commitNames(list);
    if (active === name) setActive(list[0] ?? null);
  }

  function commitRename(oldName, rawNewName) {
    setRenaming(null);
    const newName = rawNewName.trim();
    if (!newName || newName === oldName) return;
    if (names.includes(newName)) {
      window.alert(`A diagram named “${newName}” already exists.`);
      return;
    }
    storage.renameDiagram(oldName, newName);
    commitNames(names.map((n) => (n === oldName ? newName : n)));
    if (active === oldName) setActive(newName);
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    storage.saveTheme(next);
    setTheme(next);
  }

  function setSidebarCollapsed(next) {
    storage.saveSidebarCollapsed(next);
    setCollapsed(next);
  }

  function selectDiagram(name) {
    if (name === active) return;
    // Flush any pending autosave for the current diagram before switching.
    clearTimeout(saveTimer.current);
    setActive(name);
  }

  // `to` is an insertion index into the *current* list (0..length), i.e. the
  // gap the item is dropped into, so it has to be adjusted once the dragged
  // item is spliced out from before it.
  function moveDiagram(from, to) {
    const insertAt = to > from ? to - 1 : to;
    if (insertAt === from) return;
    const list = [...names];
    const [moved] = list.splice(from, 1);
    list.splice(insertAt, 0, moved);
    commitNames(list);
  }

  // ---- export -------------------------------------------------------------

  function exportDiagrams(selected) {
    const pack = buildPack(
      selected.map((name) => ({ name, data: storage.loadDiagram(name) }))
    );
    const stamp = new Date().toISOString().slice(0, 10);
    downloadJson(pack, `armory-pack-${stamp}.json`);
    setExportOpen(false);
  }

  // ---- import -------------------------------------------------------------

  async function handleImportFile(file) {
    let items;
    try {
      const text = await file.text();
      const fallback = file.name.replace(/\.(json|excalidraw)$/i, "");
      items = parseImport(text, fallback || "Imported diagram");
    } catch (err) {
      window.alert(err.message);
      return;
    }
    if (items.length === 0) {
      window.alert("This file contains no diagrams.");
      return;
    }
    runImport(items, 0, names, { imported: 0, replaced: 0, skipped: 0 });
  }

  // Imports items sequentially; pauses on the first name conflict and stores
  // enough state in `conflict` to resume after the user picks a resolution.
  function runImport(items, startIndex, workingNames, stats) {
    const list = [...workingNames];
    for (let i = startIndex; i < items.length; i++) {
      const item = items[i];
      if (list.includes(item.name)) {
        commitNames(list);
        setConflict({ items, index: i, workingNames: list, stats });
        return;
      }
      storage.saveDiagram(item.name, item.data);
      list.push(item.name);
      stats.imported++;
    }
    commitNames(list);
    setConflict(null);
    setImportSummary(stats);
    if (!active && list.length > 0) setActive(list[0]);
  }

  function resolveConflict(action) {
    const { items, index, workingNames, stats } = conflict;
    const item = items[index];
    const list = [...workingNames];

    if (action === "replace") {
      storage.saveDiagram(item.name, item.data);
      stats.replaced++;
      if (item.name === active) setSceneNonce((n) => n + 1);
    } else if (action === "keep-both") {
      const newName = storage.nextAvailableName(item.name, list);
      storage.saveDiagram(newName, item.data);
      list.push(newName);
      stats.imported++;
    } else {
      stats.skipped++;
    }
    runImport(items, index + 1, list, stats);
  }

  // ---- render -------------------------------------------------------------

  return (
    <div className="app" data-theme={theme}>
      <Sidebar
        names={names}
        active={active}
        theme={theme}
        collapsed={collapsed}
        renaming={renaming}
        onSelect={selectDiagram}
        onCreate={createDiagram}
        onDelete={deleteDiagramByName}
        onStartRename={setRenaming}
        onCommitRename={commitRename}
        onCancelRename={() => setRenaming(null)}
        onReorder={moveDiagram}
        onToggleTheme={toggleTheme}
        onToggleCollapsed={() => setSidebarCollapsed(!collapsed)}
        onOpenExport={() => setExportOpen(true)}
        onImportFile={handleImportFile}
      />

      <Editor
        name={active}
        sceneNonce={sceneNonce}
        theme={theme}
        apiRef={excalidrawApiRef}
        onChange={handleChange}
        onCreate={createDiagram}
      />

      {exportOpen && (
        <ExportDialog
          names={names}
          onExport={exportDiagrams}
          onClose={() => setExportOpen(false)}
        />
      )}

      {conflict && (
        <ConflictDialog
          name={conflict.items[conflict.index].name}
          position={conflict.index + 1}
          total={conflict.items.length}
          onResolve={resolveConflict}
        />
      )}

      {importSummary && (
        <SummaryDialog
          stats={importSummary}
          onClose={() => setImportSummary(null)}
        />
      )}
    </div>
  );
}

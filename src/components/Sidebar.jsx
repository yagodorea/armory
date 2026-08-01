import { useRef, useState } from "react";
import DiagramItem from "./DiagramItem.jsx";
import "./Sidebar.css";

function insertionIndex({ index, edge }) {
  return edge === "before" ? index : index + 1;
}

export default function Sidebar({
  names,
  active,
  theme,
  collapsed,
  renaming,
  onSelect,
  onCreate,
  onDelete,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onReorder,
  onToggleTheme,
  onToggleCollapsed,
  onOpenExport,
  onImportFile,
}) {
  const [dragName, setDragName] = useState(null); // name being dragged
  const [dropTarget, setDropTarget] = useState(null); // { index, edge }
  const fileInputRef = useRef(null);

  function endDrag() {
    setDragName(null);
    setDropTarget(null);
  }

  function handleItemDragOver(e, index) {
    if (dragName === null) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    const rect = e.currentTarget.getBoundingClientRect();
    const edge = e.clientY - rect.top < rect.height / 2 ? "before" : "after";
    setDropTarget((prev) =>
      prev?.index === index && prev.edge === edge ? prev : { index, edge }
    );
  }

  function handleDrop(e) {
    if (dragName === null || dropTarget === null) return endDrag();
    e.preventDefault();
    const from = names.indexOf(dragName);
    if (from !== -1) onReorder(from, insertionIndex(dropTarget));
    endDrag();
  }

  const dragIndex = dragName === null ? -1 : names.indexOf(dragName);
  const dropAt = dropTarget === null ? -1 : insertionIndex(dropTarget);
  // Hide the indicator for the two gaps that would leave the order unchanged.
  const showDrop =
    dropAt !== -1 &&
    dragIndex !== -1 &&
    dropAt !== dragIndex &&
    dropAt !== dragIndex + 1;

  function dropEdgeFor(index) {
    if (!showDrop) return null;
    if (dropAt === index) return "before";
    if (dropAt === names.length && index === names.length - 1) return "after";
    return null;
  }

  return (
    <aside className={collapsed ? "sidebar collapsed" : "sidebar"}>
      <header className="sidebar-header">
        <h1>Armory</h1>
        <div className="sidebar-header-actions">
          <button
            className="icon-btn theme-toggle"
            title={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            onClick={onToggleTheme}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <button className="btn primary" onClick={onCreate}>
            + New
          </button>
        </div>
        <button
          className="icon-btn sidebar-toggle"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          onClick={onToggleCollapsed}
        >
          {collapsed ? "»" : "«"}
        </button>
      </header>

      <nav
        className="diagram-list"
        // Dropping in the empty space below the last item appends.
        onDragOver={(e) => {
          if (dragName === null || names.length === 0) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          setDropTarget({ index: names.length - 1, edge: "after" });
        }}
        onDrop={handleDrop}
      >
        {names.length === 0 && <p className="empty-hint">No diagrams yet.</p>}
        {names.map((name, index) => (
          <DiagramItem
            key={name}
            name={name}
            active={name === active}
            dragging={name === dragName}
            dropEdge={dropEdgeFor(index)}
            renaming={renaming === name}
            onSelect={() => onSelect(name)}
            onStartRename={() => onStartRename(name)}
            onCommitRename={(value) => onCommitRename(name, value)}
            onCancelRename={onCancelRename}
            onDelete={() => onDelete(name)}
            dragHandlers={{
              onDragStart: (e) => {
                e.dataTransfer.effectAllowed = "move";
                // Firefox ignores drags that carry no payload.
                e.dataTransfer.setData("text/plain", name);
                setDragName(name);
              },
              onDragOver: (e) => handleItemDragOver(e, index),
              onDrop: (e) => {
                e.stopPropagation();
                handleDrop(e);
              },
              onDragEnd: endDrag,
            }}
          />
        ))}
      </nav>

      <footer className="sidebar-footer">
        <button
          className="btn"
          disabled={names.length === 0}
          onClick={onOpenExport}
        >
          Export
        </button>
        <button className="btn" onClick={() => fileInputRef.current.click()}>
          Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.excalidraw,application/json"
          hidden
          onChange={(e) => {
            const file = e.target.files[0];
            e.target.value = "";
            if (file) onImportFile(file);
          }}
        />
      </footer>
    </aside>
  );
}

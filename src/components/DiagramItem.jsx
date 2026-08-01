import "./DiagramItem.css";

export default function DiagramItem({
  name,
  active,
  dragging,
  dropEdge, // "before" | "after" | null
  renaming,
  onSelect,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onDelete,
  dragHandlers,
}) {
  const className = [
    "diagram-item",
    active ? "active" : "",
    dragging ? "dragging" : "",
    dropEdge === "before" ? "drop-before" : "",
    dropEdge === "after" ? "drop-after" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={className}
      // Renaming turns dragging off so the input's text selection and
      // caret dragging keep working.
      draggable={!renaming}
      onClick={onSelect}
      onDoubleClick={onStartRename}
      title={name}
      {...dragHandlers}
    >
      {renaming ? (
        <input
          className="rename-input"
          autoFocus
          defaultValue={name}
          onFocus={(e) => e.target.select()}
          onClick={(e) => e.stopPropagation()}
          onBlur={(e) => onCommitRename(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onCommitRename(e.target.value);
            if (e.key === "Escape") onCancelRename();
          }}
        />
      ) : (
        <>
          <span className="diagram-name">{name}</span>
          <button
            className="icon-btn delete-btn"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            ×
          </button>
        </>
      )}
    </div>
  );
}

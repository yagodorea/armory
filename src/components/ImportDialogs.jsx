import Modal from "./Modal.jsx";
import "./ImportDialogs.css";

export function ConflictDialog({ name, position, total, onResolve }) {
  return (
    <Modal title="Name conflict">
      <p className="conflict-text">
        A diagram named <strong>"{name}"</strong> already exists in this
        workspace.
      </p>
      {total > 1 && (
        <p className="conflict-progress">
          Diagram {position} of {total} in this pack
        </p>
      )}
      <div className="modal-actions">
        <button className="btn" onClick={() => onResolve("cancel")}>
          Cancel
        </button>
        <button className="btn" onClick={() => onResolve("keep-both")}>
          Keep both
        </button>
        <button className="btn danger" onClick={() => onResolve("replace")}>
          Replace
        </button>
      </div>
    </Modal>
  );
}

export function SummaryDialog({ stats, onClose }) {
  const parts = [];
  if (stats.imported) parts.push(`${stats.imported} imported`);
  if (stats.replaced) parts.push(`${stats.replaced} replaced`);
  if (stats.skipped) parts.push(`${stats.skipped} skipped`);
  return (
    <Modal title="Import finished" onClose={onClose}>
      <p>{parts.length > 0 ? parts.join(", ") + "." : "Nothing imported."}</p>
      <div className="modal-actions">
        <button className="btn primary" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  );
}

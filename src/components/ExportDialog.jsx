import { useState } from "react";
import Modal from "./Modal.jsx";
import "./ExportDialog.css";

export default function ExportDialog({ names, onExport, onClose }) {
  const [selected, setSelected] = useState(() => new Set(names));

  function toggle(name) {
    const next = new Set(selected);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelected(next);
  }

  return (
    <Modal title="Export diagrams" onClose={onClose}>
      <div className="export-toolbar">
        <button
          className="link-btn"
          onClick={() => setSelected(new Set(names))}
        >
          Select all
        </button>
        <button className="link-btn" onClick={() => setSelected(new Set())}>
          Select none
        </button>
      </div>
      <div className="export-list">
        {names.map((name) => (
          <label key={name} className="export-item">
            <input
              type="checkbox"
              checked={selected.has(name)}
              onChange={() => toggle(name)}
            />
            <span>{name}</span>
          </label>
        ))}
      </div>
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn primary"
          disabled={selected.size === 0}
          onClick={() => onExport(names.filter((n) => selected.has(n)))}
        >
          Export {selected.size} diagram{selected.size === 1 ? "" : "s"}
        </button>
      </div>
    </Modal>
  );
}

export default function ExportTextModal({ open, onClose, text }) {
  if (!open) return null;

  const copy = async () => {
    await navigator.clipboard.writeText(text);
  };

  return (
    <div className="modalBackdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <strong>Export Text</strong>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="primary" onClick={copy}>Copy</button>
            <button onClick={onClose}>Close</button>
          </div>
        </div>
        <div className="modalBody">
          <textarea className="textarea" readOnly value={text} />
        </div>
      </div>
    </div>
  );
}


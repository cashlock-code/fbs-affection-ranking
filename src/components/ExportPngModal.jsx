import { useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import ExportCard from "./ExportCard.jsx";

export default function ExportPngModal({ open, onClose, teamsById, tierState }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const download = async () => {
    try {
      setBusy(true);
      const node = ref.current;
      const dataUrl = await htmlToImage.toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "fbs-affection-ranking.png";
      a.click();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modalBackdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <strong>Export PNG</strong>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="primary" onClick={download} disabled={busy}>
              {busy ? "Rendering…" : "Download PNG"}
            </button>
            <button onClick={onClose} disabled={busy}>Close</button>
          </div>
        </div>
        <div className="modalBody">
          <div className="exportCardWrap">
            <div ref={ref}>
              <ExportCard teamsById={teamsById} tierState={tierState} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


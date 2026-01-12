import { useState } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableTeam from "./SortableTeam.jsx";

function ShortcutsModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modal sickoShortcutsModal" onClick={(e) => e.stopPropagation()}>
        <div className="modalTop">
          <h2>Keyboard Shortcuts (Sicko Mode)</h2>
        </div>

        <div className="modalBody">
          <div className="small" style={{ marginBottom: 10 }}>
            These work when the cursor is not in an input/select/textarea.
          </div>

          <div className="shortcutsGrid">
            <div className="shortcutRow">
              <span className="shortcutKey">↑</span>
              <span className="shortcutKey">k</span>
              <span className="shortcutDesc">Move selected team up</span>
            </div>

            <div className="shortcutRow">
              <span className="shortcutKey">↓</span>
              <span className="shortcutKey">j</span>
              <span className="shortcutDesc">Move selected team down</span>
            </div>

            <div className="shortcutRow">
              <span className="shortcutKey">t</span>
              <span className="shortcutDesc">Move selected team to top</span>
            </div>

            <div className="shortcutRow">
              <span className="shortcutKey">m</span>
              <span className="shortcutDesc">Move selected team to middle</span>
            </div>

            <div className="shortcutRow">
              <span className="shortcutKey">b</span>
              <span className="shortcutDesc">Move selected team to bottom</span>
            </div>

            <div className="shortcutRow">
              <span className="shortcutKey">Esc</span>
              <span className="shortcutDesc">Clear selection</span>
            </div>
          </div>
        </div>

        <div className="modalActions">
          <button className="primary" onClick={onClose} type="button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SickoList({ ids, teamsById, selectedId, onSelect, onMove }) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const hasSelection = !!selectedId;

  return (
    <div className="sickoWrap">
      <div className="sickoHeaderWide">
        <div>
          <h2 style={{ margin: 0 }}>All Teams</h2>
          <div className="small">From most favorite to least favorite</div>
        </div>
        <div className="small">Count: {ids.length}</div>
      </div>

      <div className="sickoControls">
        <button className="primary" onClick={() => onMove("top")} disabled={!hasSelection} type="button">
          Top
        </button>
        <button onClick={() => onMove("up")} disabled={!hasSelection} type="button">
          Up
        </button>
        <button onClick={() => onMove("middle")} disabled={!hasSelection} type="button">
          Middle
        </button>
        <button onClick={() => onMove("down")} disabled={!hasSelection} type="button">
          Down
        </button>
        <button onClick={() => onMove("bottom")} disabled={!hasSelection} type="button">
          Bottom
        </button>

        {/* New small link right after Bottom */}
        <button
          type="button"
          className="shortcutLink"
          onClick={() => setShortcutsOpen(true)}
          title="View Sicko Mode keyboard shortcuts"
        >
          keyboard shortcuts
        </button>

        <div className="small" style={{ marginLeft: "auto" }}>
          {hasSelection ? (
            <>
              Selected: <strong>{teamsById[selectedId]?.name}</strong> (click again to clear)
            </>
          ) : (
            <>Click a team to enable controls</>
          )}
        </div>
      </div>

      <div className="list sickoList">
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {ids.map((id) => (
            <div
              key={id}
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(id);
              }}
            >
              <SortableTeam id={id} team={teamsById[id]} showRank={false} selected={selectedId === id} />
            </div>
          ))}
        </SortableContext>
      </div>

      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}

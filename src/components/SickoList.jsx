import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableTeam from "./SortableTeam.jsx";

export default function SickoList({ ids, teamsById, selectedId, onSelect, onMove }) {
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
    </div>
  );
}

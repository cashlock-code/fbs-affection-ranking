import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableTeam from "./SortableTeam.jsx";
import { POOL_ID } from "../data/tiers.js";

export default function Pool({
  poolIds,
  teamsById,
  search,
  setSearch,
  conference,
  setConference,
  conferences,
  onContainerTap,
  onTeamTap,
  selectedTeamId,
}) {
  const { setNodeRef, isOver } = useDroppable({ id: POOL_ID });

  return (
    <div className="panel">
      <div className="poolTop">
        <div className="row">
          <input
            type="text"
            placeholder="Search teams…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            name="team-search"
            id="team-search"
          />

          <select
            value={conference}
            onChange={(e) => setConference(e.target.value)}
            name="conference"
            id="conference"
          >
            {conferences.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div className="small" style={{ marginLeft: "auto" }}>
            Unranked: {poolIds.length}
          </div>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className="list tapTarget"
        onClick={() => onContainerTap?.(POOL_ID)}
        style={{
          background: isOver ? "rgba(47, 111, 62, 0.06)" : "transparent",
          borderRadius: 12,
        }}
      >
        <SortableContext items={poolIds} strategy={verticalListSortingStrategy}>
          {poolIds.map((id) => (
            <SortableTeam
              key={id}
              id={id}
              team={teamsById[id]}
              showRank={false}
              selected={selectedTeamId === id}
              onClick={(e) => {
                e.stopPropagation();
                onTeamTap?.(id);
              }}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

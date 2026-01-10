import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableTeam from "./SortableTeam.jsx";

export default function Tier({ tier, ids, ordered, onToggleOrdered, teamsById, sickoMode, onContainerTap, onTeamTap, selectedTeamId }) {
  const { setNodeRef, isOver } = useDroppable({ id: tier.id });
  const canToggle = tier.toggleableOrdered;

  return (
    <div className="panel tier">
      <div className="tier-top">
        <div className="tier-title">
          <h2>{tier.name}</h2>
          <span className="small">{ids.length}{tier.capacity === 1 ? "/1" : ""}</span>
        </div>

        {canToggle ? (
          <label className="toggle">
            <input
              type="checkbox"
              checked={ordered}
               onChange={(e) => onToggleOrdered(tier.id, e.target.checked)}
                 disabled={sickoMode}   // lock in sicko mode
            />
            Ordered
          </label>
        ) : null}
      </div>

      <div
        ref={setNodeRef}
        className="list tapTarget"
        onClick={() => onContainerTap(tier.id)}
        style={{
          outline: isOver ? "2px solid rgba(47, 111, 62, 0.45)" : "none",
        }}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {ids.map((id, idx) => (
            <SortableTeam
              key={id}
              id={id}
              team={teamsById[id]}         // ✅ this is the fix
              showRank={ordered && tier.capacity !== 1}
              rank={idx + 1}
              selected={selectedTeamId === id}
   onClick={(e) => {
     e.stopPropagation();
     onTeamTap(id);
   }}
            />
          ))}
        </SortableContext>
      </div>


    </div>
  );
}

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableTeam from "./SortableTeam.jsx";

export default function Tier({
  tier,
  ids,
  ordered,
  onToggleOrdered,
  teamsById,
  sickoMode = false,
  onContainerTap,
  onTeamTap,
  selectedTeamId,
}) {
  const { setNodeRef, isOver } = useDroppable({ id: tier.id });

  const canToggle = !!tier.toggleableOrdered;

  return (
    <div className="panel tier">
      <div className="tierHeader">
        <div>
          <h2>{tier.name}</h2>
          {tier.note ? <div className="small">{tier.note}</div> : null}
        </div>

        {canToggle ? (
          <label className="toggle">
            <input
              type="checkbox"
              checked={!!ordered}
              onChange={(e) => onToggleOrdered(tier.id, e.target.checked)}
              disabled={!!sickoMode}
            />
            Ordered
          </label>
        ) : null}
      </div>

      <div
        ref={setNodeRef}
        className="list tapTarget"
        onClick={() => onContainerTap?.(tier.id)}
        style={{
          background: isOver ? "rgba(47, 111, 62, 0.06)" : "transparent",
          borderRadius: 12,
        }}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {ids.map((id, idx) => (
            <SortableTeam
              key={id}
              id={id}
              team={teamsById[id]}
              showRank={!!ordered && tier.capacity !== 1}
              rank={idx + 1}
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

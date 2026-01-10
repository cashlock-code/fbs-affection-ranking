import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TeamRow from "./TeamRow.jsx";

export default function SortableTeam({ id, team, showRank, rank, onClick, selected }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <TeamRow
      team={team}
      rank={rank}
      showRank={showRank}
      setNodeRef={setNodeRef}
      attributes={attributes}
      listeners={listeners}
      style={style}
      onClick={onClick}
      selected={selected}
    />
  );
}

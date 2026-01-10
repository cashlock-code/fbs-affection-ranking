import Badge from "./Badge.jsx";

export default function TeamRow({
  team,
  rank,
  listeners,
  attributes,
  setNodeRef,
  style,
  showRank,
  onClick,
  selected,
}) {
  if (!team) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`team-row${selected ? " selected" : ""}`}
      {...attributes}
      {...listeners}
      onClick={onClick}
      title={team.name}
    >
      <img className="logo" src={team.logoUrl} alt={`${team.name} logo`} />
      <div className="team-name">{team.name}</div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {showRank ? <span className="rankNum">#{rank}</span> : null}
        <Badge>{team.conference}</Badge>
      </div>
    </div>
  );
}

import Badge from "./Badge.jsx";

export default function TeamRow({
  team,
  rank,
  showRank,
  setNodeRef,
  attributes,
  listeners,
  style,
  onClick,
  selected,
}) {
  if (!team) return null;

  const safeLogo = (team.logoUrl || "").replace(/^http:\/\//i, "https://");

  return (
    <div
      ref={setNodeRef}
      className={`team-row${selected ? " selected" : ""}`}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
    >
      <img className="logo" src={safeLogo} alt="" crossOrigin="anonymous" />
      <div className="team-name">{team.name}</div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {showRank ? <span className="rankNum">#{rank}</span> : null}
        <Badge>{team.conference}</Badge>
      </div>
    </div>
  );
}

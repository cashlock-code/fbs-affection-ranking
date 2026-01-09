import { TIER_ORDER, TIERS } from "../data/tiers.js";

export default function ExportCard({ teamsById, tierState }) {
  const now = new Date();

  return (
    <div className="exportCard" id="export-card">
      <div className="exportTitle">
        <h1>My FBS Feelings</h1>
        <div className="small">{now.toLocaleDateString()}</div>
      </div>

      <div className="exportGrid">
        {TIER_ORDER.map((tid) => {
  const tier = TIERS[tid];
  const ids = tierState[tid].teamIds;

  // 🔴 NEW: skip empty tiers
  if (!ids || ids.length === 0) return null;

  const ordered = tierState[tid].ordered && tier.toggleableOrdered;

  return (
    <div className="exportTier" key={tid}>
      <h2>{tier.name}</h2>

      {ids.map((id, idx) => {
        const t = teamsById[id];
        return (
          <div className="exportTeam" key={id}>
            <img className="logo" src={t.logoUrl} alt="" crossOrigin="anonymous" />
            <div className="team-name">{t.name}
              {tid === "favorite" ? " 👑" : ""}
  {tid === "always_lose" ? " 😈" : ""}  
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {ordered && tier.capacity !== 1 ? (
                <span className="rankNum">#{idx + 1}</span>
              ) : null}
              <span className="badge">{t.conference}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
})}

      </div>
      <div className="exportFooterUrl">
  cashlock-code.github.io/fbs-affection-ranking/
</div>
    </div>
  );
}


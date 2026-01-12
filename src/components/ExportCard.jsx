import { TIERS, TIER_ORDER } from "../data/tiers.js";

export default function ExportCard({ teamsById, tierState, sickoMode, sickoIds }) {
  if (sickoMode) {
    const ids = sickoIds || [];
    const mid = Math.ceil(ids.length / 2);
    const left = ids.slice(0, mid);
    const right = ids.slice(mid);

    return (
      <div className="exportCard">
        <div className="exportTop">
          <h1>My College Football Feeling (FBS)</h1>
        </div>

        <div className="exportTier">
          <h2>All Teams (Sicko Mode)</h2>
          <div className="small">From most favorite to least favorite</div>

          <div className="exportSickoGrid">
            <div className="exportSickoCol">
              {left.map((id, idx) => {
                const t = teamsById[id];
                const safeLogo = (t?.logoUrl || "").replace(/^http:\/\//i, "https://");
                return (
                  <div className="exportTeam" key={id}>
                    <img className="logo" src={safeLogo} alt="" crossOrigin="anonymous" />
                    <div className="team-name">
                      {idx + 1}. {t?.name}
                    </div>
                    <span className="badge">{t?.conference}</span>
                  </div>
                );
              })}
            </div>

            <div className="exportSickoCol">
              {right.map((id, idx) => {
                const t = teamsById[id];
                const safeLogo = (t?.logoUrl || "").replace(/^http:\/\//i, "https://");
                const n = mid + idx + 1;
                return (
                  <div className="exportTeam" key={id}>
                    <img className="logo" src={safeLogo} alt="" crossOrigin="anonymous" />
                    <div className="team-name">
                      {n}. {t?.name}
                    </div>
                    <span className="badge">{t?.conference}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="exportFooterUrl">cashlock-code.github.io/fbs-affection-ranking/</div>
      </div>
    );
  }

  // Normal export (tiers) — omits empty tiers (assumes caller already did, but we also guard)
  return (
    <div className="exportCard">
      <div className="exportTop">
        <h1>My College Football Feeling (FBS)</h1>
      </div>

      <div className="exportGrid">
        {TIER_ORDER.map((tid) => {
          const tier = TIERS[tid];
          const ids = tierState[tid].teamIds;
          if (!ids || ids.length === 0) return null;

          const ordered = tierState[tid].ordered && tier.toggleableOrdered;

          return (
            <div className="exportTier" key={tid}>
              <h2>{tier.name}</h2>

              {ids.map((id, idx) => {
                const t = teamsById[id];
                const safeLogo = (t?.logoUrl || "").replace(/^http:\/\//i, "https://");
                return (
                  <div className="exportTeam" key={id}>
                    <img className="logo" src={safeLogo} alt="" crossOrigin="anonymous" />
                    <div className="team-name">
                      {t?.name}
                      {tid === "favorite" ? " 👑" : ""}
                      {tid === "always_lose" ? " 😈" : ""}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {ordered && tier.capacity !== 1 ? <span className="rankNum">#{idx + 1}</span> : null}
                      <span className="badge">{t?.conference}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="exportFooterUrl">cashlock-code.github.io/fbs-affection-ranking/</div>
    </div>
  );
}

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableTeam from "./SortableTeam.jsx";

export default function Pool({ poolIds, teamsById, search, setSearch, conference, setConference, conferences }) {
  const { setNodeRef, isOver } = useDroppable({ id: "pool" });

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 style={{ margin: 0, fontSize: 15 }}>Unranked Teams</h2>
        <p className="small" style={{ marginTop: 6 }}>
          {poolIds.length} teams
        </p>
      </div>
      <div className="panel-body">
        <div className="row" style={{ marginBottom: 10 }}>
          <input
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams…"
          />
        </div>
        <div className="row" style={{ marginBottom: 10 }}>
          <select className="select" value={conference} onChange={(e) => setConference(e.target.value)}>
            <option value="ALL">All conferences</option>
            {conferences.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div
          ref={setNodeRef}
          className="list"
          style={{
            outline: isOver ? "2px solid rgba(47, 111, 62, 0.45)" : "none",
          }}
        >
          <SortableContext items={poolIds} strategy={verticalListSortingStrategy}>
            {poolIds.map((id) => (
              <SortableTeam key={id} id={id} team={teamsById[id]} showRank={false} />
            ))}
          </SortableContext>
        </div>

        <div className="dragHint">Drag teams into tiers. Pool is always alphabetized.</div>
      </div>
    </div>
  );
}


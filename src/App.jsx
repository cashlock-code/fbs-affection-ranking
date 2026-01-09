import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import teamsData from "../data/teams.json";
import { POOL_ID, TIER_ORDER, TIERS } from "./data/tiers.js";
import { normalizeContainer, sortIdsByName } from "./utils/sort.js";

import Pool from "./components/Pool.jsx";
import Tier from "./components/Tier.jsx";
import ExportTextModal from "./components/ExportTextModal.jsx";
import ExportPngModal from "./components/ExportPngModal.jsx";
import TeamRow from "./components/TeamRow.jsx";

function buildTeamsById(teamsArr) {
  const m = {};
  for (const t of teamsArr) m[t.id] = t;
  return m;
}

function getConferences(teamsArr) {
  return [...new Set(teamsArr.map((t) => t.conference))].sort((a, b) => a.localeCompare(b));
}

function initialTierState() {
  const state = {};
  for (const tid of TIER_ORDER) {
    state[tid] = {
      ordered: TIERS[tid].defaultOrdered,
      teamIds: [],
    };
  }
  return state;
}

function buildExportText(teamsById, tierState) {
  const lines = [];

  for (const tid of TIER_ORDER) {
    const tier = TIERS[tid];
    const { ordered, teamIds } = tierState[tid];

    // 🔴 NEW: skip empty tiers
    if (!teamIds || teamIds.length === 0) continue;

    lines.push(`${tier.name}:`);

    if (tier.capacity === 1) {
      lines.push(teamsById[teamIds[0]].name);
      lines.push("");
      continue;
    }

    if (tier.toggleableOrdered && ordered) {
      teamIds.forEach((id, idx) => {
        lines.push(`${idx + 1}. ${teamsById[id].name}`);
      });
    } else {
      teamIds.forEach((id) => {
        lines.push(`- ${teamsById[id].name}`);
      });
    }

    lines.push("");
  }

  return lines.join("\n").trim();
}


export default function App() {
  const teamsById = useMemo(() => buildTeamsById(teamsData), []);
  const conferences = useMemo(() => getConferences(teamsData), []);

  const allIds = useMemo(() => sortIdsByName(teamsData.map((t) => t.id), teamsById), [teamsById]);

  const [tierState, setTierState] = useState(() => initialTierState());
  const [search, setSearch] = useState("");
  const [conference, setConference] = useState("ALL");

  const [exportTextOpen, setExportTextOpen] = useState(false);
  const [exportPngOpen, setExportPngOpen] = useState(false);
  const [sickoMode, setSickoMode] = useState(false);

  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  // Pool is derived: all teams not assigned to any tier.
  const assignedSet = useMemo(() => {
    const s = new Set();
    for (const tid of TIER_ORDER) {
      for (const id of tierState[tid].teamIds) s.add(id);
    }
    return s;
  }, [tierState]);

  const rawPoolIds = useMemo(() => {
    const ids = allIds.filter((id) => !assignedSet.has(id));
    return sortIdsByName(ids, teamsById);
  }, [allIds, assignedSet, teamsById]);

  const allTeamsRanked = rawPoolIds.length === 0;

 const hasFavoriteAndHated =
    tierState.favorite.teamIds.length === 1 && tierState.always_lose.teamIds.length === 1;


  const completionOk = sickoMode
    ? hasFavoriteAndHated && allTeamsRanked
    : hasFavoriteAndHated;

  const poolIds = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rawPoolIds.filter((id) => {
      const t = teamsById[id];
      if (!t) return false;
      if (conference !== "ALL" && t.conference !== conference) return false;
      if (q && !t.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rawPoolIds, teamsById, search, conference]);

 

  const exportText = useMemo(() => buildExportText(teamsById, tierState), [teamsById, tierState]);

  function findContainerOf(teamId) {
    for (const tid of TIER_ORDER) {
      if (tierState[tid].teamIds.includes(teamId)) return tid;
    }
    // if not in tiers, it's in pool
    return POOL_ID;
  }

  function removeFromContainer(containerId, teamId, draft) {
    if (containerId === POOL_ID) return; // pool is derived
    draft[containerId].teamIds = draft[containerId].teamIds.filter((id) => id !== teamId);
  }

  function addToTier(containerId, teamId, index, draft) {
    const tier = TIERS[containerId];
    const ordered = draft[containerId].ordered && tier.toggleableOrdered;

    // Insert at index if meaningful; otherwise push then normalize
    const next = [...draft[containerId].teamIds].filter((id) => id !== teamId);
    const safeIndex = typeof index === "number" ? Math.max(0, Math.min(index, next.length)) : next.length;
    next.splice(safeIndex, 0, teamId);

    draft[containerId].teamIds = normalizeContainer(containerId, next, teamsById, ordered);
  }

  function normalizeAll(draft) {
    // Enforce alphabetical for pool (derived) and unordered tiers
    for (const tid of TIER_ORDER) {
      const tier = TIERS[tid];
      const ordered = draft[tid].ordered && tier.toggleableOrdered;
      draft[tid].teamIds = normalizeContainer(tid, draft[tid].teamIds, teamsById, ordered);
    }
  }

  function handleToggleOrdered(tierId, orderedChecked) {
    if (sickoMode) return; // SICKO MODE locks ordered on
    setTierState((prev) => {
      const next = structuredClone(prev);
      next[tierId].ordered = orderedChecked;
      // Requirement: toggle always re-alphabetizes
      next[tierId].teamIds = sortIdsByName(next[tierId].teamIds, teamsById);
      return next;
    });
  }

  function handleReset() {
    const ok = window.confirm("Reset all tiers and return every team to Unranked?");
    if (!ok) return;
    setTierState(initialTierState());
    setSearch("");
    setConference("ALL");
  }

  function onDragStart(event) {
    setActiveId(event.active.id);
  }

  function onDragCancel() {
    setActiveId(null);
  }

  function onDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeTeamId = active.id;
    const from = findContainerOf(activeTeamId);

    // Determine "to" container:
    // - If over is a tier/pool droppable, over.id is container id
    // - If over is a team item, place into that item's container
    const overId = over.id;
    const to = overId === POOL_ID || TIERS[overId] ? overId : findContainerOf(overId);

    // If dropped "over" a team item, compute target index inside the destination container
    const overIsItem = !(overId === POOL_ID || TIERS[overId]);
    let targetIndex = undefined;

    if (to !== POOL_ID && overIsItem) {
      const overIndex = tierState[to].teamIds.indexOf(overId);
      targetIndex = overIndex >= 0 ? overIndex : undefined;
    }

    // If same container and it's a tier:
    if (from === to && from !== POOL_ID) {
      const tier = TIERS[from];
      const isOrdered = tierState[from].ordered && tier.toggleableOrdered;
      if (!isOrdered) {
        // Unordered tier: ignore manual reordering; re-alphabetize
        setTierState((prev) => {
          const next = structuredClone(prev);
          next[from].teamIds = sortIdsByName(next[from].teamIds, teamsById);
          return next;
        });
        return;
      }

      // Ordered tier: allow reorder via arrayMove
      const oldIndex = tierState[from].teamIds.indexOf(activeTeamId);
      const newIndex = tierState[from].teamIds.indexOf(overIsItem ? overId : activeTeamId);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        setTierState((prev) => {
          const next = structuredClone(prev);
          next[from].teamIds = arrayMove(next[from].teamIds, oldIndex, newIndex);
          return next;
        });
      }
      return;
    }

    // Moving to pool: just remove from tiers (pool is derived)
    if (to === POOL_ID) {
      if (from === POOL_ID) return;
      setTierState((prev) => {
        const next = structuredClone(prev);
        next[from].teamIds = next[from].teamIds.filter((id) => id !== activeTeamId);
        normalizeAll(next);
        return next;
      });
      return;
    }

    // Moving into a tier (possibly from pool or another tier)
    setTierState((prev) => {
      const next = structuredClone(prev);

      const destTier = TIERS[to];
      const destIds = next[to].teamIds;
      const destHas = destIds.includes(activeTeamId);

      // Remove from source tier if needed
      if (from !== POOL_ID) {
        next[from].teamIds = next[from].teamIds.filter((id) => id !== activeTeamId);
      }

      // Single-capacity swap behavior
      if (destTier.capacity === 1) {
        const occupying = destIds.length === 1 ? destIds[0] : null;

        // Place active into destination
        next[to].teamIds = [activeTeamId];

        // Swap: displaced goes back to source container (tier or pool)
        if (occupying && occupying !== activeTeamId) {
          if (from === POOL_ID) {
            // goes to pool (derived) => remove from destination already done; nothing else
            // but we must ensure occupying is removed from dest (it is) and not in any tier (it won't be)
          } else {
            // goes to the source tier
            const srcTier = TIERS[from];
            const srcOrdered = next[from].ordered && srcTier.toggleableOrdered;
            next[from].teamIds = normalizeContainer(
              from,
              [...next[from].teamIds, occupying],
              teamsById,
              srcOrdered
            );
          }
        }

        // Normalize destination (not really needed)
        return next;
      }

      // Non-capacity tier: insert at target index if tier is ordered, else append then alphabetize
      const isOrderedDest = next[to].ordered && destTier.toggleableOrdered;

      // ensure removed if already present
      const cleanedDest = destHas ? destIds.filter((id) => id !== activeTeamId) : destIds;

      if (isOrderedDest && typeof targetIndex === "number") {
        const safeIndex = Math.max(0, Math.min(targetIndex, cleanedDest.length));
        cleanedDest.splice(safeIndex, 0, activeTeamId);
        next[to].teamIds = cleanedDest;
      } else {
        next[to].teamIds = normalizeContainer(to, [...cleanedDest, activeTeamId], teamsById, isOrderedDest);
      }

      // Enforce alphabetical on unordered tiers
      normalizeAll(next);
      return next;
    });
  }

  // Items list for DnD context needs to include all sortable ids in active view.
  // We include poolIds (filtered view) for drag handle; dragging works even if filtered.
  const allDndIds = useMemo(() => {
    const ids = new Set();
    for (const id of rawPoolIds) ids.add(id);
    for (const tid of TIER_ORDER) for (const id of tierState[tid].teamIds) ids.add(id);
    return [...ids];
  }, [rawPoolIds, tierState]);

  const activeTeam = activeId ? teamsById[activeId] : null;

  const exportDisabledReason = (() => {
  if (!hasFavoriteAndHated)
    return "To export, pick a Favorite and a Most Hated team.";
  if (sickoMode && !allTeamsRanked)
    return "SICKO MODE: You must place every team (pool must be empty) to export.";
  return "";
})();

function DisabledTooltipWrap({ disabled, title, children }) {
  return (
    <span title={disabled ? title : ""} style={{ display: "inline-block" }}>
      {children}
    </span>
  );
}

function enableSickoMode() {
  setTierState((prev) => {
    const next = structuredClone(prev);

    // Force ordered ON for every toggleable tier
    for (const tid of TIER_ORDER) {
      const tier = TIERS[tid];
      if (tier.toggleableOrdered) {
        next[tid].ordered = true;

        // Alphabetize immediately when switching modes (consistent with your rules)
        next[tid].teamIds = sortIdsByName(next[tid].teamIds, teamsById);
      }
    }

    return next;
  });

  setSickoMode(true);
}

function disableSickoMode() {
  // We do NOT automatically turn ordered back off — that would destroy user intent.
  // We simply remove the stricter export rule and banner.
  setSickoMode(false);
}

function toggleSickoMode() {
  if (sickoMode) disableSickoMode();
  else enableSickoMode();
}



  return (
    <div className="shell">
      <div className="header">
        <div className="hgroup">
          <h1>FBS Affection Ranking</h1>
          <p>Drag teams into tiers. Unordered tiers auto-sort alphabetically.</p>
          {sickoMode ? (
    <p style={{ marginTop: 6, color: "#7a1b1b", fontWeight: 800 }}>
      SICKO MODE ENABLED: You must rank and order every team
    </p>
  ) : null}  
        </div>

        <div className="actions">
          <button className="danger" onClick={handleReset}>Reset</button>

          <button
    className={sickoMode ? "primary" : ""}
    onClick={toggleSickoMode}
    title="Forces ordered tiers and requires ranking every team to export."
  >
    SICKO MODE
  </button>

           <DisabledTooltipWrap disabled={!completionOk} title={exportDisabledReason}>
    <button className="primary" onClick={() => setExportTextOpen(true)} disabled={!completionOk}>
      Export Text
    </button>
  </DisabledTooltipWrap>

  <DisabledTooltipWrap disabled={!completionOk} title={exportDisabledReason}>
    <button className="primary" onClick={() => setExportPngOpen(true)} disabled={!completionOk}>
      Export PNG
    </button>
  </DisabledTooltipWrap> 

        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragCancel={onDragCancel}
        onDragEnd={onDragEnd}
      >
        <Pool
          poolIds={poolIds}
          teamsById={teamsById}
          search={search}
          setSearch={setSearch}
          conference={conference}
          setConference={setConference}
          conferences={conferences}
        />

        <div className="tiers">
          {TIER_ORDER.map((tid) => {
            const tier = TIERS[tid];
            return (
<Tier
  key={tid}
  tier={tier}
  ids={tierState[tid].teamIds}
  ordered={tierState[tid].ordered}
  onToggleOrdered={handleToggleOrdered}
  teamsById={teamsById}   // ✅ pass through
  sickoMode={sickoMode}
/>

            );
          })}

          {!completionOk ? (
            <div className="panel" style={{ padding: 12 }}>
              <strong>To export:</strong>
              <div className="small" style={{ marginTop: 6 }}>
      {exportDisabledReason}
              </div>
            </div>
          ) : null}
        </div>

        <DragOverlay>
          {activeTeam ? (
            <div style={{ width: 340 }}>
              <TeamRow team={activeTeam} showRank={false} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <ExportTextModal open={exportTextOpen} onClose={() => setExportTextOpen(false)} text={exportText} />
      <ExportPngModal open={exportPngOpen} onClose={() => setExportPngOpen(false)} teamsById={teamsById} tierState={tierState} />
    </div>
  );
}

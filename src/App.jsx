import React, { useEffect, useMemo, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";

import teamsData from "../data/teams.json";
import { TIERS, TIER_ORDER, POOL_ID } from "./data/tiers.js";

import Pool from "./components/Pool.jsx";
import Tier from "./components/Tier.jsx";
import SickoList from "./components/SickoList.jsx";
import ExportTextModal from "./components/ExportTextModal.jsx";
import ExportPngModal from "./components/ExportPngModal.jsx";

import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";

const STORAGE_KEY = "fbs-affection-ranking:v1.3";

function buildTeamsById(list) {
  const map = {};
  for (const t of list) map[t.id] = t;
  return map;
}

function getConferences(list) {
  const set = new Set();
  for (const t of list) set.add(t.conference || "Independent");
  return ["ALL", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
}

function sortIdsByName(ids, teamsById) {
  return [...ids].sort((a, b) =>
    (teamsById[a]?.name || "").localeCompare(teamsById[b]?.name || "")
  );
}

function normalizeContainer(tierId, ids, teamsById, ordered) {
  const tier = TIERS[tierId];
  if (!tier) return ids;

  let next = [...ids];
  if (tier.capacity === 1) next = next.slice(0, 1);

  if (!ordered && tier.capacity !== 1) {
    next = sortIdsByName(next, teamsById);
  }
  return next;
}

function makeInitialTierState() {
  const state = {};
  for (const tid of TIER_ORDER) {
    const tier = TIERS[tid];
    state[tid] = { ordered: !!tier.defaultOrdered, teamIds: [] };
  }
  return state;
}

function buildSickoOrderFromTiers({ teamsById, tierState, poolIdsAlpha }) {
  // Derive tier order top->bottom. Ordered tiers keep order; unordered tiers alpha.
  const seq = [];

  const pushTier = (tid) => {
    const tier = TIERS[tid];
    const ids = tierState[tid]?.teamIds || [];
    if (!ids.length) return;

    if (tier.capacity === 1) {
      seq.push(ids[0]);
      return;
    }

    const ordered = tierState[tid]?.ordered && tier.toggleableOrdered;
    seq.push(...(ordered ? [...ids] : sortIdsByName(ids, teamsById)));
  };

function sickoSelect(id) {
  setSickoSelectedId((prev) => (prev === id ? null : id));
}

function sickoMoveSelected(where) {
  if (!sickoSelectedId) return;

  setSickoIds((prev) => {
    const n = prev.length;
    const from = prev.indexOf(sickoSelectedId);
    if (from === -1) return prev;

    let to = from;
    if (where === "top") to = 0;
    if (where === "up") to = Math.max(0, from - 1);
    if (where === "down") to = Math.min(n - 1, from + 1);
    if (where === "bottom") to = n - 1;
    if (where === "middle") to = Math.floor((n - 1) / 2);

    if (to === from) return prev;
    return arrayMove(prev, from, to);
  });
}

  // Top tiers first
  pushTier("favorite");
  pushTier("really_like");
  pushTier("positive");

  // Put pool teams into the "No Feelings segment" for derivation
  pushTier("neutral");
  seq.push(...poolIdsAlpha);

  // Bottom tiers
  pushTier("negative");
  pushTier("always_lose");

  // De-dupe while preserving order (safety)
  const seen = new Set();
  const out = [];
  for (const id of seq) {
    if (!id) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }

  // Ensure every team is included (safety)
  const allIds = Object.keys(teamsById);
  for (const id of allIds) {
    if (!seen.has(id)) out.push(id);
  }

  return out;
}

function buildExportTextNormal(teamsById, tierState) {
  const lines = [];

  for (const tid of TIER_ORDER) {
    const tier = TIERS[tid];
    const { ordered, teamIds } = tierState[tid];

    if (!teamIds || teamIds.length === 0) continue;

    lines.push(`${tier.name}:`);

    if (tier.capacity === 1) {
      lines.push(teamsById[teamIds[0]]?.name || "");
      lines.push("");
      continue;
    }

    if (tier.toggleableOrdered && ordered) {
      teamIds.forEach((id, idx) => {
        lines.push(`${idx + 1}. ${teamsById[id]?.name || ""}`);
      });
    } else {
      teamIds.forEach((id) => lines.push(`- ${teamsById[id]?.name || ""}`));
    }

    lines.push("");
  }

  return lines.join("\n").trim();
}

function buildExportTextSicko(teamsById, sickoIds) {
  const lines = [];
  lines.push("All Teams (Sicko Mode):");
  sickoIds.forEach((id, idx) => {
    lines.push(`${idx + 1}. ${teamsById[id]?.name || ""}`);
  });
  return lines.join("\n");
}

export default function App() {
  const teamsById = useMemo(() => buildTeamsById(teamsData), []);
  const conferences = useMemo(() => getConferences(teamsData), []);


const sensors = useSensors(
  useSensor(MouseSensor, {
    activationConstraint: { distance: 6 },
  }),
  useSensor(TouchSensor, {
    activationConstraint: { delay: 120, tolerance: 8 },
  })
);

  const [tierState, setTierState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return makeInitialTierState();
      const parsed = JSON.parse(raw);
      if (!parsed?.tierState) return makeInitialTierState();
      return parsed.tierState;
    } catch {
      return makeInitialTierState();
    }
  });

  const [search, setSearch] = useState("");
  const [conference, setConference] = useState("ALL");
  const [exportTextOpen, setExportTextOpen] = useState(false);
  const [exportPngOpen, setExportPngOpen] = useState(false);
const [sickoSelectedId, setSickoSelectedId] = useState(null);

  const [sickoMode, setSickoMode] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return !!parsed?.sickoMode;
    } catch {
      return false;
    }
  });

  const [sickoIds, setSickoIds] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed?.sickoIds) ? parsed.sickoIds : [];
    } catch {
      return [];
    }
  });

  // Mobile tap-to-move state (normal mode only)
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tierState, sickoMode, sickoIds }));
    } catch {
      // ignore
    }
  }, [tierState, sickoMode, sickoIds]);

  const allIds = useMemo(() => teamsData.map((t) => t.id), []);

  const assignedSet = useMemo(() => {
    const set = new Set();
    for (const tid of TIER_ORDER) {
      for (const id of tierState[tid]?.teamIds || []) set.add(id);
    }
    return set;
  }, [tierState]);

  const rawPoolIds = useMemo(() => {
    const ids = allIds.filter((id) => !assignedSet.has(id));
    return sortIdsByName(ids, teamsById);
  }, [allIds, assignedSet, teamsById]);

  const poolIds = useMemo(() => {
    let ids = rawPoolIds;

    if (conference !== "ALL") {
      ids = ids.filter((id) => (teamsById[id]?.conference || "Independent") === conference);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      ids = ids.filter((id) => (teamsById[id]?.name || "").toLowerCase().includes(q));
    }

    return sortIdsByName(ids, teamsById);
  }, [rawPoolIds, conference, search, teamsById]);

  // Normal export gating: pick Favorite and Most Hated
  const hasFavoriteAndHated =
    (tierState.favorite?.teamIds?.length || 0) === 1 &&
    (tierState.always_lose?.teamIds?.length || 0) === 1;

  // In Sicko mode, export is always allowed (all teams present by construction)
  const completionOk = sickoMode ? sickoIds.length === allIds.length : hasFavoriteAndHated;

  const exportDisabledReason = (() => {
    if (sickoMode) return "";
    if (!hasFavoriteAndHated) return "You need to pick a Favorite and a Most Hated team to export.";
    return "";
  })();

function sickoSelect(id) {
  setSickoSelectedId((prev) => (prev === id ? null : id));
}

function sickoMoveSelected(where) {
  if (!sickoSelectedId) return;

  setSickoIds((prev) => {
    const n = prev.length;
    const from = prev.indexOf(sickoSelectedId);
    if (from === -1) return prev;

    let to = from;
    if (where === "top") to = 0;
    if (where === "up") to = Math.max(0, from - 1);
    if (where === "down") to = Math.min(n - 1, from + 1);
    if (where === "bottom") to = n - 1;
    if (where === "middle") to = Math.floor((n - 1) / 2);

    if (to === from) return prev;
    return arrayMove(prev, from, to);
  });
}


  function DisabledTooltipWrap({ disabled, title, children }) {
    return (
      <span title={disabled ? title : ""} style={{ display: "inline-block" }}>
        {children}
      </span>
    );
  }

  function normalizeAll(next) {
    for (const tid of TIER_ORDER) {
      const tier = TIERS[tid];
      const isOrdered = next[tid].ordered && tier.toggleableOrdered;
      next[tid].teamIds = normalizeContainer(tid, next[tid].teamIds, teamsById, isOrdered);
    }
  }

  function findContainerOf(teamId) {
    for (const tid of TIER_ORDER) {
      if ((tierState[tid]?.teamIds || []).includes(teamId)) return tid;
    }
    return POOL_ID;
  }

  function handleReset() {
    if (!confirm("Reset all tiers?")) return;
    setSelectedTeamId(null);
    setSickoMode(false);
    setSickoIds([]);
    setTierState(makeInitialTierState());
  }

  function handleToggleOrdered(tierId, orderedChecked) {
    // Normal mode only (tiers are hidden in sicko mode)
    setTierState((prev) => {
      const next = structuredClone(prev);
      next[tierId].ordered = orderedChecked;
      next[tierId].teamIds = sortIdsByName(next[tierId].teamIds, teamsById);
      return next;
    });
  }

  function enterSickoMode() {
    // Derive sicko list from current tiers + pool (alpha)
    const derived = buildSickoOrderFromTiers({
      teamsById,
      tierState,
      poolIdsAlpha: rawPoolIds,
    });
    setSelectedTeamId(null);
    setSickoIds(derived);
    setSickoMode(true);
    setSickoSelectedId(null);

  }

  function exitSickoMode() {
    const ok = confirm("Exit Sicko Mode? This will reset your Sicko ranking.");
    setSickoSelectedId(null);
    if (!ok) return;

    // Put everyone into No Feelings (neutral), unordered alpha by normalize
    setTierState((prev) => {
      const next = makeInitialTierState();
      // keep your default ordered flags (neutral default is false in your tiers.js)
      next.neutral.teamIds = sortIdsByName(allIds, teamsById);
      normalizeAll(next);
      return next;
    });

    setSickoIds([]);
    setSickoMode(false);
  }

  function toggleSickoMode() {
    if (sickoMode) exitSickoMode();
    else enterSickoMode();
  }

  // Drag handlers: in Sicko Mode, drag reorders sicko list only.
  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (sickoMode) {
      const oldIndex = sickoIds.indexOf(activeId);
      const newIndex = sickoIds.indexOf(overId);
      if (oldIndex === -1 || newIndex === -1) return;
      setSickoIds((prev) => arrayMove(prev, oldIndex, newIndex));
      return;
    }

    // Normal mode drag behavior (tiers + pool)
    const from = findContainerOf(activeId);

    const isTierContainer = TIER_ORDER.includes(overId);
const to =
  overId === POOL_ID ? POOL_ID :
  isTierContainer ? overId :
  findContainerOf(overId);

    if (!to) return;
    if (from === to && activeId === overId) return;

    if (to === POOL_ID) {
      if (from === POOL_ID) return;
      setTierState((prev) => {
        const next = structuredClone(prev);
        next[from].teamIds = next[from].teamIds.filter((x) => x !== activeId);
        normalizeAll(next);
        return next;
      });
      return;
    }

    if (from === to && from !== POOL_ID) {
      setTierState((prev) => {
        const next = structuredClone(prev);
        const tier = TIERS[to];
        const isOrdered = next[to].ordered && tier.toggleableOrdered;

        if (!isOrdered) {
          next[to].teamIds = sortIdsByName(next[to].teamIds, teamsById);
          return next;
        }

        const oldIndex = next[to].teamIds.indexOf(activeId);
        const newIndex = next[to].teamIds.indexOf(overId);
        if (oldIndex === -1 || newIndex === -1) return prev;

        next[to].teamIds = arrayMove(next[to].teamIds, oldIndex, newIndex);
        return next;
      });
      return;
    }

    setTierState((prev) => {
      const next = structuredClone(prev);

      if (from !== POOL_ID) {
        next[from].teamIds = next[from].teamIds.filter((x) => x !== activeId);
      }

      const destTier = TIERS[to];
      const destIds = next[to].teamIds;

      if (destTier.capacity === 1) {
        const occupying = destIds.length === 1 ? destIds[0] : null;
        next[to].teamIds = [activeId];

        if (occupying && occupying !== activeId && from !== POOL_ID) {
          const srcTier = TIERS[from];
          const srcOrdered = next[from].ordered && srcTier.toggleableOrdered;
          next[from].teamIds = normalizeContainer(
            from,
            [...next[from].teamIds, occupying],
            teamsById,
            srcOrdered
          );
        }

        normalizeAll(next);
        return next;
      }

      const isOrderedDest = next[to].ordered && destTier.toggleableOrdered;
      next[to].teamIds = normalizeContainer(
        to,
        [...destIds.filter((x) => x !== activeId), activeId],
        teamsById,
        isOrderedDest
      );

      normalizeAll(next);
      return next;
    });
  }

  // Tap-to-move (normal mode only), with swap-like behavior when tapping occupied team
  function onTeamTap(tappedId) {
    if (sickoMode) return;

    if (!selectedTeamId) {
      setSelectedTeamId(tappedId);
      return;
    }

    if (selectedTeamId === tappedId) {
      setSelectedTeamId(null);
      return;
    }

    const destContainer = findContainerOf(tappedId);
    moveSelectedTo(destContainer, tappedId);
  }

  function moveSelectedTo(containerId, overTeamId = null) {
    if (sickoMode) return;
    if (!selectedTeamId) return;

    const teamId = selectedTeamId;
    const from = findContainerOf(teamId);

    if (from === containerId) {
      setSelectedTeamId(null);
      return;
    }

    if (containerId === POOL_ID) {
      if (from !== POOL_ID) {
        setTierState((prev) => {
          const next = structuredClone(prev);
          next[from].teamIds = next[from].teamIds.filter((x) => x !== teamId);
          normalizeAll(next);
          return next;
        });
      }
      setSelectedTeamId(null);
      return;
    }

    setTierState((prev) => {
      const next = structuredClone(prev);

      if (from !== POOL_ID) {
        next[from].teamIds = next[from].teamIds.filter((x) => x !== teamId);
      }

      const destTier = TIERS[containerId];
      const destIds = next[containerId].teamIds;

      if (destTier.capacity === 1) {
        const occupying = destIds.length === 1 ? destIds[0] : null;
        next[containerId].teamIds = [teamId];

        if (occupying && occupying !== teamId) {
          if (from !== POOL_ID) {
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

        normalizeAll(next);
        return next;
      }

      const isOrderedDest = next[containerId].ordered && destTier.toggleableOrdered;
      let base = destIds.filter((x) => x !== teamId);

      if (isOrderedDest && overTeamId && base.includes(overTeamId)) {
        const idx = base.indexOf(overTeamId);
        base.splice(idx, 0, teamId);
        next[containerId].teamIds = base;
      } else {
        next[containerId].teamIds = normalizeContainer(
          containerId,
          [...base, teamId],
          teamsById,
          isOrderedDest
        );
      }

      normalizeAll(next);
      return next;
    });

    setSelectedTeamId(null);
  }

  const exportText = useMemo(() => {
    return sickoMode ? buildExportTextSicko(teamsById, sickoIds) : buildExportTextNormal(teamsById, tierState);
  }, [teamsById, tierState, sickoMode, sickoIds]);

useEffect(() => {
  if (!sickoMode) return;

  function isTypingTarget(el) {
    if (!el) return false;
    const tag = el.tagName?.toLowerCase();
    return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
  }

  function ensureSelection() {
    // If nothing is selected, select the first team to enable keyboard control
    if (!sickoSelectedId && sickoIds.length > 0) {
      setSickoSelectedId(sickoIds[0]);
      return sickoIds[0];
    }
    return sickoSelectedId;
  }

  function onKeyDown(e) {
    if (isTypingTarget(e.target)) return;

    const key = e.key;

    // Always allow Esc to clear selection
    if (key === "Escape") {
      if (sickoSelectedId) {
        e.preventDefault();
        setSickoSelectedId(null);
      }
      return;
    }

    // Only handle shortcuts in Sicko Mode
    // Normalize letter keys (case-insensitive)
    const k = typeof key === "string" ? key.toLowerCase() : key;

    const moveKeys = new Set(["arrowup", "arrowdown", "j", "k", "t", "b", "m"]);
    if (!moveKeys.has(k)) return;

    // Ensure we have a selection
    const sel = ensureSelection();
    if (!sel) return;

    // Prevent page scroll on arrow keys
    if (k === "arrowup" || k === "arrowdown") e.preventDefault();

    if (k === "arrowup" || k === "k") sickoMoveSelected("up");
    else if (k === "arrowdown" || k === "j") sickoMoveSelected("down");
    else if (k === "t") sickoMoveSelected("top");
    else if (k === "b") sickoMoveSelected("bottom");
    else if (k === "m") sickoMoveSelected("middle");
  }

  window.addEventListener("keydown", onKeyDown, { passive: false });
  return () => window.removeEventListener("keydown", onKeyDown);
}, [sickoMode, sickoIds, sickoSelectedId, sickoMoveSelected]);


  return (
    <div className="page">
      <header className="topbar">
        <div className="hgroup">
          <h1>FBS Affection Ranking</h1>
          {!sickoMode ? (
            <p>Drag teams into tiers. Unordered tiers (and pool) auto-sort alphabetically.</p>
          ) : (
            <p style={{ marginTop: 6, color: "#7a1b1b", fontWeight: 800 }}>
              SICKO MODE: Rank every team from most favorite to least favorite
            </p>
          )}
        </div>

        <div className="actions">
          <button className="danger" onClick={handleReset}>
            Reset
          </button>

          <button className={sickoMode ? "primary" : ""} onClick={toggleSickoMode} title="Enter or exit Sicko Mode.">
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
      </header>

      {!completionOk ? (
        <div className="panel" style={{ padding: 12, marginTop: 12 }}>
          <strong>To export:</strong>
          <div className="small" style={{ marginTop: 6 }}>
            {exportDisabledReason}
          </div>
        </div>
      ) : null}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        {!sickoMode ? (
          <div className="layout">
            <Pool
              poolIds={poolIds}
              teamsById={teamsById}
              search={search}
              setSearch={setSearch}
              conference={conference}
              setConference={setConference}
              conferences={conferences}
              onContainerTap={moveSelectedTo}
              onTeamTap={onTeamTap}
              selectedTeamId={selectedTeamId}
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
                    teamsById={teamsById}
                    sickoMode={false}
                    onContainerTap={moveSelectedTo}
                    onTeamTap={onTeamTap}
                    selectedTeamId={selectedTeamId}
                  />
                );
              })}
            </div>
          </div>
        ) : (
<div className="layout">
  <div className="panel sickoPanelWide" style={{ padding: 12, marginTop: 12 }}>
    <SickoList
      ids={sickoIds}
      teamsById={teamsById}
      selectedId={sickoSelectedId}
      onSelect={sickoSelect}
      onMove={sickoMoveSelected}
    />
  </div>
</div>

        )}
      </DndContext>

      <ExportTextModal open={exportTextOpen} onClose={() => setExportTextOpen(false)} exportText={exportText} />

      <ExportPngModal
        open={exportPngOpen}
        onClose={() => setExportPngOpen(false)}
        teamsById={teamsById}
        tierState={tierState}
        sickoMode={sickoMode}
        sickoIds={sickoIds}
      />
    </div>
  );
}

export function sortIdsByName(ids, teamsById) {
  return [...ids].sort((a, b) => {
    const an = (teamsById[a]?.name || "").toLowerCase();
    const bn = (teamsById[b]?.name || "").toLowerCase();
    return an.localeCompare(bn);
  });
}

export function normalizeContainer(containerId, ids, teamsById, isOrderedTier) {
  // Pool is always alphabetical. Unordered tiers are always alphabetical.
  if (containerId === "pool") return sortIdsByName(ids, teamsById);
  if (!isOrderedTier) return sortIdsByName(ids, teamsById);
  return ids; // ordered tier: preserve manual order
}

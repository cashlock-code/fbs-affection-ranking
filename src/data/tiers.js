export const TIER_ORDER = [
  "favorite",
  "really_like",
  "positive",
  "neutral",
  "negative",
  "always_lose",
];

export const TIERS = {
  favorite: {
    id: "favorite",
    name: "Favorite",
    capacity: 1,
    toggleableOrdered: false,
    defaultOrdered: true,
  },
  really_like: {
    id: "really_like",
    name: "Cheer For",
    capacity: Infinity,
    toggleableOrdered: true,
    defaultOrdered: false,
  },
  positive: {
    id: "positive",
    name: "Enjoy When They Win",
    capacity: Infinity,
    toggleableOrdered: true,
    defaultOrdered: false,
  },
  neutral: {
    id: "neutral",
    name: "No Feelings",
    capacity: Infinity,
    toggleableOrdered: true,
    defaultOrdered: false,
  },
  negative: {
    id: "negative",
    name: "Enjoy When They Lose",
    capacity: Infinity,
    toggleableOrdered: true,
    defaultOrdered: false,
  },
  always_lose: {
    id: "always_lose",
    name: "Most Hated",
    capacity: 1,
    toggleableOrdered: false,
    defaultOrdered: true,
  },
};

export const POOL_ID = "pool";

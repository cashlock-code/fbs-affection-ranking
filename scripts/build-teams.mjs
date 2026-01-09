import fs from "fs";
import fetch from "node-fetch";

// CFBD endpoint (FBS teams)
const URL = "https://api.collegefootballdata.com/teams/fbs";

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const res = await fetch(URL, {
  headers: {
    Authorization: `Bearer ${process.env.CFBD_API_KEY}`,
  },
});


if (!res.ok) {
  throw new Error(`Failed to fetch teams: ${res.status} ${res.statusText}`);
}

const data = await res.json();

/*
CFBD teams typically include:
- school
- conference
- logos: [ ... ]
*/
const teams = data.map((t) => ({
  id: slugify(t.school),
  name: t.school,
  conference: t.conference || "Independent",
  logoUrl: Array.isArray(t.logos) && t.logos.length ? t.logos[0] : "",
}));

// Sort by name for deterministic diffs
teams.sort((a, b) => a.name.localeCompare(b.name));

fs.mkdirSync("data", { recursive: true });
fs.writeFileSync("data/teams.json", JSON.stringify(teams, null, 2));
console.log(`Wrote ${teams.length} teams to data/teams.json`);

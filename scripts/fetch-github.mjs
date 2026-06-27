// Build-time snapshot of the GitHub contribution record.
// Runs before `vite build` (and on demand) — scrapes the public contributions
// HTML (no token, no API rate limit) and the REST profile, then writes a static
// JSON the site ships with. The browser may refresh the headline numbers live
// from REST, but always has this as the floor so the page is never empty.

import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const USER = process.argv[2] || "Dek0rta";
const OUT = fileURLToPath(new URL("../src/github.json", import.meta.url));
const UA = { "User-Agent": "Mozilla/5.0 (portfolio-build)" };

async function fetchContributions(user) {
  const res = await fetch(`https://github.com/users/${user}/contributions`, {
    headers: UA,
  });
  if (!res.ok) throw new Error(`contributions ${res.status}`);
  const html = await res.text();

  // total — "<n> contributions in the last year"
  const totalMatch = html.match(/([\d,]+)\s+contribution/);
  const total = totalMatch ? Number(totalMatch[1].replace(/,/g, "")) : 0;

  // each day cell: data-date + data-level (0–4)
  const days = [];
  const cellRe = /data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d)"/g;
  let m;
  while ((m = cellRe.exec(html)) !== null) {
    days.push({ date: m[1], level: Number(m[2]) });
  }
  days.sort((a, b) => (a.date < b.date ? -1 : 1));

  // longest run of consecutive active days (level > 0)
  let longest = 0;
  let run = 0;
  // current streak — trailing active days up to the most recent
  let current = 0;
  for (const d of days) {
    if (d.level > 0) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].level > 0) current += 1;
    else break;
  }

  return { total, days, longestStreak: longest, currentStreak: current };
}

async function fetchProfile(user) {
  const res = await fetch(`https://api.github.com/users/${user}`, { headers: UA });
  if (!res.ok) throw new Error(`profile ${res.status}`);
  const d = await res.json();
  return {
    publicRepos: d.public_repos ?? 0,
    followers: d.followers ?? 0,
    createdAt: d.created_at ?? null,
  };
}

async function main() {
  const [contrib, profile] = await Promise.all([
    fetchContributions(USER),
    fetchProfile(USER),
  ]);

  const snapshot = {
    user: USER,
    fetchedAt: new Date().toISOString(),
    total: contrib.total,
    longestStreak: contrib.longestStreak,
    currentStreak: contrib.currentStreak,
    publicRepos: profile.publicRepos,
    followers: profile.followers,
    createdAt: profile.createdAt,
    // store level only — that's all the ink field needs (0–4 per day)
    days: contrib.days,
  };

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(snapshot, null, 0) + "\n");
  console.log(
    `wrote ${OUT}: ${snapshot.days.length} days · ${snapshot.total} contributions · ` +
      `streak ${snapshot.currentStreak}/${snapshot.longestStreak} · ${snapshot.publicRepos} repos`,
  );
}

main().catch((e) => {
  console.error("fetch-github failed:", e.message);
  process.exit(1);
});

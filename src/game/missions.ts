import type { Mission } from "./types";

let missionSeq = 0;

export function generateMissions(_level: number): Mission[] {
  missionSeq += 1;
  const base = Date.now() + missionSeq * 1000;
  return [
    {
      id: `m-kill-${base}`,
      title: "Neutralize Hostiles",
      desc: "Eliminate enemies to thin the battlefield.",
      progress: 0,
      target: Math.max(4, Math.round(6 + Math.floor(Math.random() * 4))),
      reward: 150,
      complete: false,
      claimed: false,
      key: "kill",
    },
    {
      id: `m-loot-${base}`,
      title: "Loot the Drop Zone",
      desc: "Collect gear, ammo and medical supplies scattered around.",
      progress: 0,
      target: 8,
      reward: 200,
      complete: false,
      claimed: false,
      key: "loot",
    },
    {
      id: `m-coin-${base}`,
      title: "Bank the Coins",
      desc: "Grab golden coins from fallen enemies and supply drops.",
      progress: 0,
      target: 15,
      reward: 250,
      complete: false,
      claimed: false,
      key: "coin",
    },
    {
      id: `m-survive-${base}`,
      title: "Survive the Zone",
      desc: "Stay inside the safe zone as it shrinks.",
      progress: 0,
      target: 1,
      reward: 300,
      complete: false,
      claimed: false,
      key: "survive",
    },
  ];
}

// Rotating mission pool for variety
const MISSION_POOL: Array<{ title: string; desc: string; key: "kill" | "loot" | "coin" | "survive"; target: number }> = [
  { title: "Gun Slinging", desc: "Put down enemies with your weapon of choice.", key: "kill", target: 6 },
  { title: "Scavenger", desc: "Gather supplies across the battlefield.", key: "loot", target: 8 },
  { title: "Coin Tycoon", desc: "Hoover up coins from the battlefield.", key: "coin", target: 12 },
  { title: "Zone Sentry", desc: "Stay within the shrinking safe zone.", key: "survive", target: 1 },
];

export function pickMissionPool(level: number): Mission[] {
  return MISSION_POOL.map((m, i) => ({
    id: `pool-${level}-${i}-${missionSeq++}`,
    title: m.title,
    desc: m.desc,
    progress: 0,
    target: Math.round(m.target * (1 + (level - 1) * 0.2)),
    reward: 100 + level * 25,
    complete: false,
    claimed: false,
    key: m.key,
  }));
}

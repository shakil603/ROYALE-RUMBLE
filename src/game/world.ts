import type { Vec2 } from "./types";

export interface Cover {
  x: number;
  y: number;
  w: number;
  h: number;
  type: "crate" | "wall" | "turret" | "bush" | "rock" | "tank";
  color: string;
  solid: boolean;
}

export interface Prop {
  x: number;
  y: number;
  type: string;
  size: number;
  color: string;
  rotation: number;
}

export const WORLD_SIZE = 3000;

export interface World {
  size: number;
  covers: Cover[];
  props: Prop[];
  spawnPoints: Vec2[];
}

// Deterministic-ish seeded random for layout.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateWorld(): World {
  const rand = rng(Date.now() % 99999 || 7);
  const size = WORLD_SIZE;
  const covers: Cover[] = [];
  const props: Prop[] = [];

  // Central town — cluster of crates & walls in the middle
  const townBlock = 420;
  for (let i = 0; i < 22; i++) {
    covers.push({
      x: size / 2 - townBlock / 2 + rand() * townBlock,
      y: size / 2 - townBlock / 2 + rand() * townBlock,
      w: 40 + rand() * 60,
      h: 40 + rand() * 60,
      type: "crate",
      color: pick(["#8a5a2b", "#6b4423", "#9b6a35", "#7a4f28"]),
      solid: true,
    });
  }

  // Scattered cover across the map
  for (let i = 0; i < 70; i++) {
    let x = 80 + rand() * (size - 160);
    let y = 80 + rand() * (size - 160);
    // avoid overlapping central town too much
    covers.push({
      x,
      y,
      w: 30 + rand() * 50,
      h: 30 + rand() * 50,
      type: pick(["crate", "wall", "rock", "bush", "turret", "tank"]),
      color: coverColor(),
      solid: true,
    });
  }

  // Decorational props (trees, grass tufts, rocks)
  for (let i = 0; i < 160; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const t = rand();
    props.push({
      x,
      y,
      type: t < 0.5 ? "tree" : t < 0.75 ? "rock" : t < 0.9 ? "grass" : "deadTank",
      size: 24 + rand() * 30,
      color:
        t < 0.5
          ? pick(["#2f6b2f", "#3c7d3c", "#2a5c2a"])
          : t < 0.75
            ? pick(["#6b6b6b", "#7d7d7d"])
            : "#3c8a3c",
      rotation: rand() * Math.PI,
    });
  }

  // Loot spawn positions spread around
  const spawnPoints: Vec2[] = [];
  for (let i = 0; i < 40; i++) {
    spawnPoints.push({
      x: 120 + rand() * (size - 240),
      y: 120 + rand() * (size - 240),
    });
  }

  return { size, covers, props, spawnPoints };
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// coverColor gives a random material color
function coverColor(): string {
  return pick(["#8a5a2b", "#556080", "#6f7f4f", "#8f4f4f", "#7a7f8a", "#5a6b7f"]);
}

export function rectsOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number
) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

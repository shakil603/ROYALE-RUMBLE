import type { WeaponType } from "./types";

export interface WeaponDef {
  type: WeaponType;
  name: string;
  damage: number;
  fireRate: number; // shots per second
  spread: number; // radians
  bullets: number; // pellets per shot
  speed: number; // bullet speed
  magSize: number;
  reloadTime: number;
  range: number;
  auto: boolean;
  color: string;
  shake: number;
  desc: string;
}

export const WEAPONS: Record<WeaponType, WeaponDef> = {
  pistol: {
    type: "pistol",
    name: "Blazer-9",
    damage: 14,
    fireRate: 3.2,
    spread: 0.05,
    bullets: 1,
    speed: 850,
    magSize: 12,
    reloadTime: 1.0,
    range: 520,
    auto: false,
    color: "#9aa6b8",
    shake: 3,
    desc: "Reliable sidearm. Infinite reserve.",
  },
  rifle: {
    type: "rifle",
    name: "Viper AR",
    damage: 16,
    fireRate: 7.5,
    spread: 0.028,
    bullets: 1,
    speed: 1050,
    magSize: 30,
    reloadTime: 1.4,
    range: 680,
    auto: true,
    color: "#4ade80",
    shake: 4,
    desc: "Assault rifle. Balanced firepower.",
  },
  smg: {
    type: "smg",
    name: "Cobra SMG",
    damage: 11,
    fireRate: 12,
    spread: 0.045,
    bullets: 1,
    speed: 920,
    magSize: 40,
    reloadTime: 1.3,
    range: 460,
    auto: true,
    color: "#38bdf8",
    shake: 3,
    desc: "Rapid fire submachine gun.",
  },
  shotgun: {
    type: "shotgun",
    name: "Titan M870",
    damage: 11,
    fireRate: 1.6,
    spread: 0.14,
    bullets: 7,
    speed: 820,
    magSize: 6,
    reloadTime: 2.0,
    range: 260,
    auto: false,
    color: "#fb923c",
    shake: 6,
    desc: "Devastating up close. Shoots pellets.",
  },
  sniper: {
    type: "sniper",
    name: "Raptor .50",
    damage: 70,
    fireRate: 1.2,
    spread: 0.004,
    bullets: 1,
    speed: 1600,
    magSize: 5,
    reloadTime: 2.0,
    range: 1300,
    auto: false,
    color: "#c084fc",
    shake: 7,
    desc: "One-shot powerhouse from range.",
  },
};

export const WEAPON_ORDER: WeaponType[] = ["pistol", "rifle", "smg", "shotgun", "sniper"];

// Game balancing
export const BOSS_HP = 900;
export const WAVE_ENEMY_COUNT = [5, 8, 12, 16, 20, 24];

export function enemyTierByWave(wave: number): number {
  return Math.min(4, Math.floor((wave - 1) / 2));
}

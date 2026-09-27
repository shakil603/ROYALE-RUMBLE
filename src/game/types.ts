export interface Vec2 {
  x: number;
  y: number;
}

export type GamePhase = "menu" | "playing" | "paused" | "gameover";

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number; // facing angle in radians
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  speed: number;
  radius: number;
  weapon: WeaponType;
  ammo: number;
  kills: number;
  dashCooldown: number;
  dashTimer: number;
  hurting: number; // hit flash timer
  bobbing: number; // walk bob phase
  moving: boolean;
  alive: boolean;
  fireCooldown: number;
  lastShot: number;
  invuln: number;
  score: number;
  xp: number;
  level: number;
  starTimer: number;
}

export interface Enemy {
  x: number;
  y: number;
  angle: number;
  hp: number;
  maxHp: number;
  speed: number;
  radius: number;
  type: EnemyType;
  fireCooldown: number;
  hurting: number;
  alive: boolean;
  bobPhase: number;
  moving: boolean;
  hitScore: number;
  color: string;
  range: number;
  chaseRange: number;
  burstTimer: number;
  burstCount: number;
  attackCd: number;
  flash: number;
}

export type EnemyType = "grunt" | "runner" | "heavy" | "sniper" | "boss";

export type WeaponType = "pistol" | "rifle" | "smg" | "shotgun" | "sniper";

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  friendly: boolean;
  life: number;
  trailX: number;
  trailY: number;
  color: string;
  pierce: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
  drag: number;
  glow: boolean;
}

export interface Pickup {
  x: number;
  y: number;
  type: PickupType;
  value: number;
  xp: number;
  bobPhase: number;
  pulse: number;
  name: string;
  color: string;
}

export type PickupType =
  | "health"
  | "shield"
  | "ammo"
  | "weapon_rifle"
  | "weapon_smg"
  | "weapon_shotgun"
  | "weapon_sniper"
  | "coin"
  | "dashcharge";

export interface ZoneRing {
  cx: number;
  cy: number;
  radius: number;
  targetRadius: number;
  cxTarget: number;
  cyTarget: number;
  shrinking: boolean;
  damage: number;
  warn: number;
  phase: number;
}

export interface Mission {
  id: string;
  title: string;
  desc: string;
  progress: number;
  target: number;
  reward: number;
  complete: boolean;
  claimed: boolean;
  key?: "kill" | "loot" | "coin" | "survive";
  _rewarded?: boolean;
}

export interface FloatingText {
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  text: string;
  color: string;
  size: number;
}

export interface HighScore {
  name: string;
  score: number;
  kills: number;
  wave: number;
  date: number;
}

export interface GameStats {
  kills: number;
  coins: number;
  timeSurvived: number;
  level: number;
}

import { audio } from "./audio";
import { generateMissions } from "./missions";
import { drawBossHealth, drawBullet, drawCover, drawPickup, drawProp } from "./render";
import type {
  Bullet,
  Enemy,
  EnemyType,
  FloatingText,
  GameStats,
  Mission,
  Particle,
  Pickup,
  Player,
  WeaponType,
} from "./types";
import { BOSS_HP, WEAPONS } from "./weapons";
import { generateWorld, type World } from "./world";

export interface EngineCallbacks {
  onPhaseChange: () => void;
  onStats: (stats: GameStats) => void;
}

const WORLD = { size: 3000 };

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  dpr = 1;
  w = 0;
  h = 0;

  world: World = generateWorld();
  player!: Player;
  enemies: Enemy[] = [];
  bullets: Bullet[] = [];
  particles: Particle[] = [];
  pickups: Pickup[] = [];
  texts: FloatingText[] = [];

  // camera
  camX = 0;
  camY = 0;
  shake = 0;
  shakeX = 0;
  shakeY = 0;

  // input
  keys: Record<string, boolean> = {};
  mouseDown = false;
  targetX = 0;
  targetY = 0;
  touchAim = false;

  // game flow
  phase: "menu" | "playing" | "paused" | "gameover" = "menu";
  wave = 0;
  waveTimer = 0;
  score = 0;
  coins = 0;
  timeSurvived = 0;
  surviveCredit = 0;
  zoneCenter = { x: WORLD.size / 2, y: WORLD.size / 2 };
  zoneRadius = WORLD.size * 0.75;
  zoneTargetRadius = WORLD.size * 0.75;
  zoneCxTarget = WORLD.size / 2;
  zoneCyTarget = WORLD.size / 2;
  zoneShrink = 0;
  zoneDangerTick = 0;
  missions: Mission[] = [];
  killsTotal = 0;
  level = 1;
  xp = 0;
  xpNext = 100;
  spawnBatch = 0;
  bossSpawned = false;
  dashHint = 0;
  starTimer = 0;

  // callbacks
  cb: EngineCallbacks;
  raf = 0;
  lastT = 0;
  running = false;
  time = 0;

  constructor(canvas: HTMLCanvasElement, cb: EngineCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.cb = cb;
    this.reset();
    this.resize();
    this.bindEvents();
    this.running = true;
    this.lastT = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  // ---------- setup ----------
  reset() {
    const p: Player = {
      x: WORLD.size / 2,
      y: WORLD.size / 2,
      vx: 0,
      vy: 0,
      angle: 0,
      hp: 100,
      maxHp: 100,
      shield: 0,
      maxShield: 0,
      speed: 265,
      radius: 17,
      weapon: "pistol",
      ammo: WEAPONS.pistol.magSize,
      kills: 0,
      dashCooldown: 0,
      dashTimer: 0,
      hurting: 0,
      bobbing: 0,
      moving: false,
      alive: true,
      fireCooldown: 0,
      lastShot: 0,
      invuln: 0,
      score: 0,
      xp: 0,
      level: 1,
      starTimer: 0,
    };
    this.player = p;
    this.enemies = [];
    this.bullets = [];
    this.particles = [];
    this.pickups = [];
    this.texts = [];
    this.wave = 0;
    this.score = 0;
    this.coins = 0;
    this.timeSurvived = 0;
    this.surviveCredit = 0;
    this.killsTotal = 0;
    this.level = 1;
    this.xp = 0;
    this.xpNext = 100;
    this.zoneCenter = { x: WORLD.size / 2, y: WORLD.size / 2 };
    this.zoneRadius = WORLD.size * 0.75;
    this.zoneTargetRadius = WORLD.size * 0.75;
    this.zoneCxTarget = WORLD.size / 2;
    this.zoneCyTarget = WORLD.size / 2;
    this.zoneShrink = 0;
    this.bossSpawned = false;
    this.missions = generateMissions(1);
    this.camX = WORLD.size / 2;
    this.camY = WORLD.size / 2;
    this.world = generateWorld();
    this.spawnStartLoot();

    // initial cinematic spawn particles
    for (let i = 0; i < 40; i++) {
      this.spawnParticle(WORLD.size / 2, WORLD.size / 2, "#22d3ee", 2, 600, true);
    }
  }

  spawnStartLoot() {
    for (let i = 0; i < 14; i++) {
      const wp = this.world.spawnPoints[Math.floor(Math.random() * this.world.spawnPoints.length)];
      this.spawnPickup(wp.x + rand(-80, 80), wp.y + rand(-80, 80), pickLootType(), () => {});
    }
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = this.w * this.dpr;
    this.canvas.height = this.h * this.dpr;
    this.canvas.style.width = this.w + "px";
    this.canvas.style.height = this.h + "px";
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  // ---------- input ----------
  bindEvents() {
    window.addEventListener("keydown", (e) => this.keydown(e));
    window.addEventListener("keyup", (e) => this.keys[e.key.toLowerCase()] = false);
    window.addEventListener("resize", () => this.resize());

    this.canvas.addEventListener("mousedown", () => {
      this.mouseDown = true;
      audio.resume();
    });
    window.addEventListener("mouseup", () => (this.mouseDown = false));
    this.canvas.addEventListener("mousemove", (e) => {
      const r = this.canvas.getBoundingClientRect();
      this.targetX = e.clientX - r.left;
      this.targetY = e.clientY - r.top;
    });
    // touch
    this.canvas.addEventListener("touchstart", (e) => {
      audio.resume();
      for (const t of Array.from(e.changedTouches)) {
        this.touchAim = true;
        const r = this.canvas.getBoundingClientRect();
        this.targetX = t.clientX - r.left;
        this.targetY = t.clientY - r.top;
      }
      e.preventDefault();
    }, { passive: false });
    this.canvas.addEventListener("touchmove", (e) => {
      for (const t of Array.from(e.changedTouches)) {
        const r = this.canvas.getBoundingClientRect();
        this.targetX = t.clientX - r.left;
        this.targetY = t.clientY - r.top;
      }
      this.mouseDown = true;
      e.preventDefault();
    }, { passive: false });
    this.canvas.addEventListener("touchend", () => (this.mouseDown = false));
  }

  keydown(e: KeyboardEvent) {
    const k = e.key.toLowerCase();
    this.keys[k] = true;
    if (k === "p" || k === "escape") {
      if (this.phase === "playing") this.pause();
      else if (this.phase === "paused") this.resume();
    }
    if ((k === " " || k === "shift") && this.phase === "playing") this.tryDash();
    if (k === "r" && this.phase === "playing") this.reload();
    if (e.code === "KeyQ") this.cycleWeaponNext();
    e.preventDefault();
  }

  // ---------- public controls ----------
  start() {
    this.reset();
    this.phase = "playing";
    audio.resume();
    audio.victory();
    this.addText(WORLD.size / 2, WORLD.size / 2 - 40, "SURVIVE THE ZONE", "#facc15", 30);
    this.cb.onPhaseChange();
  }

  pause() {
    if (this.phase !== "playing") return;
    this.phase = "paused";
    this.cb.onPhaseChange();
  }

  resume() {
    if (this.phase !== "paused") return;
    this.phase = "playing";
    this.lastT = performance.now();
    this.cb.onPhaseChange();
  }

  togglePause() {
    if (this.phase === "playing") this.pause();
    else if (this.phase === "paused") this.resume();
  }

  setMuted(m: boolean) {
    audio.setMuted(m);
  }

  setWeaponExplicit(w: WeaponType) {
    this.player.weapon = w;
    this.player.ammo = WEAPONS[w].magSize;
    audio.pickup();
    this.addText(this.player.x, this.player.y - 34, WEAPONS[w].name + "!", "#facc15", 16);
  }

  cycleWeaponNext() {
    const order: WeaponType[] = ["pistol", "rifle", "smg", "shotgun", "sniper"];
    const i = order.indexOf(this.player.weapon);
    this.player.weapon = order[(i + 1) % order.length];
    this.player.ammo = WEAPONS[this.player.weapon].magSize;
    audio.pickup();
    this.addText(this.player.x, this.player.y - 34, WEAPONS[this.player.weapon].name, "#facc15", 15);
  }

  tryDash() {
    const p = this.player;
    if (p.dashCooldown > 0 || p.alive === false || this.phase !== "playing") return;
    const dx = (this.targetX - this.w / 2) || 1;
    const dy = (this.targetY - this.h / 2) || 0;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    p.vx = ux * 900;
    p.vy = uy * 900;
    p.dashCooldown = 2.2;
    p.invuln = Math.max(p.invuln, 0.35);
    p.dashTimer = 0.18;
    audio.dash();
    this.shake += 2;
    this.dashHint = 0;
    for (let i = 0; i < 12; i++) this.spawnParticle(p.x, p.y, "#22d3ee", 2, 400, true);
  }

  reload() {
    const p = this.player;
    const w = WEAPONS[p.weapon];
    if (p.ammo >= w.magSize) return;
    p.fireCooldown = w.reloadTime;
    audio.reload();
    p.ammo = w.magSize;
    this.addText(p.x, p.y - 34, "RELOAD", "#9aa6b8", 13);
  }

  // ---------- helpers ----------
  spawnParticle(
    x: number,
    y: number,
    color: string,
    size: number,
    speed: number,
    glow: boolean,
    count = 1
  ) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.8);
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.3 + Math.random() * 0.5,
        maxLife: 0.8,
        size: size * (0.6 + Math.random() * 0.9),
        color,
        gravity: 0,
        drag: 3,
        glow,
      });
    }
  }

  spawnPickup(x: number, y: number, type: Pickup["type"], onFriendly: () => void) {
    onFriendly();
    const n: Pickup = {
      x,
      y,
      type,
      value: 1,
      xp: 0,
      bobPhase: Math.random() * 6,
      pulse: Math.random() * 10,
      name: pickupName(type),
      color: pickupColor(type),
    };
    this.pickups.push(n);
  }

  addText(x: number, y: number, text: string, color: string, size: number) {
    this.texts.push({ x, y, vy: -45, life: 1, maxLife: 1, text, color, size });
  }

  // ---------- wave spawning ----------
  startWave() {
    this.wave += 1;
    this.waveTimer = 0;
    this.bossSpawned = false;
    const counts = [5, 8, 12, 16, 20, 24];
    const n = counts[Math.min(this.wave - 1, counts.length - 1)];
    this.spawnBatch = n;

    if (this.wave >= 5) this.triggerZoneShrink();
    if (this.wave === 3) this.triggerZoneShrink();
    if (this.wave === 6) this.triggerZoneShrink();
    if (this.wave === 8) this.triggerZoneShrink();
    if (this.wave === 10) this.triggerZoneShrink();

    this.addText(this.player.x, this.player.y - 60, `WAVE ${this.wave}`, "#facc15", 26);
    audio.zoneWarn();
  }

  triggerZoneShrink() {
    if (this.zoneShrink > 0 || this.zoneRadius <= 400) return;
    this.zoneShrink = 1;
    // pick a target inside current zone
    const r = this.zoneRadius * 0.4;
    const cx = this.zoneCenter.x + rand(-r, r);
    const cy = this.zoneCenter.y + rand(-r, r);
    this.zoneCxTarget = clamp(cx, 200, WORLD.size - 200);
    this.zoneCyTarget = clamp(cy, 200, WORLD.size - 200);
    this.zoneTargetRadius = Math.max(420, this.zoneRadius * 0.55);
    audio.zoneWarn();
    this.addText(this.player.x, this.player.y - 90, "⚠ ZONE SHRINKING ⚠", "#ef4444", 22);
  }

  spawnEnemyBatchIntoTypes() {
    const p = this.player;
    const wave = this.wave;
    for (let i = 0; i < 3; i++) {
      while (this.spawnBatch > 0) {
        this.spawnEnemy(beyond(p, 500 + Math.random() * 300), this.pickEnemyType(wave));
        this.spawnBatch -= 1;
      }
    }
  }

  pickEnemyType(wave: number): EnemyType {
    const roll = Math.random();
    if (wave >= 8 && roll < 0.12) return "boss";
    if (roll < 0.2) return "heavy";
    if (roll < 0.38) return "sniper";
    if (roll < 0.62) return "runner";
    return "grunt";
  }

  spawnEnemy(pos: { x: number; y: number }, type: EnemyType) {
    const wave = this.wave;
    const baseHp =
      type === "boss" ? BOSS_HP : type === "heavy" ? 70 : type === "sniper" ? 40 : type === "runner" ? 26 : 34;
    const hp = baseHp * (1 + (wave - 1) * 0.22);
    const speed =
      type === "heavy" ? 95 : type === "sniper" ? 160 : type === "runner" ? 250 : 170 + Math.random() * 30;
    const colors: Record<EnemyType, string> = {
      grunt: "#b5473f",
      runner: "#38bdf8",
      heavy: "#6b4f9f",
      sniper: "#c07a2e",
      boss: "#b01e2f",
    };
    const radius = type === "boss" ? 40 : type === "heavy" ? 24 : type === "runner" ? 15 : 17;
    const e: Enemy = {
      x: pos.x,
      y: pos.y,
      angle: Math.random() * Math.PI * 2,
      hp,
      maxHp: hp,
      speed,
      radius,
      type,
      fireCooldown: 1 + Math.random() * 1.5,
      hurting: 0,
      alive: true,
      bobPhase: Math.random() * 6,
      moving: true,
      hitScore: type === "boss" ? 50 : type === "heavy" ? 25 : type === "sniper" ? 20 : type === "runner" ? 15 : 10,
      color: colors[type],
      range: type === "sniper" ? 600 : type === "boss" ? 430 : type === "heavy" ? 300 : 300 + Math.random() * 100,
      chaseRange: type === "runner" ? 900 : 800,
      burstTimer: 0,
      burstCount: 0,
      attackCd: 0,
      flash: 0,
    };
    this.enemies.push(e);
    // spawn puff
    for (let i = 0; i < 14; i++) this.spawnParticle(e.x, e.y, "#ff7a3c", 2, 200, true);
  }

  // ---------- combat ----------
  fire(playerX: number, playerY: number, angle: number) {
    const p = this.player;
    const w = WEAPONS[p.weapon];
    if (p.fireCooldown > 0) return;
    p.fireCooldown = 1 / w.fireRate;
    if (p.ammo <= 0) {
      audio.reload();
      p.fireCooldown = w.reloadTime;
      p.ammo = w.magSize;
      return;
    }
    p.ammo -= 1;
    audio.shoot(p.weapon);
    this.shake += w.shake;
    // muzzle flash
    this.spawnParticle(playerX + Math.cos(angle) * 34, playerY + Math.sin(angle) * 34, "#ffe9a3", 4, 300, true, 3);

    for (let i = 0; i < w.bullets; i++) {
      const spread = (Math.random() - 0.5) * 2 * w.spread;
      const a = angle + spread;
      this.bullets.push({
        x: playerX + Math.cos(a) * 34,
        y: playerY + Math.sin(a) * 34,
        vx: Math.cos(a) * w.speed,
        vy: Math.sin(a) * w.speed,
        radius: 4,
        damage: w.damage,
        friendly: true,
        life: w.range / w.speed,
        trailX: playerX,
        trailY: playerY,
        color: w.color,
        pierce: 0,
      });
    }
    // slight recoil
    p.vx -= Math.cos(angle) * 22;
    p.vy -= Math.sin(angle) * 22;
  }

  playerShoot(px: number, py: number, tx: number, ty: number) {
    const a = Math.atan2(ty - py, tx - px);
    this.player.angle = a;
    this.fire(px, py, a);
  }

  enemyShoot(at: { x: number; y: number }, tx: number, ty: number, damage: number, speed: number, color: string) {
    const a = Math.atan2(ty - at.y, tx - at.x);
    const sp = speed * (0.85 + Math.random() * 0.3);
    this.bullets.push({
      x: at.x + Math.cos(a) * 20,
      y: at.y + Math.sin(a) * 20,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      radius: 5,
      damage,
      friendly: false,
      life: 2.5,
      trailX: at.x,
      trailY: at.y,
      color,
      pierce: 0,
    });
    audio.hit();
  }

  damageEnemy(e: Enemy, dmg: number, hitAngle: number) {
    if (!e.alive) return;
    e.hp -= dmg;
    e.hurting = 0.15;
    this.spawnParticle(e.x, e.y, "#ff4444", 2, 200, true, 4);
    this.addText(e.x, e.y - e.radius, `-${Math.round(dmg)}`, "#ff6b6b", 13);
    // knockback
    e.x += Math.cos(hitAngle) * 6;
    e.y += Math.sin(hitAngle) * 6;
    if (e.hp <= 0) this.killEnemy(e);
  }

  killEnemy(e: Enemy) {
    e.alive = false;
    this.killsTotal += 1;
    this.player.kills += 1;
    this.player.score += e.hitScore;
    this.coins += e.type === "boss" ? 50 : pick([3, 5, 8]);
    this.addScore(e.hitScore);
    this.xp += e.type === "boss" ? 60 : 12 + Math.floor(Math.random() * 6);
    checkLevel(this);
    audio.kill();
    this.shake += 4;
    // explosion
    for (let i = 0; i < 26; i++) this.spawnParticle(e.x, e.y, e.color, 3, 350, true);
    this.spawnParticle(e.x, e.y, "#ffb703", 4, 200, true, 6);
    // coin drop
    const coins = e.type === "boss" ? 9 : Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < coins; i++) {
      this.spawnPickup(e.x + rand(-20, 20), e.y + rand(-20, 20), "coin", () => {});
    }
    // chance for ammo/health
    const r = Math.random();
    if (r < 0.18) this.spawnPickup(e.x, e.y, "ammo", () => {});
    else if (r < 0.3) this.spawnPickup(e.x, e.y, "health", () => {});
    this.track("kill");
  }

  addScore(n: number) {
    this.score += n;
  }

  hurtPlayer(dmg: number) {
    const p = this.player;
    if (p.invuln > 0 || p.alive === false) return;
    let d = dmg;
    if (p.shield > 0) {
      const absorbed = Math.min(p.shield, d);
      p.shield -= absorbed;
      d -= absorbed;
    }
    if (d <= 0) return;
    p.hp -= d;
    p.hurting = 0.2;
    this.shake += 6;
    audio.hurt();
    this.spawnParticle(p.x, p.y, "#ff4444", 3, 300, true, 6);
    this.addText(p.x, p.y - 30, `-${Math.round(d)}`, "#ff4444", 16);
    if (p.hp <= 0) this.gameOver();
  }

  // ---------- loot / xp ----------
  applyPickup(k: Pickup) {
    const p = this.player;
    switch (k.type) {
      case "health":
        p.hp = Math.min(p.maxHp, p.hp + 30);
        audio.pickup();
        this.addText(p.x, p.y - 30, "+HP", "#4ade80", 14);
        break;
      case "shield":
        p.shield = Math.min(p.maxShield || 50, p.shield + 25);
        audio.pickup();
        this.addText(p.x, p.y - 30, "+SHIELD", "#22d3ee", 14);
        break;
      case "ammo":
        p.ammo = WEAPONS[p.weapon].magSize;
        audio.pickup();
        this.addText(p.x, p.y - 30, "+AMMO", "#facc15", 14);
        break;
      case "coin":
        this.coins += k.value;
        p.score += 2;
        audio.coin();
        break;
      case "weapon_rifle":
        p.weapon = "rifle";
        p.ammo = WEAPONS.rifle.magSize;
        audio.pickup();
        this.addText(p.x, p.y - 34, "VIPER AR!", "#4ade80", 16);
        break;
      case "weapon_smg":
        p.weapon = "smg";
        p.ammo = WEAPONS.smg.magSize;
        audio.pickup();
        this.addText(p.x, p.y - 34, "COBRA SMG!", "#38bdf8", 16);
        break;
      case "weapon_shotgun":
        p.weapon = "shotgun";
        p.ammo = WEAPONS.shotgun.magSize;
        audio.pickup();
        this.addText(p.x, p.y - 34, "TITAN M870!", "#fb923c", 16);
        break;
      case "weapon_sniper":
        p.weapon = "sniper";
        p.ammo = WEAPONS.sniper.magSize;
        audio.pickup();
        this.addText(p.x, p.y - 34, "RAPTOR .50!", "#c084fc", 16);
        break;
      case "dashcharge":
        p.dashCooldown = 0;
        audio.pickup();
        this.addText(p.x, p.y - 30, "DASH READY", "#22d3ee", 13);
        break;
    }
    this.track("loot");
    // particle
    this.spawnParticle(k.x, k.y, k.color, 3, 250, true, 6);
  }

  track(kind: "kill" | "loot" | "coin" | "survive") {
    for (const m of this.missions) {
      if (m.complete || m.claimed) continue;
      if (m.key === kind) {
        m.progress += 1;
        if (!m._rewarded && m.progress >= m.target) {
          m.complete = true;
          this.rewardMission(m);
        }
      }
    }
  }

  rewardMission(m: Mission) {
    m._rewarded = true;
    this.score += m.reward;
    this.xp += 40;
    audio.levelup();
    this.addText(this.player.x, this.player.y - 70, `MISSION: ${m.title} +${m.reward}`, "#4ade80", 18);
  }

  claimMission(m: Mission) {
    if (m.complete && !m.claimed) {
      m.claimed = true;
      this.score += m.reward;
      audio.coin();
      this.addText(this.player.x, this.player.y - 40, `+${m.reward}`, "#facc15", 16);
    }
  }

  // ---------- update ----------
  loop = (t: number) => {
    const dt = Math.min((t - this.lastT) / 1000, 0.033);
    this.lastT = t;
    this.time = t / 1000;
    if (this.phase === "playing") this.update(dt);
    this.render();
    this.cb.onStats(this.stats());
    this.raf = requestAnimationFrame(this.loop);
  };

  stats(): GameStats {
    return {
      kills: this.killsTotal,
      coins: this.coins,
      timeSurvived: this.timeSurvived,
      level: this.level,
    };
  }

  update(dt: number) {
    const p = this.player;
    if (!p.alive) return;
    this.timeSurvived += dt;

    // survive mission
    this.surviveCredit += dt;
    if (this.surviveCredit > 5) {
      this.surviveCredit = 0;
      this.track("survive");
    }

    // zone timer
    if (this.wave === 0) {
      this.waveTimer += dt;
      if (this.waveTimer > 2) this.startWave();
    }

    // ---- zone shrink ----
    if (this.zoneShrink > 0) {
      const shrinkRate = 8; // px per second
      this.zoneRadius -= shrinkRate * dt * (this.zoneShrink >= 0 ? 1 : -1);
      this.zoneCenter.x += (this.zoneCxTarget - this.zoneCenter.x) * dt * 0.3;
      this.zoneCenter.y += (this.zoneCyTarget - this.zoneCenter.y) * dt * 0.3;
      if (this.zoneRadius <= this.zoneTargetRadius) {
        this.zoneRadius = this.zoneTargetRadius;
        this.zoneShrink = 0;
      }
    }
    // outside-zone damage with warning
    const distZone = Math.hypot(p.x - this.zoneCenter.x, p.y - this.zoneCenter.y);
    if (distZone > this.zoneRadius) {
      this.zoneDangerTick += dt;
      if (this.zoneDangerTick > 0.5) {
        this.zoneDangerTick = 0;
        this.hurtPlayer(8);
      }
    }

    // ---- player input ----
    let ix = 0;
    let iy = 0;
    if (this.keys["w"] || this.keys["arrowup"]) iy -= 1;
    if (this.keys["s"] || this.keys["arrowdown"]) iy += 1;
    if (this.keys["a"] || this.keys["arrowleft"]) ix -= 1;
    if (this.keys["d"] || this.keys["arrowright"]) ix += 1;
    const il = Math.hypot(ix, iy) || 1;
    // touch joystick (handled via virtual joystick in UI writing to controls)
    const j = this.joystick;
    if (j) {
      ix += j.x;
      iy += j.y;
    }
    const mag = Math.hypot(ix, iy);

    // dash movement
    if (p.dashTimer > 0) {
      p.dashTimer -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    } else {
      const sp = mag > 0 ? Math.min(1, mag / il) : 0;
      p.vx += (ix * sp * p.speed - p.vx) * Math.min(1, dt * 12);
      p.vy += (iy * sp * p.speed - p.vy) * Math.min(1, dt * 12);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    p.moving = mag > 0.1 || p.dashTimer > 0;
    if (p.moving) p.bobbing += dt * 9;

    // clamp to world, collide with cover
    this.collideWorld();
    this.collideCovers();

    // cooldowns
    p.fireCooldown -= dt;
    p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    p.hurting = Math.max(0, p.hurting - dt);
    p.invuln = Math.max(0, p.invuln - dt);

    // aim angle
    if (this.touchAim) {
      const dx = this.targetX - this.w / 2;
      const dy = this.targetY - this.h / 2;
      this.player.angle = Math.atan2(dy, dx);
    } else {
      const sx = this.targetX + this.camX - this.w / 2;
      const sy = this.targetY + this.camY - this.h / 2;
      this.player.angle = Math.atan2(sy - p.y, sx - p.x);
    }

    // firing
    if (this.mouseDown && this.phase === "playing") {
      if (this.touchAim) {
        if (this.pointerDist > 60) {
          this.fire(p.x, p.y, this.player.angle);
        }
      } else {
        this.fire(p.x, p.y, this.player.angle);
      }
    }

    // ---- wave spawning ----
    this.spawnEnemyBatchIntoTypes();

    // ---- enemies ----
    this.updateEnemies(dt);

    // ---- bullets ----
    this.updateBullets(dt);

    // ---- pickups magnet ----
    for (const k of this.pickups) {
      k.bobPhase += dt * 3;
      k.pulse += dt;
      const dx = p.x - k.x;
      const dy = p.y - k.y;
      const d = Math.hypot(dx, dy);
      if (d < 120) {
        k.x += (dx / d) * dt * 240;
        k.y += (dy / d) * dt * 240;
      }
      if (d < p.radius + 14) {
        this.applyPickup(k);
        k.xp = -9999; // mark consumed
      }
    }
    this.pickups = this.pickups.filter((k) => k.xp !== -9999);

    // ---- particles ----
    for (const pa of this.particles) {
      pa.life -= dt;
      pa.x += pa.vx * dt;
      pa.y += pa.vy * dt;
      pa.vx -= pa.vx * pa.drag * dt;
      pa.vy -= pa.vy * pa.drag * dt;
      pa.vy += pa.gravity * dt;
    }
    this.particles = this.particles.filter((pa) => pa.life > 0);

    // ---- floating texts ----
    for (const t of this.texts) {
      t.life -= dt * 0.8;
      t.y += t.vy * dt;
    }
    this.texts = this.texts.filter((t) => t.life > 0);

    // ---- camera ----
    const targetX = p.x;
    const targetY = p.y - 40;
    this.camX += (targetX - this.camX) * Math.min(1, dt * 6);
    this.camY += (targetY - this.camY) * Math.min(1, dt * 6);
    this.shake = Math.max(0, this.shake - dt * 40);
    this.shakeX = (Math.random() - 0.5) * this.shake;
    this.shakeY = (Math.random() - 0.5) * this.shake;
    this.starTimer += dt;
  }

  // joystick set externally by UI
  joystick: { x: number; y: number } | null = null;
  pointerDist = 0;

  setJoystick(x: number, y: number) {
    this.joystick = { x, y };
  }
  setPointerDist(d: number) {
    this.pointerDist = d;
  }

  dirToPlayer(x: number, y: number): { dx: number; dy: number; d: number; ux: number; uy: number } {
    const p = this.player;
    const dx = p.x - x;
    const dy = p.y - y;
    const d = Math.hypot(dx, dy) || 1;
    return { dx, dy, d, ux: dx / d, uy: dy / d };
  }

  updateEnemies(dt: number) {
    const p = this.player;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.hurting = Math.max(0, e.hurting - dt);
      e.flash = Math.max(0, e.flash - dt);
      const toP = this.dirToPlayer(e.x, e.y);
      // separate enemies from each other
      for (const o of this.enemies) {
        if (o === e || !o.alive) continue;
        const dx = e.x - o.x;
        const dy = e.y - o.y;
        const dd = Math.hypot(dx, dy);
        if (dd < e.radius + o.radius && dd > 0) {
          e.x += (dx / dd) * 40 * dt;
          e.y += (dy / dd) * 40 * dt;
        }
      }
      // avoid cover walls a bit
      for (const c of this.world.covers) {
        if (c.type === "crate" || c.type === "wall" || c.type === "turret" || c.type === "tank") {
          const cx = c.x + c.w / 2;
          const cy = c.y + c.h / 2;
          const dd = Math.hypot(e.x - cx, e.y - cy);
          if (dd < c.w / 2 + e.radius && dd > 0.01) {
            e.x += ((e.x - cx) / dd) * 80 * dt;
            e.y += ((e.y - cy) / dd) * 80 * dt;
          }
        }
      }

      e.bobPhase += dt * 8;
      const dist = toP.d;
      e.angle = Math.atan2(p.y - e.y, p.x - e.x);

      if (dist < e.range - 60) {
        // retreat if too close (except runners/boss)
        if (e.type !== "runner" && e.type !== "boss" && dist < 100) {
          e.x += -toP.ux * e.speed * dt * 0.6;
          e.y += -toP.uy * e.speed * dt * 0.6;
          e.moving = true;
        } else if (dist < e.range) {
          // strafe slowly
          e.x += -toP.uy * e.speed * 0.35 * dt;
          e.y += toP.ux * e.speed * 0.35 * dt;
          e.moving = true;
          // shoot
          e.attackCd -= dt;
          if (e.attackCd <= 0 && e.type !== "runner") {
            e.attackCd = e.type === "sniper" ? 1.9 : e.type === "boss" ? 1.1 : e.type === "heavy" ? 1.5 : 1.2;
            const dmg = e.type === "sniper" ? 22 : e.type === "heavy" ? 14 : 8;
            this.enemyShoot(e, p.x, p.y, dmg, e.type === "sniper" ? 700 : 520, "#ff7a3c");
          }
        } else {
          e.moving = false;
        }
      } else if (dist < e.chaseRange) {
        e.x += toP.ux * e.speed * dt;
        e.y += toP.uy * e.speed * dt;
        e.moving = true;
      } else {
        e.moving = false;
      }

      // runners attack by contact + shoot occasionally
      if (e.type === "runner" && dist < 40) {
        this.hurtPlayer(6);
        e.x -= toP.ux * 120 * dt;
        e.y -= toP.uy * 120 * dt;
      }

      // constrain enemies within world
      e.x = clamp(e.x, e.radius, WORLD.size - e.radius);
      e.y = clamp(e.y, e.radius, WORLD.size - e.radius);
    }
    this.enemies = this.enemies.filter((e) => e.alive);

    // wave completion check
    if (this.wave > 0 && this.enemies.length === 0 && this.spawnBatch <= 0 && this.waveTimer > 0) {
      this.startWave();
    }
  }

  updateBullets(dt: number) {
    const p = this.player;
    for (const b of this.bullets) {
      b.trailX = b.x;
      b.trailY = b.y;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      // world bounds
      if (b.x < 0 || b.x > WORLD.size || b.y < 0 || b.y > WORLD.size) b.life = 0;

      // hit enemies
      if (b.friendly) {
        for (const e of this.enemies) {
          if (!e.alive) continue;
          const dd = Math.hypot(b.x - e.x, b.y - e.y);
          if (dd < e.radius) {
            this.damageEnemy(e, b.damage, Math.atan2(b.vy, b.vx));
            this.spawnParticle(b.x, b.y, "#ffd166", 2, 150, true, 3);
            b.life = 0;
            break;
          }
        }
      } else {
        const dd = Math.hypot(b.x - p.x, b.y - p.y);
        if (dd < p.radius) {
          this.hurtPlayer(b.damage);
          b.life = 0;
        }
      }
    }
    this.bullets = this.bullets.filter((b) => b.life > 0);
  }

  collideWorld() {
    const p = this.player;
    p.x = clamp(p.x, p.radius, WORLD.size - p.radius);
    p.y = clamp(p.y, p.radius, WORLD.size - p.radius);
  }

  collideCovers() {
    const p = this.player;
    const r = p.radius;
    for (const c of this.world.covers) {
      if (!c.solid) continue;
      const nc = nearestPoint(p.x, p.y, c.x, c.y, c.w, c.h);
      const dx = p.x - nc.x;
      const dy = p.y - nc.y;
      const d = Math.hypot(dx, dy);
      if (d < r && d > 0) {
        const push = r - d;
        const inv = p.dashTimer > 0 ? 0.3 : 1;
        p.x += (dx / d) * push * inv;
        p.y += (dy / d) * push * inv;
      }
    }
    p.x = clamp(p.x, p.radius, WORLD.size - p.radius);
    p.y = clamp(p.y, p.radius, WORLD.size - p.radius);
  }

  // ---------- game over / level ----------
  gameOver() {
    this.player.alive = false;
    this.phase = "gameover";
    audio.gameover();
    this.shake += 12;
    for (let i = 0; i < 60; i++) this.spawnParticle(this.player.x, this.player.y, "#ff4444", 4, 400, true);
    this.saveHighScore();
    this.cb.onPhaseChange();
  }

  saveHighScore() {
    const list = getHighScores();
    list.push({
      name: localStorage.getItem("rr_name") || "SOLDIER",
      score: this.score,
      kills: this.killsTotal,
      wave: this.wave,
      date: Date.now(),
    });
    localStorage.setItem("rr_highscores", JSON.stringify(list));
  }

  get highScores(): HighScore[] {
    return getHighScores();
  }

  // ---------- render ----------
  render() {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = "#0a0e1a";
    ctx.fillRect(0, 0, this.w, this.h);

    const camX = this.camX - this.w / 2 + this.shakeX;
    const camY = this.camY - this.h / 2 + this.shakeY;

    ctx.save();
    ctx.translate(-camX, -camY);

    // ground
    ctx.fillStyle = "#1b2a1b";
    ctx.fillRect(this.camX - this.w / 2 - 100, this.camY - this.h / 2 - 100, this.w + 200, this.h + 200);

    // ground grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    const gs = 150;
    const startX = Math.floor((this.camX - this.w / 2) / gs) * gs;
    const startY = Math.floor((this.camY - this.h / 2) / gs) * gs;
    ctx.beginPath();
    for (let x = startX; x < this.camX + this.w / 2 + gs; x += gs) {
      ctx.moveTo(x, this.camY - this.h / 2);
      ctx.lineTo(x, this.camY + this.h / 2);
    }
    for (let y = startY; y < this.camY + this.h / 2 + gs; y += gs) {
      ctx.moveTo(this.camX - this.w / 2, y);
      ctx.lineTo(this.camX + this.w / 2, y);
    }
    ctx.stroke();

    // ground mottling
    for (let i = 0; i < 180; i++) {
      const x = pseudo(i * 7.3) * WORLD.size;
      const y = pseudo(i * 3.7 + 900) * WORLD.size;
      if (Math.abs(x - this.camX) < 900 && Math.abs(y - this.camY) < 900) {
        ctx.fillStyle = pseudo(i * 2 + 50) > 0.5 ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.06)";
        ctx.beginPath();
        ctx.ellipse(x, y, 60, 40, pseudo(i) * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // props (trees, rocks) behind everything
    for (const pr of this.world.props) {
      if (Math.abs(pr.x - this.camX) > 900 || Math.abs(pr.y - this.camY) > 900) continue;
      drawProp(ctx, pr.x, pr.y, pr.type, pr.size, pr.color, pr.rotation);
    }

    // safe zone ring
    this.drawZone(ctx);

    // pickups
    for (const k of this.pickups) {
      if (Math.abs(k.x - this.camX) > 800 || Math.abs(k.y - this.camY) > 800) continue;
      drawPickup(ctx, k.x, k.y, k.type, k.color, k.bobPhase, k.pulse);
    }

    // covers
    for (const c of this.world.covers) {
      if (Math.abs(c.x - this.camX) > 900 || Math.abs(c.y - this.camY) > 900) continue;
      drawCover(ctx, c);
    }

    // bullets
    for (const b of this.bullets) {
      if (Math.abs(b.x - this.camX) > 400 || Math.abs(b.y - this.camY) > 400) continue;
      drawBullet(ctx, b);
    }

    // enemies sorted by y for pseudo-depth
    const sortedEnemies = [...this.enemies].sort((a, b) => a.y - b.y);
    for (const e of sortedEnemies) {
      if (Math.abs(e.x - this.camX) > 800 || Math.abs(e.y - this.camY) > 800) continue;
      drawEnemy(ctx, e);
      if (e.type === "boss") drawBossHealth(ctx, e);
      // aggro indicator
      const toP = this.dirToPlayer(e.x, e.y);
      if (toP.d < 500 && e.type !== "grunt") {
        ctx.fillStyle = "rgba(255,60,60,0.4)";
        ctx.beginPath();
        ctx.arc(e.x, e.y - e.radius - 8, 3 + Math.sin(this.time * 10) * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // player (drawn on top of enemies behind)
    if (this.player.alive) drawPlayer(ctx, this.player, 0, this.time);

    // floating texts (world space)
    for (const t of this.texts) {
      ctx.globalAlpha = Math.min(1, t.life);
      ctx.fillStyle = t.color;
      ctx.font = `700 ${t.size}px Rajdhani, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 6;
      ctx.fillText(t.text, t.x, t.y);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;

    ctx.restore();

    // vignette
    const vg = ctx.createRadialGradient(this.w / 2, this.h / 2, this.h * 0.4, this.w / 2, this.h / 2, this.h * 0.9);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, this.w, this.h);

    // low health pulse
    if (this.player.hp < 40 && this.player.alive) {
      const a = 0.15 + Math.sin(this.time * 6) * 0.1;
      const rged = ctx.createRadialGradient(this.w / 2, this.h / 2, this.h * 0.2, this.w / 2, this.h / 2, this.h * 0.7);
      rged.addColorStop(0, "rgba(200,0,0,0)");
      rged.addColorStop(1, `rgba(200,0,0,${a})`);
      ctx.fillStyle = rged;
      ctx.fillRect(0, 0, this.w, this.h);
    }

    // zone danger ring on screen
    if (this.zoneShrink > 0) {
      ctx.strokeStyle = `rgba(239,68,68,${0.3 + Math.sin(this.time * 8) * 0.15})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(8, 8, this.w - 16, this.h - 16);
    }
  }

  drawZone(ctx: CanvasRenderingContext2D) {
    const cx = this.zoneCenter.x;
    const cy = this.zoneCenter.y;
    // danger area outside safe zone
    ctx.fillStyle = "rgba(120,0,60,0.22)";
    ctx.beginPath();
    ctx.arc(cx, cy, WORLD.size, 0, Math.PI * 2);
    ctx.arc(cx, cy, this.zoneRadius, 0, Math.PI * 2, true);
    ctx.fill("evenodd");
    // safe zone ring
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#22d3ee";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, this.zoneRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    // shrink animation line
    if (this.zoneShrink > 0) {
      ctx.strokeStyle = "rgba(239,68,68,0.7)";
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 12]);
      ctx.beginPath();
      ctx.arc(cx, cy, this.zoneTargetRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // name getter for input field
  setPlayerName(name: string) {
    localStorage.setItem("rr_name", name);
  }
}

// ---------- module helpers ----------
import { drawEnemy, drawPlayer } from "./render";
import type { HighScore } from "./types";

function checkLevel(g: Game) {
  while (g.xp >= g.xpNext) {
    g.xp -= g.xpNext;
    g.level += 1;
    g.xpNext = Math.round(g.xpNext * 1.4);
    g.player.maxHp += 15;
    g.player.hp = Math.min(g.player.maxHp, g.player.hp + 40);
    g.player.maxShield = g.player.maxShield + 10;
    g.player.shield = g.player.maxShield;
    g.player.speed += 6;
    audio.levelup();
    g.addText(g.player.x, g.player.y - 50, `LEVEL ${g.level}!`, "#22d3ee", 22);
    const show = {
      id: "lv-" + g.level,
      title: `Reach Level ${g.level}`,
      desc: "Level up your soldier and get stronger.",
      progress: g.level,
      target: g.level,
      reward: 100,
      complete: false,
      claimed: false,
    };
    void show;
  }
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function beyond(
  from: { x: number; y: number },
  dist: number
): { x: number; y: number } {
  const a = Math.random() * Math.PI * 2;
  return {
    x: clamp(from.x + Math.cos(a) * dist, 100, WORLD.size - 100),
    y: clamp(from.y + Math.sin(a) * dist, 100, WORLD.size - 100),
  };
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pseudo(seed: number) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function nearestPoint(px: number, py: number, rx: number, ry: number, rw: number, rh: number) {
  const cx = clamp(px, rx, rx + rw);
  const cy = clamp(py, ry, ry + rh);
  return { x: cx, y: cy };
}

export function getHighScores(): HighScore[] {
  try {
    const raw = localStorage.getItem("rr_highscores");
    if (!raw) return [];
    const list = JSON.parse(raw) as HighScore[];
    list.sort((a, b) => b.score - a.score);
    return list.slice(0, 8);
  } catch {
    return [];
  }
}

function pickupName(type: Pickup["type"]): string {
  const map: Record<string, string> = {
    health: "Med Kit",
    shield: "Shield Cell",
    ammo: "Ammo",
    weapon_rifle: "Viper AR",
    weapon_smg: "Cobra SMG",
    weapon_shotgun: "Titan M870",
    weapon_sniper: "Raptor .50",
    coin: "Coin",
    dashcharge: "Dash Cooldown",
  };
  return map[type] || "Item";
}

function pickupColor(type: Pickup["type"]): string {
  const map: Record<string, string> = {
    health: "#4ade80",
    shield: "#22d3ee",
    ammo: "#facc15",
    weapon_rifle: "#4ade80",
    weapon_smg: "#38bdf8",
    weapon_shotgun: "#fb923c",
    weapon_sniper: "#c084fc",
    coin: "#f6c900",
    dashcharge: "#22d3ee",
  };
  return map[type] || "#fff";
}

function pickLootType(): Pickup["type"] {
  const r = Math.random();
  if (r < 0.06) return "weapon_rifle";
  if (r < 0.11) return "weapon_smg";
  if (r < 0.16) return "weapon_shotgun";
  if (r < 0.2) return "weapon_sniper";
  if (r < 0.42) return "ammo";
  if (r < 0.65) return "health";
  if (r < 0.85) return "shield";
  return "dashcharge";
}



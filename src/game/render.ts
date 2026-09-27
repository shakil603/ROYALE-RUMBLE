import type { Bullet, Enemy, Player } from "./types";

// Procedural top-down character rendering with realistic model detail.
// Draws layered body parts: shadow, legs, torso with gear, arms, weapon, hands, head.

export function lerpAngle(a: number, b: number, t: number) {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  p: Player,
  _bob: number,
  time: number
) {
  const x = p.x;
  const y = p.y;
  const r = p.radius;

  // Shadow
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.35, r * 1.1, r * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Hurt / invuln flash
  const flashing =
    (p.hurting > 0 && Math.floor(p.hurting * 20) % 2 === 0) ||
    (p.invuln > 0 && Math.floor(time * 25) % 2 === 0);

  const legSwing = p.moving ? Math.sin(p.bobbing * 10) * 0.5 : 0;
  const bodyShift = Math.sin(p.bobbing * 10) * (p.moving ? 1.5 : 0);

  // Legs (scissor animation while moving)
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(p.angle);
  ctx.fillStyle = flashing ? "#fbe7c0" : "#2b3647";
  for (const s of [-0.9, 0.9]) {
    ctx.save();
    ctx.translate(-s / 2, 0);
    ctx.rotate(legSwing * (s > 0 ? 1 : -1));
    ctx.fillRect(-r * 0.32, -r * 0.62 + s * r * 0.28, r * 0.3, r * 0.58);
    ctx.restore();
  }
  ctx.restore();

  // Torso — gear / jacket with body armor plate
  ctx.save();
  ctx.translate(x + bodyShift * 0.4, y - r * 0.15 + bodyShift * 0.3);
  ctx.rotate(p.angle);
  const torsoW = r * 1.15;
  const torsoH = r * 1.5;
  // jacket base
  const grad = ctx.createLinearGradient(0, -torsoH / 2, 0, torsoH / 2);
  grad.addColorStop(0, flashing ? "#ffe0a8" : "#3b4b6b");
  grad.addColorStop(1, flashing ? "#ffd394" : "#2a3850");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 0, torsoW / 2, torsoH / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Body armor vest plate
  ctx.fillStyle = flashing ? "#ffd9a0" : "#232f45";
  ctx.beginPath();
  ctx.ellipse(0, 0, torsoW * 0.3, torsoH * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();

  // Combat belt / gear
  ctx.fillStyle = "#1e2738";
  ctx.fillRect(-torsoW * 0.45, torsoH * 0.18, torsoW * 0.9, torsoH * 0.16);
  ctx.fillStyle = "#9aa6b8";
  ctx.fillRect(-torsoW * 0.18, torsoH * 0.18, torsoW * 0.36, torsoH * 0.16);

  // Shoulder armor pads
  ctx.fillStyle = flashing ? "#ffe0ac" : "#3a4b6d";
  ctx.beginPath();
  ctx.arc(-torsoW * 0.42, 0, r * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(torsoW * 0.42, 0, r * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.stroke();

  // Backpack straps
  ctx.strokeStyle = "#1e2738";
  ctx.lineWidth = r * 0.12;
  ctx.beginPath();
  ctx.moveTo(-torsoW * 0.28, -torsoH * 0.3);
  ctx.lineTo(-torsoW * 0.28, torsoH * 0.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(torsoW * 0.28, -torsoH * 0.3);
  ctx.lineTo(torsoW * 0.28, torsoH * 0.4);
  ctx.stroke();

  // Weapon in front (two-handed grip)
  drawWeapon(ctx, p.weapon, r);

  // Arms reaching toward weapon
  ctx.fillStyle = flashing ? "#f7d9a8" : "#d9a57e";
  for (const s of [-0.5, 0.5]) {
    ctx.save();
    ctx.translate(s * r * 0.5, r * 0.25);
    ctx.rotate(-s * 0.2);
    ctx.fillRect(-r * 0.18, -r * 0.14, r * 0.7, r * 0.34);
    ctx.restore();
  }

  // Hands gripping
  ctx.fillStyle = "#e6b488";
  ctx.beginPath();
  ctx.arc(r * 0.32, r * 0.28, r * 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Head — helmet + face (drawn outside torso rotation so it reads from above)
  const hx = x + Math.cos(p.angle) * r * 0.2 + bodyShift * 0.5;
  const hy = y - r * 0.15 - r * 0.16 + bodyShift * 0.4;
  // hair / helmet
  const hairGrad = ctx.createRadialGradient(hx - r * 0.15, hy - r * 0.2, 0, hx, hy, r * 0.9);
  hairGrad.addColorStop(0, flashing ? "#ffedc9" : "#4a2610");
  hairGrad.addColorStop(1, flashing ? "#ffe2ac" : "#2c1505");
  ctx.fillStyle = hairGrad;
  ctx.beginPath();
  ctx.arc(hx, hy, r * 0.92, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // face (skin tone) offset toward aim
  const fx = hx + Math.cos(p.angle) * r * 0.55;
  const fy = hy + Math.sin(p.angle) * r * 0.55;
  ctx.fillStyle = flashing ? "#fbe6c4" : "#e8b88a";
  ctx.beginPath();
  ctx.arc(fx, fy, r * 0.52, 0, Math.PI * 2);
  ctx.fill();
  // eyes
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(fx + Math.cos(p.angle + 1) * r * 0.3, fy + Math.sin(p.angle + 1) * r * 0.3, r * 0.09, 0, Math.PI * 2);
  ctx.arc(fx + Math.cos(p.angle - 1) * r * 0.3, fy + Math.sin(p.angle - 1) * r * 0.3, r * 0.09, 0, Math.PI * 2);
  ctx.fill();
}

function drawWeapon(ctx: CanvasRenderingContext2D, weapon: string, r: number) {
  const len =
    weapon === "sniper" ? r * 2.2 : weapon === "shotgun" ? r * 1.8 : weapon === "rifle" ? r * 1.7 : r * 1.35;
  ctx.save();
  ctx.translate(r * 0.15, r * 0.25);
  // stock
  ctx.fillStyle = "#19120a";
  ctx.fillRect(-r * 0.5, -r * 0.16, r * 0.55, r * 0.32);
  // barrel
  const bGrad = ctx.createLinearGradient(0, 0, len, 0);
  bGrad.addColorStop(0, weapon === "shotgun" ? "#9a6a3a" : "#2c2f35");
  bGrad.addColorStop(1, "#1b1d22");
  ctx.fillStyle = bGrad;
  ctx.fillRect(r * 0.05, -r * 0.1, len, r * 0.2);
  // detail ribs
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  for (let i = 0; i < 3; i++) ctx.fillRect(r * 0.1 + i * len * 0.28, -r * 0.1, r * 0.06, r * 0.2);
  // mag
  ctx.fillStyle = "#23262c";
  ctx.beginPath();
  ctx.moveTo(r * 0.6, r * 0.1);
  ctx.lineTo(r * 0.82, r * 0.55);
  ctx.lineTo(r * 0.98, r * 0.55);
  ctx.lineTo(r * 1.05, r * 0.1);
  ctx.closePath();
  ctx.fill();
  // scope for rifle/sniper
  if (weapon === "sniper" || weapon === "rifle") {
    ctx.fillStyle = "#0f1115";
    ctx.fillRect(r * 0.6, -r * 0.3, len * 0.4, r * 0.2);
    ctx.fillStyle = "#1fa5ff";
    ctx.fillRect(r * 0.72, -r * 0.24, len * 0.16, r * 0.08);
  }
  // shotgun barrel thicker
  if (weapon === "shotgun") {
    ctx.fillStyle = "#3d2c14";
    ctx.fillRect(r * 0.05, -r * 0.2, len, r * 0.14);
  }
  ctx.restore();
}

export function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy) {
  const x = e.x;
  const y = e.y;
  const r = e.radius;
  const flashing = e.hurting > 0 && Math.floor(e.hurting * 18) % 2 === 0;
  const legSwing = e.moving ? Math.sin(e.bobPhase * 8) * 0.5 : 0;
  const body = e.bobPhase;
  const bodyShift = Math.sin(body * 8) * (e.moving ? 1.4 : 0);

  // Shadow
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.32, r * 1.05, r * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // legs
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(e.angle);
  ctx.fillStyle = flashing ? "#e8d8c0" : darken(e.color, 0.4);
  for (const s of [-0.85, 0.85]) {
    ctx.save();
    ctx.translate(-s / 2, 0);
    ctx.rotate(legSwing * (s > 0 ? 1 : -1));
    ctx.fillRect(-r * 0.3, -r * 0.58 + s * r * 0.26, r * 0.28, r * 0.54);
    ctx.restore();
  }
  ctx.restore();

  // torso
  ctx.save();
  ctx.translate(x + bodyShift * 0.4, y - r * 0.13 + bodyShift * 0.3);
  ctx.rotate(e.angle);
  const tw = r * 1.12;
  const th = r * 1.45;
  const grad = ctx.createLinearGradient(0, -th / 2, 0, th / 2);
  grad.addColorStop(0, flashing ? "#ffe0b0" : e.color);
  grad.addColorStop(1, flashing ? "#ffd49a" : darken(e.color, 0.35));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 0, tw / 2, th / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 1;
  ctx.stroke();
  // vest plate
  ctx.fillStyle = flashing ? "#ffdcA6" : darken(e.color, 0.5);
  ctx.beginPath();
  ctx.ellipse(0, 0, tw * 0.28, th * 0.68, 0, 0, Math.PI * 2);
  ctx.fill();
  // belt
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(-tw * 0.44, th * 0.18, tw * 0.88, th * 0.14);
  // shoulder pads
  ctx.fillStyle = flashing ? "#ffe2ac" : darken(e.color, 0.2);
  ctx.beginPath();
  ctx.arc(-tw * 0.4, 0, r * 0.32, 0, Math.PI * 2);
  ctx.arc(tw * 0.4, 0, r * 0.32, 0, Math.PI * 2);
  ctx.fill();

  // enemy weapon
  const len = e.type === "sniper" ? r * 1.9 : r * 1.5;
  ctx.save();
  ctx.translate(r * 0.15, r * 0.24);
  ctx.fillStyle = flashing ? "#ffd8a0" : "#241d14";
  ctx.fillRect(r * 0.05, -r * 0.09, len, r * 0.18);
  ctx.fillStyle = "#111";
  ctx.fillRect(-r * 0.45, -r * 0.14, r * 0.5, r * 0.28);
  if (e.type === "sniper") {
    ctx.fillStyle = "#0f1115";
    ctx.fillRect(r * 0.5, -r * 0.26, len * 0.4, r * 0.18);
  }
  ctx.restore();
  ctx.restore();

  // head
  const hx = x + Math.cos(e.angle) * r * 0.2 + bodyShift * 0.5;
  const hy = y - r * 0.13 - r * 0.15 + bodyShift * 0.4;
  // bandana/balaclava color variation
  const headCol = e.type === "boss" ? "#4a2c1a" : "#3a2c22";
  ctx.fillStyle = flashing ? "#ffdca8" : headCol;
  ctx.beginPath();
  ctx.arc(hx, hy, r * 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  const fx = hx + Math.cos(e.angle) * r * 0.55;
  const fy = hy + Math.sin(e.angle) * r * 0.55;
  ctx.fillStyle = flashing ? "#f6dcc0" : "#d9a57e";
  ctx.beginPath();
  ctx.arc(fx, fy, r * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(fx + Math.cos(e.angle + 1) * r * 0.28, fy + Math.sin(e.angle + 1) * r * 0.28, r * 0.09, 0, Math.PI * 2);
  ctx.arc(fx + Math.cos(e.angle - 1) * r * 0.28, fy + Math.sin(e.angle - 1) * r * 0.28, r * 0.09, 0, Math.PI * 2);
  ctx.fill();

  // boss crown
  if (e.type === "boss") {
    ctx.fillStyle = "#facc15";
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(hx + i * r * 0.45 - r * 0.15, hy - r * 0.85);
      ctx.lineTo(hx + i * r * 0.45, hy - r * 1.3);
      ctx.lineTo(hx + i * r * 0.45 + r * 0.15, hy - r * 0.85);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function darken(hex: string, amt: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  const r = Math.max(0, ((n >> 16) & 255) * (1 - amt));
  const g = Math.max(0, ((n >> 8) & 255) * (1 - amt));
  const b = Math.max(0, ((n >> 0) & 255) * (1 - amt));
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

export function drawBullet(ctx: CanvasRenderingContext2D, b: Bullet) {
  const len = Math.hypot(b.vx, b.vy) || 1;
  const ux = b.vx / len;
  const uy = b.vy / len;
  // tail
  ctx.strokeStyle = b.color;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = b.radius;
  ctx.beginPath();
  ctx.moveTo(b.x - ux * 18, b.y - uy * 18);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.globalAlpha = 1;
  // head glow
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = b.color;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.radius * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

type MinimapCover = {
  x: number;
  y: number;
  w: number;
  h: number;
  type: string;
  color: string;
};

export function drawCover(ctx: CanvasRenderingContext2D, c: MinimapCover) {
  const cx = c.x + c.w / 2;
  const cy = c.y + c.h / 2;
  const half = Math.max(c.w, c.h) / 2;
  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, half + 4, half + 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = c.color;
  const shape = c.type || "crate";
  if (shape === "bush") {
    ctx.beginPath();
    ctx.arc(0, 0, half * 0.95, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.beginPath();
    ctx.arc(-half * 0.2, -half * 0.2, half * 0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === "rock") {
    const g = ctx.createRadialGradient(-half * 0.3, -half * 0.3, 0, 0, 0, half * 1.2);
    g.addColorStop(0, "#9aa0a8");
    g.addColorStop(1, darken(c.color, 0.5));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, half, half * 0.8, 0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === "tank") {
    ctx.fillStyle = "#3a4b3a";
    ctx.beginPath();
    ctx.ellipse(0, 0, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#4f6b4f";
    ctx.beginPath();
    ctx.ellipse(0, -4, c.w / 3, c.h / 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // fuel pump
    ctx.fillStyle = "#7a4f28";
    ctx.fillRect(c.w * 0.05, -c.h * 0.05, c.w * 0.24, c.h * 0.12);
  } else if (shape === "turret") {
    ctx.fillStyle = "#4c5a6e";
    ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h * 0.7);
    ctx.fillStyle = "#2f3a4d";
    ctx.fillRect(-c.w / 2, -c.h * 0.2, c.w, c.h * 0.2);
    ctx.fillStyle = "#1e2738";
    ctx.fillRect(c.w / 2 - 8, -c.h / 2 - 14, 16, 18);
  } else {
    // crate / wall
    const g = ctx.createLinearGradient(0, -c.h / 2, 0, c.h / 2);
    g.addColorStop(0, c.color);
    g.addColorStop(1, darken(c.color, 0.35));
    ctx.fillStyle = g;
    ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(-c.w / 2, -c.h / 2, c.w, c.h);
    // plank lines for crate
    if (shape === "crate") {
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-c.w / 2, 0);
      ctx.lineTo(c.w / 2, 0);
      ctx.moveTo(0, -c.h / 2);
      ctx.lineTo(0, c.h / 2);
      ctx.stroke();
    } else {
      // wall battlement
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      const n = Math.floor(c.w / 26);
      for (let i = 0; i < n; i++) {
        ctx.fillRect(-c.w / 2 + 2 + i * 26, -c.h / 2 + 3, 18, 8);
      }
    }
  }
  ctx.restore();
}

export function drawProp(ctx: CanvasRenderingContext2D, x: number, y: number, type: string, size: number, color: string, rotation: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  if (type === "tree") {
    // canopy shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.arc(2, 5, size, 0, Math.PI * 2);
    ctx.fill();
    // canopy
    const g = ctx.createRadialGradient(-size * 0.3, -size * 0.3, 0, 0, 0, size);
    g.addColorStop(0, color);
    g.addColorStop(1, darken(color, 0.4));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    // canopy detail
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.arc(-size * 0.25, -size * 0.3, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  } else if (type === "rock") {
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(2, 4, size * 0.8, size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.8, size * 0.55, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.moveTo(-size * 0.4, -size * 0.2);
    ctx.lineTo(-size * 0.1, -size * 0.4);
    ctx.lineTo(-size * 0.35, -size * 0.1);
    ctx.closePath();
    ctx.fill();
  } else if (type === "grass") {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(i * size * 0.3, -size * (0.8 + Math.abs(i) * 0.15));
      ctx.stroke();
    }
  } else if (type === "deadTank") {
    ctx.fillStyle = "#5a6b3a";
    ctx.beginPath();
    ctx.ellipse(0, 0, size, size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    // truck cabin
    ctx.fillStyle = "#4c5a34";
    ctx.beginPath();
    ctx.ellipse(size * 0.5, 0, size * 0.4, size * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawPickup(ctx: CanvasRenderingContext2D, x: number, y: number, type: string, color: string, bob: number, pulse: number) {
  const bobY = Math.sin(bob) * 4;
  const glow = 0.6 + Math.sin(pulse * 3) * 0.4;
  // ground glow
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.2 + glow * 0.15;
  ctx.beginPath();
  ctx.arc(x, y + 6, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.save();
  ctx.translate(x, y + bobY);

  if (type === "coin") {
    ctx.fillStyle = "#f6c900";
    ctx.shadowColor = "#f6c900";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 4, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#8a6d00";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#8a6d00";
    ctx.font = "700 9px Rajdhani";
    ctx.textAlign = "center";
    ctx.fillText("¢", 0, 7);
  } else {
    // bob rotation
    ctx.rotate(Math.sin(pulse) * 0.2);
    const bw = 22;
    const bh = 16;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.fillStyle = color;
    roundRect(ctx, -bw / 2, -bh / 2, bw, bh, 4);
    ctx.fill();
    ctx.shadowBlur = 0;
    // emblem
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(-bw / 2 + 3, -2, bw - 6, 4);
    // icon
    ctx.fillStyle = "#0a0e1a";
    ctx.font = "700 10px Rajdhani";
    ctx.textAlign = "center";
    if (type === "health") ctx.fillText("+", 0, 4);
    else if (type === "shield") ctx.fillText("◈", 0, 5);
    else if (type === "ammo") ctx.fillText("ammo", 0, 4);
    else if (type.startsWith("weapon")) {
      ctx.fillStyle = color;
      ctx.font = "700 8px Rajdhani";
      ctx.fillText("WPN", 0, 4);
    } else if (type === "dashcharge") ctx.fillText("»", 0, 5);
  }
  ctx.restore();
}

export function drawBossHealth(ctx: CanvasRenderingContext2D, e: Enemy) {
  const w = 60;
  const h = 5;
  const x = e.x - w / 2;
  const y = e.y - e.radius - 18;
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = "#ef4444";
  ctx.fillRect(x, y, w * (e.hp / e.maxHp), h);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

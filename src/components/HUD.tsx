import type { Mission } from "../game/types";

interface HUDProps {
  hp: number;
  maxHp: number;
  shield: number;
  shieldMax: number;
  ammo: number;
  magSize: number;
  weaponName: string;
  kills: number;
  score: number;
  coins: number;
  level: number;
  xp: number;
  xpNext: number;
  dashCooldown: number;
  dashMax: number;
  wave: number;
  onPause: () => void;
  onReload: () => void;
  onWeaponCycle: () => void;
  missions: Mission[];
}

export default function HUD(props: HUDProps) {
  const {
    hp, maxHp, shield, shieldMax, ammo, magSize, weaponName, kills, score, coins,
    level, xp, xpNext, dashCooldown, dashMax, wave, onPause, onReload, onWeaponCycle,
    missions,
  } = props;

  const activeMission = missions.filter((m) => !m.claimed).slice(0, 2);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none">
      {/* Top-left: HP / Shield / Dash */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 w-64">
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1 flex-1">
            {/* Shield bar */}
            <div className="h-2 rounded-full bg-black/50 overflow-hidden border border-cyan-400/40">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all duration-200"
                style={{ width: `${(shield / (shieldMax || 1)) * 100}%` }}
              />
            </div>
            {/* HP bar */}
            <div className={`h-4 rounded-full bg-black/50 overflow-hidden border border-white/20 ${hp <= 30 ? "animate-pulse" : ""}`}>
              <div
                className={`h-full transition-all duration-200 ${
                  hp <= 30 ? "bg-gradient-to-r from-red-600 to-red-400" : "bg-gradient-to-r from-green-600 to-green-400"
                }`}
                style={{ width: `${(hp / maxHp) * 100}%` }}
              />
            </div>
          </div>
          <div className="hud-text text-xs font-bold text-white text-right">
            <div>{Math.ceil(hp)}</div>
            <div className="text-cyan-300">{Math.ceil(shield)}</div>
          </div>
        </div>
        {/* Dash cooldown */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-cyan-300 font-bold tracking-widest">DASH</span>
          <div className="h-1.5 flex-1 rounded-full bg-black/50 overflow-hidden">
            <div
              className="h-full bg-cyan-300 transition-all duration-200"
              style={{ width: `${((dashMax - dashCooldown) / dashMax) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Top-center: Wave + kills + coins */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
        <div className="px-4 py-1 rounded-lg bg-black/50 border border-yellow-400/40 hud-text text-yellow-300 font-display text-sm font-bold tracking-widest">
          WAVE {wave}
        </div>
        <div className="flex items-center gap-4 px-3 py-1 rounded-full bg-black/40 text-xs font-bold hud-text">
          <span className="text-red-300">☠ {kills}</span>
          <span className="text-yellow-300">¢ {coins}</span>
          <span className="text-cyan-300">SCORE {score}</span>
        </div>
      </div>

      {/* Top-right: pause + level */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <div className="px-2.5 py-1 rounded-lg bg-black/50 border border-cyan-400/40 text-cyan-300 font-display text-sm font-bold hud-text text-center">
          <div>LV{level}</div>
          <div className="text-[9px] text-white/70">XP {xp}/{xpNext}</div>
        </div>
        <button
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-lg bg-black/50 border border-white/20 text-white text-lg font-bold hover:bg-black/70"
          onClick={onPause}
        >
          ⏸
        </button>
      </div>

      {/* Bottom-center mini XP bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-64 h-2 rounded-full bg-black/50 overflow-hidden border border-white/10">
        <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-400" style={{ width: `${(xp / xpNext) * 100}%` }} />
      </div>

      {/* Missions panel (right center) */}
      <div className="absolute right-3 top-24 flex flex-col gap-1.5 w-52">
        {activeMission.map((m) => (
          <div key={m.id} className={`rounded-lg border px-2.5 py-1.5 bg-black/50 text-xs lucide ${m.complete ? "border-green-400" : "border-white/15"}`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-white/90 tracking-wide">{m.title}</span>
              {m.complete && <span className="text-green-400 font-bold">✓</span>}
            </div>
            <div className="text-white/50 text-[10px] mt-0.5">
              {m.key === "kill" && "Eliminate hostiles"}
              {m.key === "loot" && "Collect supplies"}
              {m.key === "coin" && "Gather coins"}
              {m.key === "survive" && "Stay in the zone"}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full ${m.complete ? "bg-green-400" : "bg-yellow-400"}`} style={{ width: `${Math.min(100, (m.progress / m.target) * 100)}%` }} />
              </div>
              <span className="text-[9px] text-white/60">{m.progress}/{m.target}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom-right: weapon / ammo */}
      <div className="absolute bottom-3 right-3 flex items-end gap-2">
        <button
          className="pointer-events-auto flex flex-col items-center px-3 py-1.5 rounded-lg bg-black/50 border border-white/15"
          onClick={onReload}
          title="Reload [R]"
        >
          <span className="text-[9px] text-white/60 uppercase tracking-wider">{weaponName}</span>
          <span className="font-display text-2xl font-bold text-yellow-300 hud-text">
            {ammo}<span className="text-white/40 text-base">/{magSize}</span>
          </span>
        </button>
        <button
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-lg bg-black/50 border border-cyan-400/40 text-cyan-300 text-lg font-bold hover:bg-black/70"
          onClick={onWeaponCycle}
          title="Switch weapon [Q]"
        >
          ⇄
        </button>
      </div>
    </div>
  );
}

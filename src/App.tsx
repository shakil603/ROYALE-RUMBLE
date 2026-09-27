import { useCallback, useEffect, useRef, useState } from "react";
import { Award, CreditCard, Crown, Info, Play, RotateCcw, Shield, Sparkles, Volume2, VolumeX } from "lucide-react";
import DeveloperModal from "./components/DeveloperModal";
import HUD from "./components/HUD";
import IntroSplash from "./components/IntroSplash";
import StoreBillingModal from "./components/StoreBillingModal";
import TouchControls from "./components/TouchControls";
import { audio } from "./game/audio";
import { Game, getHighScores } from "./game/engine";
import type { GameStats, HighScore, Mission } from "./game/types";
import { WEAPONS } from "./game/weapons";

type Phase = "menu" | "playing" | "paused" | "gameover";

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [showDevModal, setShowDevModal] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [phase, setPhase] = useState<Phase>("menu");
  const [stats, setStats] = useState<GameStats>({ kills: 0, coins: 0, timeSurvived: 0, level: 1 });
  const [hp, setHp] = useState(100);
  const [maxHp, setMaxHp] = useState(100);
  const [shield, setShield] = useState(0);
  const [shieldMax, setShieldMax] = useState(0);
  const [ammo, setAmmo] = useState(12);
  const [magSize, setMagSize] = useState(12);
  const [weaponName, setWeaponName] = useState("Blazer-9");
  const [dashCooldown, setDashCooldown] = useState(0);
  const [wave, setWave] = useState(0);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [muted, setMuted] = useState(false);
  const [isTouch] = useState(() => "ontouchstart" in window);
  const [name, setName] = useState(() => localStorage.getItem("rr_name") || "");

  // HUD sync from engine (polled)
  useEffect(() => {
    const iv = setInterval(() => {
      const g = gameRef.current;
      if (!g) return;
      const p = g.player;
      setHp(p.hp);
      setMaxHp(p.maxHp);
      setShield(p.shield);
      setShieldMax(p.maxShield);
      setAmmo(p.ammo);
      setMagSize(WEAPONS[p.weapon].magSize);
      setWeaponName(WEAPONS[p.weapon].name);
      setDashCooldown(p.dashCooldown);
      setWave(g.wave);
      setMissions([...g.missions]);
      setStats(g.stats());
    }, 100);
    return () => clearInterval(iv);
  }, []);

  const syncPhaseFromEngine = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    setPhase(g.phase);
    setHighScores(getHighScores());
  }, []);

  // create game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const g = new Game(canvas, { onPhaseChange: syncPhaseFromEngine, onStats: () => {} });
    gameRef.current = g;
    return () => {
      g.running = false;
      cancelAnimationFrame(g.raf);
    };
  }, [syncPhaseFromEngine]);

  const start = useCallback(() => {
    gameRef.current?.setPlayerName(name || "SOLDIER");
    gameRef.current?.start();
    setPhase("playing");
    setHighScores(getHighScores());
  }, [name]);

  const togglePause = useCallback(() => {
    gameRef.current?.togglePause();
  }, []);

  const reload = useCallback(() => gameRef.current?.reload(), []);
  const cycleWeapon = useCallback(() => gameRef.current?.cycleWeaponNext(), []);
  const dash = useCallback(() => gameRef.current?.tryDash(), []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      audio.setMuted(!m);
      return !m;
    });
  }, []);

  const handleAddCoins = (amt: number) => {
    if (gameRef.current) {
      gameRef.current.coins += amt;
    }
    setStats((prev) => ({ ...prev, coins: prev.coins + amt }));
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#070a14] text-white select-none">
      {/* INTRO SPLASH ANIMATION (OWNER & DEVELOPER SHAKIL) */}
      {showIntro && <IntroSplash onComplete={() => setShowIntro(false)} />}

      {/* DEVELOPER MODAL */}
      {showDevModal && <DeveloperModal onClose={() => setShowDevModal(false)} />}

      {/* STORE & ANDROID BILLING MODAL */}
      {showStoreModal && (
        <StoreBillingModal
          coins={stats.coins}
          onAddCoins={handleAddCoins}
          onClose={() => setShowStoreModal(false)}
        />
      )}

      {/* GAME CANVAS */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* TOUCH CONTROLS */}
      {isTouch && phase === "playing" && (
        <TouchControls
          onMove={(x, y) => {
            gameRef.current?.setJoystick(x, y);
          }}
          onMoveEnd={() => gameRef.current?.setJoystick(0, 0)}
          onFire={(a) => {
            if (gameRef.current) {
              gameRef.current.mouseDown = a;
              gameRef.current.setPointerDist(a ? 100 : 0);
            }
          }}
          onDash={dash}
        />
      )}

      {/* HUD */}
      {phase === "playing" && (
        <div className="animate-fade-in">
          <HUD
            hp={hp}
            maxHp={maxHp}
            shield={shield}
            shieldMax={shieldMax}
            ammo={ammo}
            magSize={magSize}
            weaponName={weaponName}
            kills={stats.kills}
            score={gameRef.current ? gameRef.current.score : 0}
            coins={stats.coins}
            level={stats.level}
            xp={gameRef.current ? gameRef.current.xp : 0}
            xpNext={gameRef.current ? gameRef.current.xpNext : 100}
            dashCooldown={dashCooldown}
            dashMax={2.2}
            wave={wave}
            onPause={togglePause}
            onReload={reload}
            onWeaponCycle={cycleWeapon}
            missions={missions}
          />
        </div>
      )}

      {/* START SCREEN */}
      {phase === "menu" && (
        <MenuScreen
          name={name}
          setName={setName}
          onStart={start}
          onMute={toggleMute}
          muted={muted}
          highScores={highScores}
          onOpenDev={() => setShowDevModal(true)}
          onOpenStore={() => setShowStoreModal(true)}
          onReplayIntro={() => setShowIntro(true)}
        />
      )}

      {/* PAUSE */}
      {phase === "paused" && (
        <PauseScreen
          onResume={togglePause}
          onRestart={start}
          muted={muted}
          onMute={toggleMute}
          onOpenDev={() => setShowDevModal(true)}
          onOpenStore={() => setShowStoreModal(true)}
        />
      )}

      {/* GAME OVER */}
      {phase === "gameover" && (
        <GameOverScreen
          score={computeScore(gameRef.current)}
          kills={stats.kills}
          time={stats.timeSurvived}
          wave={wave}
          highScores={highScores}
          onRestart={start}
          onOpenDev={() => setShowDevModal(true)}
          onOpenStore={() => setShowStoreModal(true)}
          onMenu={() => {
            gameRef.current?.reset();
            if (gameRef.current) {
              gameRef.current.phase = "menu";
            }
            setPhase("menu");
          }}
        />
      )}
    </div>
  );
}

function computeScore(g: Game | null): number {
  return g ? g.score : 0;
}

function MenuScreen({
  name,
  setName,
  onStart,
  onMute,
  muted,
  highScores,
  onOpenDev,
  onOpenStore,
  onReplayIntro,
}: {
  name: string;
  setName: (v: string) => void;
  onStart: () => void;
  onMute: () => void;
  muted: boolean;
  highScores: HighScore[];
  onOpenDev: () => void;
  onOpenStore: () => void;
  onReplayIntro: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-gradient-to-b from-[#0a0e1a]/90 via-[#0a0e1a]/70 to-[#0a0e1a]/95 backdrop-blur-sm">
      <div className="animate-float-in flex max-h-full w-full max-w-md flex-col items-center gap-4 overflow-y-auto thin-scroll p-6 text-center">
        {/* DEVELOPER BADGE */}
        <button
          onClick={onOpenDev}
          className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#11192e] border border-yellow-400/50 shadow-lg hover:border-yellow-300 hover:scale-105 active:scale-95 transition"
        >
          <Crown className="w-4 h-4 text-yellow-400 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-bold text-yellow-300 uppercase tracking-widest">
            Developed & Owned by Shakil
          </span>
          <Info className="w-3.5 h-3.5 text-white/50 group-hover:text-white" />
        </button>

        {/* LOGO */}
        <div>
          <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.4em] text-cyan-300 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            Battle Royale Action
          </div>
          <h1 className="font-display text-6xl font-black italic leading-none tracking-tight">
            <span className="bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]">
              ROYALE
            </span>
          </h1>
          <h1 className="font-display text-5xl font-black italic leading-none tracking-tight -mt-1">
            <span className="bg-gradient-to-br from-cyan-300 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">
              RUMBLE
            </span>
          </h1>
        </div>

        <p className="max-w-xs text-xs text-white/65">
          Drop in, loot weapons, eliminate hostiles, and survive the closing storm in Shakil's high-octane 2D arena shooter.
        </p>

        {/* CALLSIGN INPUT */}
        <div className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-left">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50">Soldier Callsign</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase().slice(0, 12))}
            placeholder="SOLDIER"
            className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 font-display text-lg font-bold tracking-widest outline-none focus:border-yellow-400 text-white placeholder-white/30"
          />
        </div>

        {/* PRIMARY ACTION BUTTONS */}
        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={onStart}
            className="animate-pulse-glow w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-yellow-300 to-yellow-500 py-4 font-display text-2xl font-black italic uppercase tracking-wider text-black transition-transform hover:scale-[1.03] active:scale-95 shadow-xl"
          >
            <Play className="w-6 h-6 fill-black" /> Drop In
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onOpenStore}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-950/40 py-2.5 font-display text-sm font-bold uppercase tracking-wider text-cyan-300 hover:bg-cyan-900/50 transition active:scale-95"
            >
              <CreditCard className="w-4 h-4 text-cyan-400" /> Store & Billing
            </button>
            <button
              onClick={onOpenDev}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-yellow-400/40 bg-yellow-950/30 py-2.5 font-display text-sm font-bold uppercase tracking-wider text-yellow-300 hover:bg-yellow-900/40 transition active:scale-95"
            >
              <Award className="w-4 h-4 text-yellow-400" /> Dev Credits
            </button>
          </div>
        </div>

        {/* CONTROLS GUIDE */}
        <div className="grid grid-cols-2 gap-2 w-full text-left text-[11px]">
          <div className="rounded-lg bg-black/40 border border-white/10 p-2.5">
            <div className="mb-1 font-bold text-cyan-300">🎮 KEYBOARD</div>
            <div className="text-white/60 leading-relaxed">
              WASD - Move<br />Mouse - Aim & Shoot<br />Space - Dash<br />R - Reload · Q - Switch
            </div>
          </div>
          <div className="rounded-lg bg-black/40 border border-white/10 p-2.5">
            <div className="mb-1 font-bold text-cyan-300">📱 TOUCH</div>
            <div className="text-white/60 leading-relaxed">
              Left Stick - Move<br />Right Button - Fire<br />Dash Button - Evade
            </div>
          </div>
        </div>

        {/* HIGH SCORES */}
        {highScores.length > 0 && (
          <div className="w-full rounded-xl bg-black/40 border border-white/10 p-3">
            <div className="mb-2 text-center text-[11px] font-bold uppercase tracking-widest text-yellow-300">🏆 Local Leaders</div>
            {highScores.slice(0, 3).map((s, i) => (
              <div key={i} className="flex items-center justify-between py-0.5 text-xs text-white/70">
                <span>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"} {s.name}</span>
                <span className="font-bold text-yellow-300">{s.score} pts</span>
              </div>
            ))}
          </div>
        )}

        {/* FOOTER ACTIONS */}
        <div className="flex items-center justify-center gap-4 text-xs text-white/50 mt-1">
          <button onClick={onMute} className="flex items-center gap-1 hover:text-white transition">
            {muted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{muted ? "Muted" : "Sound On"}</span>
          </button>
          <span>•</span>
          <button onClick={onReplayIntro} className="flex items-center gap-1 hover:text-white transition">
            <RotateCcw className="w-3.5 h-3.5 text-yellow-400" />
            <span>Replay Intro</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function PauseScreen({
  onResume,
  onRestart,
  muted,
  onMute,
  onOpenDev,
  onOpenStore,
}: {
  onResume: () => void;
  onRestart: () => void;
  muted: boolean;
  onMute: () => void;
  onOpenDev: () => void;
  onOpenStore: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="animate-float-in flex w-full max-w-xs flex-col items-center gap-3.5 rounded-2xl border border-white/10 bg-[#0d1322] p-6 text-center">
        <h2 className="font-display text-4xl font-black italic tracking-widest text-cyan-300">PAUSED</h2>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-[10px] font-bold">
          <Crown className="w-3 h-3 text-yellow-400" />
          Developed by Shakil
        </div>

        <button onClick={onResume} className="w-full rounded-xl bg-gradient-to-b from-cyan-400 to-blue-500 py-3 font-display text-xl font-black uppercase tracking-wider text-black hover:scale-[1.03] transition active:scale-95">
          Resume
        </button>
        <button onClick={onOpenStore} className="w-full rounded-xl border border-cyan-400/40 bg-cyan-950/40 py-2.5 font-display text-sm font-bold uppercase tracking-wider text-cyan-300 hover:bg-cyan-900/50 transition">
          Supply Store & Billing
        </button>
        <button onClick={onOpenDev} className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 font-display text-sm font-bold uppercase tracking-wider text-white/80 hover:bg-white/10 transition">
          Developer Info
        </button>
        <button onClick={onRestart} className="w-full rounded-xl border border-red-500/30 bg-red-950/20 py-2.5 font-display text-sm font-bold uppercase tracking-wider text-red-300 hover:bg-red-900/40 transition">
          Restart
        </button>

        <button onClick={onMute} className="text-xs text-white/50 underline hover:text-white mt-1">
          {muted ? "🔇 Sound Off" : "🔊 Sound On"}
        </button>
      </div>
    </div>
  );
}

function GameOverScreen({
  score,
  kills,
  time,
  wave,
  highScores,
  onRestart,
  onOpenDev,
  onOpenStore,
  onMenu,
}: {
  score: number;
  kills: number;
  time: number;
  wave: number;
  highScores: HighScore[];
  onRestart: () => void;
  onOpenDev: () => void;
  onOpenStore: () => void;
  onMenu: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-gradient-to-b from-red-950/60 via-black/70 to-black/80 backdrop-blur-sm p-4">
      <div className="animate-float-in flex w-full max-w-sm flex-col items-center gap-3.5 rounded-2xl border border-red-500/40 bg-[#150d18]/90 p-6 text-center">
        <h2 className="font-display text-5xl font-black italic tracking-widest text-red-500">ELIMINATED</h2>
        <div className="text-white/50 text-xs">Wave {wave} Survival Run · Royale Rumble</div>

        {/* DEVELOPER BADGE */}
        <button
          onClick={onOpenDev}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-[10px] font-bold hover:scale-105 transition"
        >
          <Crown className="w-3 h-3 text-yellow-400" />
          Game Created & Developed by Shakil
        </button>

        <div className="grid w-full grid-cols-3 gap-2">
          <Stat label="Score" value={score} color="text-yellow-300" />
          <Stat label="Kills" value={kills} color="text-red-300" />
          <Stat label="Time" value={`${time.toFixed(0)}s`} color="text-cyan-300" />
        </div>

        {highScores.length > 0 && (
          <div className="w-full rounded-lg bg-black/40 border border-white/10 p-2">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-yellow-300">🏆 Top Records</div>
            {highScores.slice(0, 3).map((s, i) => (
              <div key={i} className="flex items-center justify-between px-1 py-0.5 text-xs text-white/70">
                <span>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"} {s.name}</span>
                <span className="font-bold text-white/90">{s.score}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2 w-full">
          <button onClick={onRestart} className="w-full rounded-xl bg-gradient-to-b from-green-400 to-green-600 py-3 font-display text-lg font-black uppercase tracking-wider text-black hover:scale-[1.02] transition active:scale-95">
            Play Again
          </button>
          <div className="flex gap-2">
            <button onClick={onOpenStore} className="flex-1 rounded-xl border border-cyan-400/30 bg-cyan-950/40 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-cyan-300 hover:bg-cyan-900/40 transition">
              Store
            </button>
            <button onClick={onMenu} className="flex-1 rounded-xl border border-white/20 bg-white/5 py-2.5 font-display text-xs font-bold uppercase text-white/80 hover:bg-white/10 transition">
              Main Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-lg bg-black/40 border border-white/10 py-2">
      <div className={`font-display text-2xl font-black ${color}`}>{value}</div>
      <div className="text-[9px] uppercase tracking-widest text-white/50">{label}</div>
    </div>
  );
}

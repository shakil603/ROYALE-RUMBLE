import React, { useEffect, useState } from "react";
import { Shield, Sparkles, Trophy, User, Zap } from "lucide-react";
import { audio } from "../game/audio";

interface IntroSplashProps {
  onComplete: () => void;
}

export default function IntroSplash({ onComplete }: IntroSplashProps) {
  const [stage, setStage] = useState<"dev" | "title" | "ready">("dev");
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Stage 1: Dev credit "SHAKIL"
    try {
      audio.resume();
      audio.levelup();
    } catch {
      // Audio context might require initial interaction
    }

    const t1 = setTimeout(() => {
      setStage("title");
      try {
        audio.victory();
      } catch {
        // ignore
      }
    }, 1800);

    const t2 = setTimeout(() => {
      setStage("ready");
    }, 3200);

    const t3 = setTimeout(() => {
      handleFinish();
    }, 4200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const handleFinish = () => {
    setFading(true);
    setTimeout(() => {
      onComplete();
    }, 350);
  };

  return (
    <div
      onClick={handleFinish}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070a14] text-white cursor-pointer select-none transition-opacity duration-300 overflow-hidden ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Background Cyber Grid & Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.15)_0,rgba(7,10,20,0.95)_70%,#070a14_100%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* STAGE 1: DEVELOPER ATTRIBUTION */}
      {stage === "dev" && (
        <div className="animate-float-in flex flex-col items-center gap-4 text-center px-4 relative z-10">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 text-xs font-bold uppercase tracking-[0.3em]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            Created & Developed By
          </div>

          <div className="relative group my-2">
            <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 via-cyan-400 to-yellow-400 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />
            <div className="relative flex items-center gap-3 px-8 py-4 bg-[#0d1322] border-2 border-yellow-400/80 rounded-2xl shadow-2xl">
              <User className="w-8 h-8 text-yellow-400" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-white/50 uppercase tracking-widest font-mono font-semibold">Game Owner & Lead Engineer</span>
                <span className="font-display text-4xl sm:text-5xl font-black italic tracking-wider bg-gradient-to-r from-yellow-300 via-white to-yellow-400 bg-clip-text text-transparent">
                  SHAKIL
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs text-white/50 tracking-widest uppercase flex items-center gap-2">
            <span>Official Release</span>
            <span className="w-1 h-1 rounded-full bg-cyan-400" />
            <span>Studio Edition</span>
          </div>
        </div>
      )}

      {/* STAGE 2: GAME TITLE & BRANDING WITH NEW APP ICON */}
      {(stage === "title" || stage === "ready") && (
        <div className="animate-float-in flex flex-col items-center gap-3 text-center px-4 relative z-10">
          <div className="relative mb-1">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-yellow-400 to-cyan-400 blur-md opacity-80 animate-pulse" />
            <img
              src="/src/assets/images/royale_rumble_icon_1790517303961.jpg"
              alt="Royale Rumble App Icon"
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-yellow-400/80 shadow-2xl object-cover"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.4em] text-cyan-400">
            <Shield className="w-4 h-4 text-cyan-400" />
            SHAKIL PRESENTS
          </div>

          <div className="flex flex-col items-center">
            <h1 className="font-display text-5xl sm:text-6xl font-black italic leading-none tracking-tight">
              <span className="bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-500 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(250,204,21,0.6)]">
                ROYALE
              </span>
            </h1>
            <h1 className="font-display text-4xl sm:text-5xl font-black italic leading-none tracking-tight -mt-1">
              <span className="bg-gradient-to-br from-cyan-300 via-cyan-400 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(34,211,238,0.6)]">
                RUMBLE
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-4 mt-2 px-4 py-1.5 rounded-full bg-black/60 border border-white/10 text-xs text-white/80">
            <div className="flex items-center gap-1 text-yellow-400">
              <Trophy className="w-3.5 h-3.5" />
              <span>Dev: Shakil</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <div className="flex items-center gap-1 text-cyan-300">
              <Zap className="w-3.5 h-3.5" />
              <span>Battle Royale</span>
            </div>
          </div>
        </div>
      )}

      {/* Skip button prompt */}
      <div className="absolute bottom-8 flex flex-col items-center gap-1 text-white/40 text-[11px] uppercase tracking-widest animate-pulse">
        <span>Tap anywhere to continue</span>
        <div className="w-8 h-1 rounded-full bg-white/20" />
      </div>
    </div>
  );
}

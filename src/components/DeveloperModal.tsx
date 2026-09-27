import React from "react";
import { Award, Code, Crown, Heart, ShieldCheck, Sparkles, Terminal, User, X } from "lucide-react";

interface DeveloperModalProps {
  onClose: () => void;
}

export default function DeveloperModal({ onClose }: DeveloperModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-md rounded-2xl border border-yellow-400/40 bg-gradient-to-b from-[#0e1628] to-[#070a14] p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto thin-scroll animate-float-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Avatar & Title */}
        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400 blur-sm opacity-80 animate-pulse" />
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-[#151f38] border-2 border-yellow-400 text-yellow-400">
              <Crown className="w-10 h-10" />
            </div>
          </div>

          <h2 className="mt-3 font-display text-3xl font-black italic tracking-wide bg-gradient-to-r from-yellow-300 via-white to-yellow-400 bg-clip-text text-transparent">
            SHAKIL
          </h2>
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mt-0.5">
            Game Owner & Lead Software Engineer
          </span>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Creator of Royale Rumble
          </div>
        </div>

        {/* Developer Info Card */}
        <div className="space-y-3 text-sm">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-300 mb-1.5">
              <User className="w-4 h-4" /> About the Creator
            </div>
            <p className="text-xs leading-relaxed text-white/70">
              <strong className="text-white font-semibold">Shakil</strong> is the sole architect, designer, and developer behind <strong className="text-yellow-300">Royale Rumble</strong>. Built from the ground up with custom 2D physics, high-octane battle royale gameplay mechanics, responsive touch controls, and automated mobile APK packaging.
            </p>
          </div>

          {/* Technical Specs */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl border border-white/10 bg-black/40 p-3">
              <div className="flex items-center gap-1.5 text-yellow-400 font-bold mb-1">
                <Code className="w-3.5 h-3.5" /> Engine
              </div>
              <div className="text-white/60">Custom 60FPS Canvas Physics & Procedural Audio</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold mb-1">
                <Terminal className="w-3.5 h-3.5" /> Build Target
              </div>
              <div className="text-white/60">Web & Android APK (Google Play Billing Ready)</div>
            </div>
          </div>

          {/* Credits Highlights */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-yellow-300 mb-2">
              <Award className="w-4 h-4" /> Production Credits
            </div>
            <div className="space-y-1.5 text-xs text-white/70">
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-white/50">Director & Producer:</span>
                <span className="font-bold text-white">Shakil</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-white/50">Lead Gameplay Programmer:</span>
                <span className="font-bold text-white">Shakil</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-white/50">Combat & Balancing:</span>
                <span className="font-bold text-white">Shakil</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Audio & Visuals:</span>
                <span className="font-bold text-white">Shakil</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-5 text-center">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 py-3 font-display text-lg font-black uppercase tracking-wider text-black hover:scale-[1.02] active:scale-95 transition"
          >
            Back to Game
          </button>
          <div className="mt-2 text-[10px] text-white/40 flex items-center justify-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3 h-3 text-red-400 fill-red-400" />
            <span>by Shakil · All Rights Reserved</span>
          </div>
        </div>
      </div>
    </div>
  );
}

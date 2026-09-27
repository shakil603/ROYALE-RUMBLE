import React from "react";
import { CheckCircle2, Download, ExternalLink, Github, Smartphone, Sparkles, X } from "lucide-react";

interface ApkDownloadModalProps {
  onClose: () => void;
}

export default function ApkDownloadModal({ onClose }: ApkDownloadModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-md rounded-2xl border border-green-400/40 bg-gradient-to-b from-[#0d1e16] to-[#070a14] p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto thin-scroll animate-float-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <img
            src="/src/assets/images/royale_rumble_icon_1790517303961.jpg"
            alt="Royale Rumble App Icon"
            className="w-14 h-14 rounded-xl border border-green-400/50 shadow-md object-cover shrink-0"
          />
          <div>
            <h2 className="font-display text-2xl font-black italic tracking-wide text-white">
              ANDROID APK BUILD
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-green-300 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Developed & Owned by Shakil</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-white/70 leading-relaxed mb-4">
          আপনার গেমটির জন্য ফুল <strong className="text-green-300">Android APK Build System</strong> রেডি করা হয়েছে। GitHub Actions এ কোড পুশ হওয়ার সাথে সাথে স্বয়ংক্রিয়ভাবে <strong className="text-yellow-300">RoyaleRumble-Shakil.apk</strong> ফাইল তৈরি হয়ে যাবে।
        </p>

        {/* Steps to Download APK */}
        <div className="space-y-2.5 text-xs">
          <div className="rounded-xl border border-white/10 bg-black/40 p-3 flex gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-400/40 text-green-400 flex items-center justify-center font-bold shrink-0">
              ১
            </div>
            <div>
              <strong className="text-white block font-bold">GitHub Repository খুলুন</strong>
              <span className="text-white/60 text-[11px]">আপনার GitHub রেপোজিটোরির <strong className="text-cyan-300">"Actions"</strong> ট্যাবে যান।</span>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/40 p-3 flex gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-400/40 text-green-400 flex items-center justify-center font-bold shrink-0">
              ২
            </div>
            <div>
              <strong className="text-white block font-bold">Build Workflow রান করুন</strong>
              <span className="text-white/60 text-[11px]">"Build Royale Rumble Android APK" সিলেক্ট করে "Run workflow" ক্লিক করুন।</span>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/40 p-3 flex gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-400/40 text-green-400 flex items-center justify-center font-bold shrink-0">
              ৩
            </div>
            <div>
              <strong className="text-white block font-bold">APK সরাসরি ডাউনলোড করুন</strong>
              <span className="text-white/60 text-[11px]">বিল্ড শেষ হলে নিচে <strong className="text-yellow-300">RoyaleRumble-APK-Files.zip</strong> পাবেন। আনজিপ করে সরাসরি ফোনে ইনস্টল করে খেলুন!</span>
            </div>
          </div>
        </div>

        {/* APK Features */}
        <div className="mt-4 rounded-xl border border-green-500/20 bg-green-950/20 p-3 text-[11px] text-white/70 space-y-1">
          <div className="flex items-center gap-1.5 text-green-300 font-bold mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span>APK কনফিগারেশন ডিটেইলস:</span>
          </div>
          <div>• Package Name: <strong className="text-white font-mono">com.shakil.royalerumble</strong></div>
          <div>• App Name: <strong className="text-white">Royale Rumble (Shakil Edition)</strong></div>
          <div>• Target Android: <strong className="text-white">Android 7.0 to Android 14+ (Full Screen)</strong></div>
          <div>• Touch Controls: <strong className="text-white">Native Joystick + Smooth 60 FPS</strong></div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-green-400 to-green-600 py-3 font-display text-lg font-black uppercase tracking-wider text-black hover:scale-[1.02] active:scale-95 transition"
        >
          বুঝেছি / Close
        </button>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { Check, Coins, CreditCard, Flame, Gift, Package, RotateCcw, Shield, Sparkles, Smartphone, X, Zap } from "lucide-react";
import { audio } from "../game/audio";
import { BILLING_CATALOG, type BillingProduct, inAppBilling, type PurchaseResult } from "../services/billing";

interface StoreBillingModalProps {
  coins: number;
  onAddCoins: (amt: number) => void;
  onClose: () => void;
}

export default function StoreBillingModal({ coins, onAddCoins, onClose }: StoreBillingModalProps) {
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const isAndroid = inAppBilling.isNativeAndroid();
  const isVip = inAppBilling.isVipUnlocked();
  const isArsenal = inAppBilling.isArsenalUnlocked();

  useEffect(() => {
    const unsub = inAppBilling.onPurchaseUpdate((res: PurchaseResult) => {
      setPurchasingId(null);
      if (res.success) {
        if (res.coinsAwarded > 0) {
          onAddCoins(res.coinsAwarded);
        }
        audio.levelup();
        setFeedback({ type: "success", text: res.message });
      } else {
        setFeedback({ type: "error", text: res.message });
      }
      setTimeout(() => setFeedback(null), 4000);
    });

    return () => unsub();
  }, [onAddCoins]);

  const handleBuy = async (prod: BillingProduct) => {
    setPurchasingId(prod.id);
    audio.resume();
    audio.reload();

    try {
      const res = await inAppBilling.buyProduct(prod);
      if (!isAndroid && res.success) {
        onAddCoins(res.coinsAwarded);
        audio.levelup();
        setFeedback({ type: "success", text: res.message });
        setPurchasingId(null);
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch {
      setPurchasingId(null);
      setFeedback({ type: "error", text: "Transaction canceled or interrupted." });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleRestore = () => {
    const { restoredCount } = inAppBilling.restorePurchases();
    audio.pickup();
    setFeedback({
      type: "success",
      text: restoredCount > 0 ? `Restored ${restoredCount} in-app purchase items!` : "No previous purchases found to restore.",
    });
    setTimeout(() => setFeedback(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-lg rounded-2xl border border-cyan-400/40 bg-gradient-to-b from-[#0e1628] to-[#070a14] p-6 shadow-2xl text-white max-h-[92vh] overflow-y-auto thin-scroll animate-float-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-400">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-black italic tracking-wide text-white">
              IN-APP BILLING STORE
            </h2>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <span className="flex items-center gap-1 text-cyan-300">
                <Smartphone className="w-3.5 h-3.5" />
                {isAndroid ? "Google Play Billing Connected" : "Billing Bridge Active"}
              </span>
              <span>•</span>
              <span className="text-yellow-400 font-bold">Gold: ¢{coins}</span>
            </div>
          </div>
        </div>

        {/* Active Perks Banner */}
        {(isVip || isArsenal) && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-2.5 text-xs text-yellow-300">
            <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
            <div className="flex gap-2">
              {isVip && <span className="font-bold">★ SHAKIL VIP PASS ACTIVE</span>}
              {isArsenal && <span className="font-bold">★ ARSENAL BUNDLE ACTIVE</span>}
            </div>
          </div>
        )}

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mb-4 flex items-center gap-2 rounded-xl border p-3 text-xs animate-float-in ${
              feedback.type === "success"
                ? "border-green-400/40 bg-green-500/10 text-green-300"
                : "border-red-400/40 bg-red-500/10 text-red-300"
            }`}
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Catalog Items */}
        <div className="space-y-3">
          {BILLING_CATALOG.map((item) => {
            const isOwnedPass = (item.id === "vip_soldier_pass" && isVip) || (item.id === "arsenal_bundle" && isArsenal);

            return (
              <div
                key={item.id}
                className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4 transition ${
                  item.popular
                    ? "border-yellow-400/60 bg-gradient-to-r from-yellow-400/10 via-black/40 to-black/60 shadow-lg shadow-yellow-500/5"
                    : "border-white/10 bg-black/40 hover:border-white/20"
                }`}
              >
                {item.popular && (
                  <div className="absolute -top-2.5 right-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-black shadow">
                    ★ MOST POPULAR ★
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-yellow-400 mt-0.5">
                    {item.icon === "coins" && <Coins className="w-5 h-5" />}
                    {item.icon === "flame" && <Flame className="w-5 h-5 text-orange-400" />}
                    {item.icon === "zap" && <Zap className="w-5 h-5 text-cyan-400" />}
                    {item.icon === "package" && <Package className="w-5 h-5 text-purple-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white tracking-wide text-sm">{item.name}</span>
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-yellow-300">
                        {item.bonus}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/60 mt-0.5 max-w-xs">{item.description}</p>
                    <div className="text-[10px] text-cyan-300 font-mono mt-1">
                      SKU: {item.sku}
                    </div>
                  </div>
                </div>

                <button
                  disabled={purchasingId === item.id || isOwnedPass}
                  onClick={() => handleBuy(item)}
                  className={`shrink-0 rounded-xl px-4 py-2.5 font-display text-sm font-black uppercase tracking-wider text-black transition-all hover:scale-105 active:scale-95 ${
                    isOwnedPass
                      ? "bg-green-500/30 text-green-300 border border-green-400/40 cursor-default"
                      : item.popular
                      ? "bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-md shadow-yellow-400/20"
                      : "bg-cyan-400 hover:bg-cyan-300"
                  }`}
                >
                  {isOwnedPass ? "✓ Unlocked" : purchasingId === item.id ? "Processing..." : `Buy for ${item.price}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Actions & Restore Purchases */}
        <div className="mt-5 flex items-center justify-between pt-3 border-t border-white/10 text-xs">
          <button
            onClick={handleRestore}
            className="flex items-center gap-1.5 text-white/50 hover:text-cyan-300 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Purchases</span>
          </button>
          <div className="text-[11px] text-white/40">
            Play Billing 7.0 Ready · Shakil Edition
          </div>
        </div>
      </div>
    </div>
  );
}

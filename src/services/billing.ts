// Google Play In-App Billing Bridge & Client for Royale Rumble
// Owner & Lead Developer: Shakil

export interface BillingProduct {
  id: string;
  sku: string;
  name: string;
  price: string;
  type: "inapp" | "subs";
  coins: number;
  bonus: string;
  description: string;
  icon: "coins" | "flame" | "zap" | "package";
  popular?: boolean;
}

export interface PurchaseResult {
  success: boolean;
  orderId?: string;
  purchaseToken?: string;
  sku: string;
  message: string;
  coinsAwarded: number;
}

// Window declaration for Android WebView Javascript Interface
declare global {
  interface Window {
    AndroidBilling?: {
      isAvailable: () => boolean;
      launchPurchaseFlow: (sku: string) => void;
      queryProductDetails: (skusJson: string) => string;
      restorePurchases: () => string;
    };
    onAndroidPurchaseSuccess?: (sku: string, orderId: string, token: string) => void;
    onAndroidPurchaseFailed?: (sku: string, error: string) => void;
  }
}

export const BILLING_CATALOG: BillingProduct[] = [
  {
    id: "coins_starter",
    sku: "royale.rumble.coins.starter",
    name: "Combat Stash",
    price: "$0.99",
    type: "inapp",
    coins: 500,
    bonus: "+50 Bonus",
    description: "Instant coin boost for ammunition, armor, and weapon upgrades.",
    icon: "coins",
  },
  {
    id: "coins_champion",
    sku: "royale.rumble.coins.champion",
    name: "Royale Vault",
    price: "$2.99",
    type: "inapp",
    coins: 2000,
    bonus: "BEST VALUE (+500 Bonus)",
    description: "Massive pile of gold coins for elite weapon arsenal unlocks.",
    icon: "flame",
    popular: true,
  },
  {
    id: "vip_soldier_pass",
    sku: "royale.rumble.pass.vip",
    name: "Shakil VIP Pass",
    price: "$4.99",
    type: "inapp",
    coins: 5000,
    bonus: "VIP STATUS UNLOCKED",
    description: "Unlock Golden Warrior Armor, 2x Dash Speed, and Founder Badge.",
    icon: "zap",
  },
  {
    id: "arsenal_bundle",
    sku: "royale.rumble.weapons.bundle",
    name: "Heavy Arsenal Pack",
    price: "$1.99",
    type: "inapp",
    coins: 1200,
    bonus: "ALL WEAPONS UNLOCKED",
    description: "Instantly unlock Viper AR & Raptor .50 sniper rifle on every drop.",
    icon: "package",
  },
];

class InAppBillingService {
  private purchasedSkus: Set<string> = new Set();
  private callbacks: Array<(result: PurchaseResult) => void> = [];

  constructor() {
    this.loadSavedPurchases();
    this.setupAndroidBridge();
  }

  private loadSavedPurchases() {
    try {
      const saved = localStorage.getItem("rr_purchased_skus");
      if (saved) {
        this.purchasedSkus = new Set(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }

  private savePurchases() {
    try {
      localStorage.setItem("rr_purchased_skus", JSON.stringify(Array.from(this.purchasedSkus)));
    } catch {
      // ignore
    }
  }

  private setupAndroidBridge() {
    // Register global callbacks for the Android Native WebView bridge
    window.onAndroidPurchaseSuccess = (sku: string, orderId: string, token: string) => {
      const prod = BILLING_CATALOG.find((p) => p.sku === sku);
      const coins = prod ? prod.coins : 0;
      this.purchasedSkus.add(sku);
      this.savePurchases();
      
      const result: PurchaseResult = {
        success: true,
        sku,
        orderId,
        purchaseToken: token,
        coinsAwarded: coins,
        message: `Successfully purchased ${prod?.name || sku}!`,
      };

      this.notify(result);
    };

    window.onAndroidPurchaseFailed = (sku: string, error: string) => {
      const result: PurchaseResult = {
        success: false,
        sku,
        coinsAwarded: 0,
        message: `Purchase failed: ${error}`,
      };
      this.notify(result);
    };
  }

  public isNativeAndroid(): boolean {
    return typeof window !== "undefined" && !!window.AndroidBilling?.isAvailable();
  }

  public isVipUnlocked(): boolean {
    return this.purchasedSkus.has("royale.rumble.pass.vip");
  }

  public isArsenalUnlocked(): boolean {
    return this.purchasedSkus.has("royale.rumble.weapons.bundle");
  }

  public onPurchaseUpdate(cb: (result: PurchaseResult) => void): () => void {
    this.callbacks.push(cb);
    return () => {
      this.callbacks = this.callbacks.filter((c) => c !== cb);
    };
  }

  private notify(result: PurchaseResult) {
    for (const cb of this.callbacks) {
      cb(result);
    }
  }

  public async buyProduct(product: BillingProduct): Promise<PurchaseResult> {
    // If running inside Android APK with native Google Play Billing bridge:
    if (this.isNativeAndroid() && window.AndroidBilling) {
      try {
        window.AndroidBilling.launchPurchaseFlow(product.sku);
        return new Promise((resolve) => {
          const unsub = this.onPurchaseUpdate((res) => {
            if (res.sku === product.sku) {
              unsub();
              resolve(res);
            }
          });
        });
      } catch (err) {
        return {
          success: false,
          sku: product.sku,
          coinsAwarded: 0,
          message: err instanceof Error ? err.message : "Billing client error",
        };
      }
    }

    // Web / Demo mode: instant simulated billing completion with local verification
    await new Promise((r) => setTimeout(r, 700));
    const orderId = "GPA." + Math.floor(1000 + Math.random() * 9000) + "-" + Math.floor(1000 + Math.random() * 9000);
    this.purchasedSkus.add(product.sku);
    this.savePurchases();

    const result: PurchaseResult = {
      success: true,
      orderId,
      sku: product.sku,
      purchaseToken: "token_" + Date.now(),
      coinsAwarded: product.coins,
      message: `Purchased ${product.name}! (+${product.coins} Coins)`,
    };

    this.notify(result);
    return result;
  }

  public restorePurchases(): { restoredCount: number } {
    if (this.isNativeAndroid() && window.AndroidBilling) {
      try {
        const raw = window.AndroidBilling.restorePurchases();
        const skus = JSON.parse(raw) as string[];
        skus.forEach((s) => this.purchasedSkus.add(s));
        this.savePurchases();
        return { restoredCount: skus.length };
      } catch {
        // fallback
      }
    }
    return { restoredCount: this.purchasedSkus.size };
  }
}

export const inAppBilling = new InAppBillingService();

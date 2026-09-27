package com.shakil.royalerumble;

import android.app.Activity;
import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.annotation.NonNull;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ConsumeParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;

import org.json.JSONArray;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Google Play Billing Client 7.0 Manager for Royale Rumble.
 * Developed by Shakil.
 */
public class BillingManager implements PurchasesUpdatedListener {
    private static final String TAG = "RoyaleRumbleBilling";
    private final Activity activity;
    private final WebView webView;
    private BillingClient billingClient;
    private final Map<String, ProductDetails> productDetailsMap = new HashMap<>();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    public BillingManager(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
        initBilling();
    }

    private void initBilling() {
        billingClient = BillingClient.newBuilder(activity)
                .setListener(this)
                .enablePendingPurchases()
                .build();

        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(@NonNull BillingResult billingResult) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    Log.d(TAG, "Google Play Billing Client Connected Successfully!");
                    queryAvailableProducts();
                } else {
                    Log.e(TAG, "Billing setup error: " + billingResult.getDebugMessage());
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                Log.w(TAG, "Billing Service Disconnected. Reconnecting...");
                // Retry connection
            }
        });
    }

    private void queryAvailableProducts() {
        List<QueryProductDetailsParams.Product> productList = new ArrayList<>();
        String[] skus = {
                "royale.rumble.coins.starter",
                "royale.rumble.coins.champion",
                "royale.rumble.pass.vip",
                "royale.rumble.weapons.bundle"
        };

        for (String sku : skus) {
            productList.add(
                    QueryProductDetailsParams.Product.newBuilder()
                            .setProductId(sku)
                            .setProductType(BillingClient.ProductType.INAPP)
                            .build()
            );
        }

        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(productList)
                .build();

        billingClient.queryProductDetailsAsync(params, (billingResult, productDetailsList) -> {
            if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                for (ProductDetails details : productDetailsList) {
                    productDetailsMap.put(details.getProductId(), details);
                }
                Log.d(TAG, "Loaded " + productDetailsMap.size() + " in-app billing products.");
            }
        });
    }

    // ----------------- Javascript Interface Bridge -----------------

    @JavascriptInterface
    public boolean isAvailable() {
        return billingClient != null && billingClient.isReady();
    }

    @JavascriptInterface
    public void launchPurchaseFlow(String productId) {
        mainHandler.post(() -> {
            ProductDetails details = productDetailsMap.get(productId);
            if (details == null) {
                notifyWebFailed(productId, "Product not found or billing not ready");
                return;
            }

            List<BillingFlowParams.ProductDetailsParams> productDetailsParamsList = new ArrayList<>();
            productDetailsParamsList.add(
                    BillingFlowParams.ProductDetailsParams.newBuilder()
                            .setProductDetails(details)
                            .build()
            );

            BillingFlowParams billingFlowParams = BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(productDetailsParamsList)
                    .build();

            BillingResult result = billingClient.launchBillingFlow(activity, billingFlowParams);
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                notifyWebFailed(productId, result.getDebugMessage());
            }
        });
    }

    @JavascriptInterface
    public String restorePurchases() {
        final List<String> ownedSkus = new ArrayList<>();
        if (billingClient != null && billingClient.isReady()) {
            billingClient.queryPurchasesAsync(
                    QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(),
                    (billingResult, purchases) -> {
                        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                            for (Purchase p : purchases) {
                                if (p.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                                    ownedSkus.addAll(p.getProducts());
                                }
                            }
                        }
                    }
            );
        }
        return new JSONArray(ownedSkus).toString();
    }

    @Override
    public void onPurchasesUpdated(@NonNull BillingResult billingResult, List<Purchase> purchases) {
        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (Purchase purchase : purchases) {
                handlePurchase(purchase);
            }
        } else if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            notifyWebFailed("unknown", "User cancelled purchase");
        } else {
            notifyWebFailed("unknown", billingResult.getDebugMessage());
        }
    }

    private void handlePurchase(Purchase purchase) {
        if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
            // For consumable coin packs, consume purchase so user can buy again:
            ConsumeParams consumeParams = ConsumeParams.newBuilder()
                    .setPurchaseToken(purchase.getPurchaseToken())
                    .build();

            billingClient.consumeAsync(consumeParams, (billingResult, s) -> {
                for (String sku : purchase.getProducts()) {
                    notifyWebSuccess(sku, purchase.getOrderId(), purchase.getPurchaseToken());
                }
            });
        }
    }

    private void notifyWebSuccess(String sku, String orderId, String token) {
        mainHandler.post(() -> {
            String js = String.format("window.onAndroidPurchaseSuccess && window.onAndroidPurchaseSuccess('%s', '%s', '%s');",
                    sku, orderId != null ? orderId : "GPA-OFFLINE", token);
            webView.evaluateJavascript(js, null);
        });
    }

    private void notifyWebFailed(String sku, String error) {
        mainHandler.post(() -> {
            String js = String.format("window.onAndroidPurchaseFailed && window.onAndroidPurchaseFailed('%s', '%s');",
                    sku, error != null ? error : "Unknown error");
            webView.evaluateJavascript(js, null);
        });
    }
}

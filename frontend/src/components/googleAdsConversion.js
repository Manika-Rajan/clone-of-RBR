// RBR/frontend/src/components/googleAdsConversion.js

export const triggerRbrPurchaseConversion = (value = 2249) => {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "conversion", {
      send_to: "AW-824378442/NWTVCJbO_bobEMqIjIkD",
      value: value,
      currency: "INR",
      // Optionally pass a real transaction_id if you have it
    });
    console.log("✅ RBR Google Ads purchase conversion fired");
  } else {
    console.warn("⚠️ gtag is not available – conversion not fired");
  }
};

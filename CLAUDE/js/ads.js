/**
 * ads.js — AdSense placeholder (MVP)
 */
const Ads = (() => {
  const ADSENSE_ENABLED = false;

  function init() {
    if (!ADSENSE_ENABLED) return;
    // When enabled, inject AdSense script and configure ad slots
    // For now, placeholders are in the HTML
  }

  function showAd(slotId) {
    const slot = document.getElementById(slotId);
    if (!slot) return;
    slot.style.display = 'flex';
    if (ADSENSE_ENABLED) {
      // (adsbygoogle = window.adsbygoogle || []).push({});
    }
  }

  function hideAd(slotId) {
    const slot = document.getElementById(slotId);
    if (!slot) return;
    slot.style.display = 'none';
  }

  return { init, showAd, hideAd, ADSENSE_ENABLED };
})();

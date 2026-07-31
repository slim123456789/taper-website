// iab.js — break out of Instagram/Facebook in-app browsers to the native
// browser so iOS App Store links work. One reusable module (window.IAB).
(function () {
  var APP_STORE_URL = 'https://apps.apple.com/us/app/taper-swim/id6764488000';
  var ua = navigator.userAgent || navigator.vendor || '';

  // --- Environment detection ---
  function isInstagram() { return /Instagram/i.test(ua); }
  function isThreads()   { return /Barcelona/i.test(ua); }
  function isFacebook()  { return /FBAN|FBAV|FB_IAB|FB4A|FBIOS|Messenger/i.test(ua); }
  function isOtherInApp(){ return /Line\/|Snapchat|Pinterest|musical_ly|Musically|BytedanceWebview|TikTok|Twitter|WhatsApp/i.test(ua); }
  function isInApp()     { return isInstagram() || isThreads() || isFacebook() || isOtherInApp(); }
  function isIOS()       { return /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
  function isAndroid()   { return /Android/i.test(ua); }

  // --- Break out of the in-app webview to the native browser ---
  // On iOS this ideally runs synchronously inside a user gesture; auto-firing on
  // load may be dropped by the OS, which is why callers always pass a fallback.
  // Returns true if a break-out was attempted.
  function breakOut() {
    if (isIOS()) {
      if (isInstagram() || isThreads()) {
        // The IG/Threads app intercepts this scheme and re-opens the URL in Safari.
        location.href = 'instagram://extbrowser/?url=' + encodeURIComponent(APP_STORE_URL);
        return true;
      }
      if (isFacebook()) {
        window.open('x-safari-' + APP_STORE_URL, '_blank');
        return true;
      }
      return false; // other iOS in-app browsers: no reliable scheme → manual steps
    }
    if (isAndroid()) {
      location.href = 'intent://' + APP_STORE_URL.replace(/^https?:\/\//, '') + '#Intent;scheme=https;end';
      return true;
    }
    return false;
  }

  // Fire breakOut(); if we don't actually leave within `wait` ms, call onFail().
  function attemptDownload(onFail, wait) {
    if (!breakOut()) { if (onFail) onFail(); return; }
    var done = false;
    function leaving() { done = true; }
    window.addEventListener('pagehide', leaving, { once: true });
    window.addEventListener('blur', leaving, { once: true });
    document.addEventListener('visibilitychange', function () { if (document.hidden) leaving(); }, { once: true });
    setTimeout(function () { if (!done && onFail) onFail(); }, wait || 1500);
  }

  // Copy the App Store link to the clipboard (with a legacy fallback).
  function copy(onDone) {
    function ok() { if (onDone) onDone(); }
    function legacy() {
      try {
        var ta = document.createElement('textarea');
        ta.value = APP_STORE_URL; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.focus(); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta); ok();
      } catch (e) {}
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(APP_STORE_URL).then(ok).catch(legacy);
    } else { legacy(); }
  }

  window.IAB = {
    APP_STORE_URL: APP_STORE_URL,
    isInApp: isInApp, isIOS: isIOS, isAndroid: isAndroid,
    isInstagram: isInstagram, isFacebook: isFacebook,
    breakOut: breakOut, attemptDownload: attemptDownload, copy: copy
  };
})();

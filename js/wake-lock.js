/**
 * Keeps the screen awake while the app is on the table between rounds.
 *
 * Screen Wake Lock API - native, no dependency. Safari from iOS 16.4, Chrome from 84.
 * Needs a secure context, so it works on the deployed site and on localhost, but not
 * over a LAN address - the same limitation as the service worker.
 *
 * Everything here fails silently on purpose: an unsupported browser or iOS low power
 * mode must cost nothing more than a screen that dims as usual.
 */
let lock = null;

async function acquire() {
  if (!('wakeLock' in navigator) || lock) return;
  try {
    lock = await navigator.wakeLock.request('screen');
    // The browser also drops the lock on its own; keep our handle honest.
    lock.addEventListener('release', () => { lock = null; });
  } catch {
    // Unsupported, denied, or low power mode - nothing to do about it.
    lock = null;
  }
}

export function keepScreenAwake() {
  acquire();

  // The lock is released automatically whenever the page is hidden - switching apps or
  // locking the phone. Without re-acquiring, it would work exactly once.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') acquire();
  });
}

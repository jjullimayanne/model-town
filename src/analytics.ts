/**
 * Privacy-friendly analytics with GoatCounter (no cookies, no personal data).
 * Only active in production builds, never on localhost, and skipped when the browser sends Do Not Track.
 * Events are plain names ("step/clean_data") so we can see where players drop off in the quest.
 */

/** Your GoatCounter site code: https://<code>.goatcounter.com. Empty = analytics disabled. */
export const GOATCOUNTER_CODE = 'julli';

type GoatCounter = { count: (vars: { path: string; title?: string; event?: boolean }) => void };
declare global {
  interface Window { goatcounter?: GoatCounter & { no_onload?: boolean; allow_local?: boolean } }
}

const enabled = (() => {
  if (!import.meta.env.PROD || !GOATCOUNTER_CODE) return false;
  try {
    if (navigator.doNotTrack === '1') return false;
    if (/^(localhost|127\.|\[::1\])/.test(location.hostname)) return false;
  } catch {
    return false;
  }
  return true;
})();

const queue: string[] = [];

function flush() {
  const gc = window.goatcounter;
  if (!gc?.count) return;
  while (queue.length) gc.count({ path: queue.shift()!, event: true });
}

/** Loads the counter once; it also records the page view. */
export function initAnalytics() {
  if (!enabled || document.getElementById('goatcounter-js')) return;
  const s = document.createElement('script');
  s.id = 'goatcounter-js';
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.dataset.goatcounter = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`;
  s.onload = flush;
  document.head.appendChild(s);
}

/** Records an anonymous event, e.g. track('step/clean_data'). Safe to call anytime. */
export function track(event: string) {
  if (!enabled) return;
  queue.push(event);
  flush();
}

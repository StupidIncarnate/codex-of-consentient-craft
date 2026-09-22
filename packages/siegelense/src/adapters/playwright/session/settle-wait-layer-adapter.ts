/**
 * PURPOSE: Ends a wait when the page has actually SETTLED rather than when a timer expires — the
 * three-signal detector `playwrightSessionAdapter` exposes as `waitForSettle`. This half owns the
 * page-side source strings and the request bookkeeping; `settlePollLayerAdapter` owns the poll
 * itself. Reach for this over a fixed pause after an action: a pause both wastes the seconds a fast
 * page did not need and reads the DOM mid-update on a slow one, and neither failure shows up in the
 * reading it produces. Reach for `waitForMatch`/`waitForPredicate` instead whenever you can name
 * the ONE thing you are waiting for — this answers the weaker question "has everything stopped
 * moving", which is what a screenshot or a whole-screen key read needs and a locator wait cannot
 * express.
 *
 * **The polling discount is the whole difficulty.** A dev tool's page issues the same background
 * request forever, so "wait for network idle" never fires and every step burns its full ceiling. A
 * shape (`settleRequestShapeTransformer`: method + origin + path, query dropped) that has STARTED
 * `pollerRepeatThreshold` times is classified background noise and stops counting as work. The cost
 * of that rule is named here so nobody re-litigates it silently: a user action that legitimately
 * re-issues the SAME shape a fourth time stops being waited on, and the step's own assertion — not
 * this detector — is what catches that. The cost of NOT having it is every step on every polling
 * app hanging to its ceiling.
 *
 * `eventsource` and `websocket` requests never enter the count at all. They are opened once and
 * held open by design, so a pending tally including them would never reach zero, and the repeat
 * threshold would not save it either — one long-lived stream is not a repeating shape.
 *
 * The three signals:
 * - **network** — nothing non-discounted in flight, and nothing started or finished for the quiet
 *   window. Built on the request stream `playwright-session-adapter.ts` already owns: that file
 *   calls `noteRequestSettled` from inside its existing `page.on('response')` and
 *   `page.on('requestfailed')` handlers, and supplies the START edge from one `page.on('request')`.
 *   The start edge cannot be derived from the existing two — a response event says a request
 *   ENDED, so without it a three-second fetch still in flight looks exactly like an idle page.
 * - **dom** — no mutation for the quiet window, from a `MutationObserver` that `initScriptSource()`
 *   installs. An INIT script, like `refRegistryLayerAdapter`'s, so it is armed before the page's
 *   own scripts on every document: an observer armed when the WAIT starts has already missed the
 *   render that wait was asked about and would report an untouched page.
 * - **animation** — no running `document.getAnimations()` entry. Animations with INFINITE
 *   iterations are skipped for the same reason pollers are: a perpetual spinner is decoration, and
 *   counting it makes every page carrying one hit the ceiling.
 *
 * USAGE:
 * const settleWait = settleWaitLayerAdapter({ page });
 * await page.addInitScript(settleWait.initScriptSource());
 * page.on('request', (request) => {
 *   settleWait.noteRequestStarted({
 *     method: request.method(), url: request.url(), resourceType: request.resourceType(),
 *   });
 * });
 * await settleWait.waitForSettle({});
 * // Returns { settled: true, reason: 'quiet', waitedMs: 300, unsettled: [], ... }
 */

import type { Page } from '@playwright/test';
import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { EpochMs } from '../../../contracts/epoch-ms/epoch-ms-contract';
import { readingCountContract } from '../../../contracts/reading-count/reading-count-contract';
import type { ReadingCount } from '../../../contracts/reading-count/reading-count-contract';
import type { SettleReading } from '../../../contracts/settle-reading/settle-reading-contract';
import { settleRequestShapeTransformer } from '../../../transformers/settle-request-shape/settle-request-shape-transformer';
import { settlePollLayerAdapter } from './settle-poll-layer-adapter';

// Page-side global holding the mutation clock. Distinct from `__siege` (the ref registry's) so a
// navigation resetting one never disturbs the other.
const SETTLE_GLOBAL = '__siegeSettle';

// Long-lived by design: opened once and held open, so they never ENTER the quiet count.
const STREAMING_RESOURCE_TYPES = new Set(['eventsource', 'websocket']);

// Each of these is a PARAMETER default rather than a static, because the step brokers that will
// call this do not exist yet and the statics file they will read belongs to another unit.
const DEFAULT_QUIET_WINDOW_MS = 250;
const DEFAULT_CEILING_MS = 5_000;
const DEFAULT_POLL_MS = 50;
// Three, not two: two would classify a page that merely retried once. The first two occurrences of
// a shape still count as real work, so a poll that has only just started delays a settle by at most
// its own round trip.
const DEFAULT_POLLER_REPEAT_THRESHOLD = 3;
// Two probes more than the ceiling needs, so the elapsed-time ceiling is what normally ends a wait
// and the attempt count stays a backstop against a clock that moved backwards.
const POLL_ATTEMPT_HEADROOM = 2;

// Installed through `addInitScript`, so it runs on EVERY document before the page's own scripts.
// Observing `document` rather than `document.documentElement`: an init script runs at
// document-start, where the root element may still be replaced by the parser.
const INSTALL_SOURCE = `(() => {
  const existing = window.${SETTLE_GLOBAL};
  if (existing !== undefined && existing.observer !== null) { return; }
  const state = { lastMutationAt: null, observer: null };
  window.${SETTLE_GLOBAL} = state;
  state.observer = new MutationObserver(() => { state.lastMutationAt = Date.now(); });
  state.observer.observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
})()`;

// Self-invoked for the same reason every other source string in this folder is: Playwright tags a
// call with `isFunction: typeof pageFunction === 'function'`, a string fails that test, so a bare
// arrow-function source is never CALLED and comes back `undefined`.
//
// It re-runs the installer first, so a page already loaded when this adapter was built still gets
// an observer rather than reporting a document that has never mutated.
const PROBE_SOURCE = `(() => {
${INSTALL_SOURCE};
  const state = window.${SETTLE_GLOBAL};
  const animations = typeof document.getAnimations === 'function' ? document.getAnimations() : [];
  let running = 0;
  animations.forEach((animation) => {
    if (animation.playState !== 'running') { return; }
    const effect = animation.effect;
    const iterations = effect === null || effect === undefined ? 1 : effect.getTiming().iterations;
    if (iterations === Infinity) { return; }
    running += 1;
  });
  return { nowMs: Date.now(), lastMutationAtMs: state.lastMutationAt, runningAnimations: running };
})()`;

export const settleWaitLayerAdapter = ({
  page,
  // On the FACTORY rather than on `waitForSettle`: a shape is classified while requests arrive on
  // the event stream, which happens between waits rather than during one. A per-wait threshold
  // would be read after the classification it was meant to govern had already happened.
  pollerRepeatThreshold = DEFAULT_POLLER_REPEAT_THRESHOLD,
}: {
  page: Page;
  pollerRepeatThreshold?: number | undefined;
}): {
  initScriptSource: () => ContentText;
  probeSource: () => ContentText;
  noteRequestStarted: (params: {
    method: string;
    url: string;
    resourceType: string;
  }) => ContentText;
  noteRequestSettled: (params: { method: string; url: string }) => ContentText;
  waitForSettle: (params: {
    quietWindowMs?: number | undefined;
    ceilingMs?: number | undefined;
    pollMs?: number | undefined;
  }) => Promise<SettleReading>;
} => {
  // How many times each shape has STARTED over the whole life of the session. The repeat count is
  // what classifies a poller, and it has to outlive one `waitForSettle` call — a page polling every
  // two seconds would never cross a threshold reset per wait.
  const startCounts = new Map<ContentText, ReadingCount>();
  const pendingByShape = new Map<ContentText, ReadingCount>();
  // A HOLDER whose field mutates rather than a reassigned `let`, matching `mintState` in
  // `playwright-session-adapter.ts`, so a read before an await and a write after it never give
  // `require-atomic-updates` cause to flag it.
  const networkState = { lastActivityAtMs: null as EpochMs | null };

  return {
    initScriptSource: (): ContentText => contentTextContract.parse(INSTALL_SOURCE),

    probeSource: (): ContentText => contentTextContract.parse(PROBE_SOURCE),

    noteRequestStarted: ({ method, url, resourceType }): ContentText => {
      const shape = settleRequestShapeTransformer({ method, url });
      if (STREAMING_RESOURCE_TYPES.has(resourceType)) {
        return shape;
      }

      const seen = readingCountContract.parse((startCounts.get(shape) ?? 0) + 1);
      startCounts.set(shape, seen);

      if (seen >= pollerRepeatThreshold) {
        return shape;
      }

      pendingByShape.set(shape, readingCountContract.parse((pendingByShape.get(shape) ?? 0) + 1));
      networkState.lastActivityAtMs = epochMsContract.parse(Date.now());
      return shape;
    },

    // Decrements only while something is actually pending for that shape, so the settle event of a
    // request already classed a poller drains nothing and the tally never goes negative.
    noteRequestSettled: ({ method, url }): ContentText => {
      const shape = settleRequestShapeTransformer({ method, url });
      const pending = pendingByShape.get(shape) ?? 0;
      if (pending > 0) {
        pendingByShape.set(shape, readingCountContract.parse(pending - 1));
        networkState.lastActivityAtMs = epochMsContract.parse(Date.now());
      }
      return shape;
    },

    waitForSettle: async ({
      quietWindowMs = DEFAULT_QUIET_WINDOW_MS,
      ceilingMs = DEFAULT_CEILING_MS,
      pollMs = DEFAULT_POLL_MS,
    }): Promise<SettleReading> =>
      settlePollLayerAdapter({
        page,
        probeSource: contentTextContract.parse(PROBE_SOURCE),
        quietWindowMs,
        ceilingMs,
        pollMs,
        startedAtMs: Date.now(),
        attemptsLeft: Math.max(
          1,
          Math.ceil(ceilingMs / Math.max(1, pollMs)) + POLL_ATTEMPT_HEADROOM,
        ),
        networkSnapshot: () => ({
          pendingRequests: readingCountContract.parse(
            Array.from(pendingByShape.values()).reduce((total, count) => total + count, 0),
          ),
          lastActivityAtMs: networkState.lastActivityAtMs,
          pollersDiscounted: Array.from(startCounts.entries())
            .filter(([, count]) => count >= pollerRepeatThreshold)
            .map(([shape]) => shape)
            .sort(),
        }),
      }),
  };
};

/**
 * PURPOSE: Boots the poller that drives the rate-limit guardrail on orchestrator startup.
 *
 * The poller is `rateLimitsWatchBroker`, which exists to watch `<dungeonmasterHome>/rate-limits.json`
 * — but that file's CONTENT is no longer a source of anything. It was written by the
 * `dungeonmaster statusline-tap` pipeline, which only records a reading while a user has a Claude
 * session open with a statusline configured to feed it, and a queue running unattended is exactly
 * the case the guardrail is for. The measurement comes from the usage ledger instead, which is
 * derived from Claude's own transcripts and is therefore complete whether or not anyone was
 * watching. What this responder still uses the watcher for is its CLOCK.
 *
 * That is why `onSnapshot` does nothing here. EvaluateHoldLayerResponder is the single publisher of
 * a reading — it sets rateLimitsState and emits `rate-limits-updated` — and a second publisher on
 * this callback overwrote it on every tick, so whichever fired last won and neither reading was
 * trustworthy.
 *
 * USAGE:
 * RateLimitsBootstrapResponder();
 * // Idempotent — subsequent calls return the existing handle. Polls every 5s, measuring usage and
 * // raising or lifting the dispatch hold.
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { rateLimitsWatchBroker } from '../../../brokers/rate-limits/watch/rate-limits-watch-broker';
import { rateLimitsBootstrapState } from '../../../state/rate-limits-bootstrap/rate-limits-bootstrap-state';

import { EvaluateHoldLayerResponder } from './evaluate-hold-layer-responder';

const DEFAULT_POLL_INTERVAL_MS = 5000;

export const RateLimitsBootstrapResponder = (): AdapterResult => {
  if (rateLimitsBootstrapState.getHandle() !== null) {
    return { success: true as const };
  }

  const overrideMs = Number(process.env.DUNGEONMASTER_RATE_LIMITS_POLL_MS);
  const intervalMs =
    Number.isFinite(overrideMs) && overrideMs > 0 ? overrideMs : DEFAULT_POLL_INTERVAL_MS;

  const handle = rateLimitsWatchBroker({
    intervalMs,
    // Deliberately inert — see the header. onTick below already runs a pass on every interval, so
    // acting here as well would evaluate twice whenever the dead file happened to change.
    onSnapshot: (): void => undefined,
    onTick: (): void => {
      // Every tick, unconditionally. Three things depend on that. It is the clock the measurement
      // runs on; it is the clock that LIFTS a hold once its resumeAt passes; and it is how a hold
      // written by ANOTHER process reaches this one's memory — the spawn layer records a 429
      // refusal straight to dispatch-state.json, and nothing else would read it back.
      //
      // The pass is cheap at rest: the ledger scan throttles itself, and the hold is persisted only
      // when the answer changes.
      EvaluateHoldLayerResponder();
    },
    onError: ({ message }): void => {
      process.stderr.write(`${message}\n`);
    },
  });

  rateLimitsBootstrapState.setHandle({ handle });

  // Once at boot, so a hold persisted before a restart is back in memory before the dispatcher can
  // read getIsPlaying(). Without it the first play press after a reboot dispatches into a window
  // the guardrail had already closed.
  EvaluateHoldLayerResponder();

  return { success: true as const };
};

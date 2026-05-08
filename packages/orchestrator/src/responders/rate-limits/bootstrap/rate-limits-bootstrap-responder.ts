/**
 * PURPOSE: Boots the rate-limits.json file watcher on orchestrator startup, wiring state updates and bus events
 *
 * USAGE:
 * RateLimitsBootstrapResponder();
 * // Idempotent — subsequent calls return the existing handle. Polls every 5s, updates rateLimitsState, emits 'rate-limits-updated'.
 */

import { processIdContract, type AdapterResult } from '@dungeonmaster/shared/contracts';

import { rateLimitsWatchBroker } from '../../../brokers/rate-limits/watch/rate-limits-watch-broker';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { rateLimitsBootstrapState } from '../../../state/rate-limits-bootstrap/rate-limits-bootstrap-state';
import { rateLimitsState } from '../../../state/rate-limits/rate-limits-state';

const DEFAULT_POLL_INTERVAL_MS = 5000;
const WATCHER_PROCESS_ID = processIdContract.parse('rate-limits-watcher');

export const RateLimitsBootstrapResponder = (): AdapterResult => {
  if (rateLimitsBootstrapState.getHandle() !== null) {
    return { success: true as const };
  }

  const overrideMs = Number(process.env.DUNGEONMASTER_RATE_LIMITS_POLL_MS);
  const intervalMs =
    Number.isFinite(overrideMs) && overrideMs > 0 ? overrideMs : DEFAULT_POLL_INTERVAL_MS;

  const handle = rateLimitsWatchBroker({
    intervalMs,
    onSnapshot: ({ snapshot }): void => {
      rateLimitsState.set({ snapshot });
      orchestrationEventsState.emit({
        type: 'rate-limits-updated',
        processId: WATCHER_PROCESS_ID,
        payload: snapshot === null ? { snapshot: null } : { snapshot },
      });
    },
    onError: ({ message }): void => {
      process.stderr.write(`${message}\n`);
    },
  });

  rateLimitsBootstrapState.setHandle({ handle });
  return { success: true as const };
};

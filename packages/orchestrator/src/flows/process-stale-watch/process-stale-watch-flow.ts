/**
 * PURPOSE: Orchestration flow for the stale-process watchdog — bootstrap wiring only. Mirrors the `RateLimitsFlow.bootstrap()` shape so `start-orchestrator.ts` can kick it off at module load alongside the other passive watchers.
 *
 * USAGE:
 * ProcessStaleWatchFlow.bootstrap();
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { ProcessStaleWatchBootstrapResponder } from '../../responders/process-stale-watch/bootstrap/process-stale-watch-bootstrap-responder';

export const ProcessStaleWatchFlow = {
  bootstrap: (): AdapterResult => ProcessStaleWatchBootstrapResponder(),
};

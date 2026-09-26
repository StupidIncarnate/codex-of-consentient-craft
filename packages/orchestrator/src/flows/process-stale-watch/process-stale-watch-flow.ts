/**
 * PURPOSE: Orchestration flow for the stale-process watchdog — bootstrap wiring only. Mirrors the `RateLimitsFlow.bootstrap()` shape so `StartOrchestrator.bootstrap()` can start it alongside the other passive watchers.
 *
 * USAGE:
 * ProcessStaleWatchFlow.bootstrap();
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { ProcessStaleWatchBootstrapResponder } from '../../responders/process-stale-watch/bootstrap/process-stale-watch-bootstrap-responder';

export const ProcessStaleWatchFlow = {
  bootstrap: (): AdapterResult => ProcessStaleWatchBootstrapResponder(),
};

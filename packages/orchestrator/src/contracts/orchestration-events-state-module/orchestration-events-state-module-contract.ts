/**
 * PURPOSE: Validates the CommonJS module exported by `state/orchestration-events/orchestration-events-state.ts`
 * when loaded via `require(...)`. Used by integration tests that need the singleton via the
 * runtime require path (bypassing the flows/→state/ import hierarchy).
 *
 * USAGE:
 * const mod = orchestrationEventsStateModuleContract.parse(require('.../orchestration-events-state'));
 * mod.orchestrationEventsState.on({ ... });
 */
import { z } from 'zod';

import { orchestrationEventsStateFacadeContract } from '../orchestration-events-state-facade/orchestration-events-state-facade-contract';

export const orchestrationEventsStateModuleContract = z
  .object({
    orchestrationEventsState: orchestrationEventsStateFacadeContract,
  })
  .passthrough();

export type OrchestrationEventsStateModule = z.infer<typeof orchestrationEventsStateModuleContract>;

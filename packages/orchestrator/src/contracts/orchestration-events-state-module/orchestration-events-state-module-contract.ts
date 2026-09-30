/**
 * PURPOSE: Validates the CommonJS module exported by `state/orchestration-events/orchestration-events-state.ts`
 * when loaded via `require(...)`. Used by integration tests that need the singleton via the
 * runtime require path (bypassing the flows/→state/ import hierarchy).
 *
 * USAGE:
 * const mod = orchestrationEventsStateModuleContract.parse(require('.../orchestration-events-state'));
 * mod.orchestrationEventsState.on({ ... });
 */
import { z } from '#gateway/npm/zod';

import type { OrchestrationEventsStateFacade } from '../orchestration-events-state-facade/orchestration-events-state-facade-contract';

// `z.custom` hands the facade back by reference, so `on`/`off` survive the parse; the check is
// only that the value is an object.
const orchestrationEventsStateFacadeContract = z.custom<OrchestrationEventsStateFacade>(
  (value) => typeof value === 'object' && value !== null,
  { message: 'Expected an orchestrationEventsState object' },
);

export const orchestrationEventsStateModuleContract = z
  .object({
    orchestrationEventsState: orchestrationEventsStateFacadeContract,
  })
  .loose()
  .brand<'OrchestrationEventsStateModule'>();

export type OrchestrationEventsStateModule = z.infer<typeof orchestrationEventsStateModuleContract>;

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
import type { OrchestrationEventsStateFacade } from '../orchestration-events-state-facade/orchestration-events-state-facade-contract';

export const orchestrationEventsStateModuleContract = z
  .object({
    orchestrationEventsState: orchestrationEventsStateFacadeContract,
  })
  .loose();

// `orchestrationEventsState`'s `on`/`off` live outside the FACADE's own schema (see that contract's
// own header), so the module's exported type widens the field to the facade's real type rather than
// the schema-only `{[x: string]: unknown}` `z.infer` would otherwise give it.
export type OrchestrationEventsStateModule = Omit<
  z.infer<typeof orchestrationEventsStateModuleContract>,
  'orchestrationEventsState'
> & {
  orchestrationEventsState: OrchestrationEventsStateFacade;
};

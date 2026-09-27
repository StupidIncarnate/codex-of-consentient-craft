/**
 * PURPOSE: Validates the runtime CommonJS module produced by `require('.../orchestration-events-state')`
 * and returns its `orchestrationEventsState` facade. Used by integration tests to bypass the
 * flows/→state/ ESM import hierarchy without resorting to `Reflect.get` on the unknown require result.
 *
 * USAGE:
 * const eventsState = orchestrationEventsStateExtractTransformer({
 *   rawModule: require('../../state/orchestration-events/orchestration-events-state'),
 * });
 * eventsState.on({ type: 'chat-output', handler });
 */
import type { OrchestrationEventsStateFacade } from '../../contracts/orchestration-events-state-facade/orchestration-events-state-facade-contract';
import { orchestrationEventsStateModuleContract } from '../../contracts/orchestration-events-state-module/orchestration-events-state-module-contract';
import type { OrchestrationEventsStateModule } from '../../contracts/orchestration-events-state-module/orchestration-events-state-module-contract';

export const orchestrationEventsStateExtractTransformer = ({
  rawModule,
}: {
  rawModule: unknown;
}): OrchestrationEventsStateFacade => {
  // The schema's OWN inferred type has no knowledge of `orchestrationEventsState`'s `on`/`off` (they
  // live outside its `.loose()` object — see the facade contract's own header), so `.parse()`'s
  // return type is cast to the module's exported, widened type rather than trusted as-is.
  const parsed = orchestrationEventsStateModuleContract.parse(
    rawModule,
  ) as OrchestrationEventsStateModule;
  return parsed.orchestrationEventsState;
};

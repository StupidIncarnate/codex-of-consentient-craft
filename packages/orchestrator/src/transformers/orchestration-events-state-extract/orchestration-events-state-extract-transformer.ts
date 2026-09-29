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

export const orchestrationEventsStateExtractTransformer = ({
  rawModule,
}: {
  rawModule: unknown;
}): OrchestrationEventsStateFacade => {
  const parsed = orchestrationEventsStateModuleContract.parse(rawModule);
  return parsed.orchestrationEventsState;
};

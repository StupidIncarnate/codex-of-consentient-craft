/**
 * PURPOSE: Adapter for orchestrationEventsState.on that wraps the orchestrator event bus
 *
 * USAGE:
 * orchestratorEventsOnAdapter({ type: 'phase-change', handler: ({ processId, payload }) => {} });
 * // Subscribes to orchestration events of the given type
 */

import { orchestrationEventsState } from '@dungeonmaster/orchestrator';
import type {
  AdapterResult,
  OrchestrationEventType,
  ProcessId,
} from '@dungeonmaster/shared/contracts';

export const orchestratorEventsOnAdapter = ({
  type,
  handler,
}: {
  type: OrchestrationEventType;
  handler: (args: { processId: ProcessId; payload: Record<string, unknown> }) => void;
}): AdapterResult => {
  orchestrationEventsState.on({ type, handler });

  return { success: true as const };
};

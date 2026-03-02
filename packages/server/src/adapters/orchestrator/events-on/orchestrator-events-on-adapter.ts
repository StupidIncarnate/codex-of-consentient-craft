/**
 * PURPOSE: Adapter for orchestrationEventsState.on that wraps the orchestrator event bus
 *
 * USAGE:
 * orchestratorEventsOnAdapter({ type: 'phase-change', handler: ({ processId, payload }) => {} });
 * // Subscribes to orchestration events of the given type
 */

import { orchestrationEventsState } from '@dungeonmaster/orchestrator';
import type { OrchestrationEventType, ProcessId } from '@dungeonmaster/shared/contracts';

export const orchestratorEventsOnAdapter = ({
  type,
  handler,
}: {
  type: OrchestrationEventType;
  handler: (args: { processId: ProcessId; payload: Record<string, unknown> }) => void;
}): void => {
  orchestrationEventsState.on({ type, handler });
};

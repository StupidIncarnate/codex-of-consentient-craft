import { orchestrationEventsState } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { OrchestrationEventType, ProcessId } from '@dungeonmaster/shared/contracts';

type EventHandler = (args: { processId: ProcessId; payload: Record<string, unknown> }) => void;

export const orchestratorEventsOnAdapterProxy = (): {
  getCapturedHandler: (params: { type: OrchestrationEventType }) => EventHandler | undefined;
  getCapturedHandlers: () => Map<OrchestrationEventType, EventHandler>;
} => {
  const mock = registerMock({ fn: orchestrationEventsState.on });
  const handlers = new Map<OrchestrationEventType, EventHandler>();

  // The event NAME is the real address (getCapturedHandler/getCapturedHandlers below read this
  // Map by type, so two different events are told apart by name, never by call order). But
  // production code registers handlers for many different types in one run (server-init-responder
  // subscribes to every OrchestrationEventType), and this proxy can't know in advance which types
  // a given test will exercise — so the capture side stages a wildcard implementation that records
  // every call's type -> handler, and the type-addressed lookup happens on read.
  mock
    .calledWith([])
    .implement(({ type, handler }: { type: OrchestrationEventType; handler: EventHandler }) => {
      handlers.set(type, handler);

      return { success: true as const };
    });

  return {
    getCapturedHandler: ({ type }: { type: OrchestrationEventType }): EventHandler | undefined =>
      handlers.get(type),
    getCapturedHandlers: (): Map<OrchestrationEventType, EventHandler> => handlers,
  };
};

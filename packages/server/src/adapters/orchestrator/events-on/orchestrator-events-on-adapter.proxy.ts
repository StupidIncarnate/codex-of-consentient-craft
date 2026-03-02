jest.mock('@dungeonmaster/orchestrator', () => ({
  ...jest.requireActual('@dungeonmaster/orchestrator'),
  StartOrchestrator: {
    loadQuest: jest.fn(),
    replayChatHistory: jest.fn(),
    stopAllChats: jest.fn(),
  },
  orchestrationEventsState: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    removeAllListeners: jest.fn(),
  },
}));

import { orchestrationEventsState } from '@dungeonmaster/orchestrator';
import type { OrchestrationEventType, ProcessId } from '@dungeonmaster/shared/contracts';

type EventHandler = (args: { processId: ProcessId; payload: Record<string, unknown> }) => void;

export const orchestratorEventsOnAdapterProxy = (): {
  getCapturedHandler: (params: { type: OrchestrationEventType }) => EventHandler | undefined;
  getCapturedHandlers: () => Map<OrchestrationEventType, EventHandler>;
} => {
  const mock = jest.mocked(orchestrationEventsState.on);
  const handlers = new Map<OrchestrationEventType, EventHandler>();

  mock.mockImplementation(
    ({ type, handler }: { type: OrchestrationEventType; handler: EventHandler }): void => {
      handlers.set(type, handler);
    },
  );

  return {
    getCapturedHandler: ({ type }: { type: OrchestrationEventType }): EventHandler | undefined =>
      handlers.get(type),
    getCapturedHandlers: (): Map<OrchestrationEventType, EventHandler> => handlers,
  };
};

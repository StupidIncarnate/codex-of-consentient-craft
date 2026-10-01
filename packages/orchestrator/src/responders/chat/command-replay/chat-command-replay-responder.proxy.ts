import { randomUUID } from '#gateway/node/crypto';
import type { OrchestrationEventType } from '@dungeonmaster/shared/contracts';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';

const EVENT_TYPES: readonly OrchestrationEventType[] = [
  'chat-output',
  'chat-history-complete',
] as const;

export const ChatCommandReplayResponderProxy = (): {
  setupEntryIdentity: (params: { uuid: string; timestamp: string }) => void;
  setupEventCapture: () => {
    getEmittedEvents: () => readonly {
      type: OrchestrationEventType;
      processId: string;
      payload: Record<PropertyKey, unknown>;
    }[];
  };
} => {
  // Each entry's uuid and timestamp come from commandLineToChatEntryTransformer, which runs real.
  const uuidHandle = registerMock({ fn: randomUUID });
  const eventsProxy = orchestrationEventsStateProxy();

  return {
    // randomUUID and Date.prototype.toISOString take no arguments, so [] is the only address.
    setupEntryIdentity: ({ uuid, timestamp }: { uuid: string; timestamp: string }): void => {
      uuidHandle.calledWith([]).returns(uuid);
      registerSpyOn({ object: Date.prototype, method: 'toISOString' })
        .calledWith([])
        .returns(timestamp);
    },
    setupEventCapture: () => {
      eventsProxy.setupEmpty();
      const emittedEvents: {
        type: OrchestrationEventType;
        processId: string;
        payload: Record<PropertyKey, unknown>;
      }[] = [];

      for (const eventType of EVENT_TYPES) {
        orchestrationEventsState.on({
          type: eventType,
          handler: ({ processId, payload }) => {
            emittedEvents.push({ type: eventType, processId, payload });
          },
        });
      }

      return { getEmittedEvents: () => emittedEvents };
    },
  };
};

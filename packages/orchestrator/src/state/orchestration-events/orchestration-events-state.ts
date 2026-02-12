/**
 * PURPOSE: Pub/sub singleton for broadcasting orchestration lifecycle events
 *
 * USAGE:
 * orchestrationEventsState.emit({type: 'phase-change', processId, payload: {phase: 'codeweaver'}});
 * orchestrationEventsState.on({type: 'phase-change', handler: ({processId, payload}) => console.log(payload)});
 */

import type { OrchestrationEventType } from '@dungeonmaster/shared/contracts';
import type { ProcessId } from '@dungeonmaster/shared/contracts';

type EventHandler = (event: { processId: ProcessId; payload: Record<string, unknown> }) => void;

const state = {
  listeners: new Map<OrchestrationEventType, Set<EventHandler>>(),
};

export const orchestrationEventsState = {
  emit: ({
    type,
    processId,
    payload,
  }: {
    type: OrchestrationEventType;
    processId: ProcessId;
    payload: Record<string, unknown>;
  }): void => {
    const handlers = state.listeners.get(type);
    if (handlers) {
      for (const handler of handlers) {
        handler({ processId, payload });
      }
    }
  },

  on: ({ type, handler }: { type: OrchestrationEventType; handler: EventHandler }): void => {
    const existing = state.listeners.get(type);
    if (existing) {
      existing.add(handler);
    } else {
      state.listeners.set(type, new Set([handler]));
    }
  },

  off: ({ type, handler }: { type: OrchestrationEventType; handler: EventHandler }): void => {
    const handlers = state.listeners.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  },

  removeAllListeners: (): void => {
    state.listeners.clear();
  },
};

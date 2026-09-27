import type { OrchestrationEventType } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

import type { CapturedOrchestrationEmit } from '../../contracts/captured-orchestration-emit/captured-orchestration-emit-contract';
import { orchestrationEventsState } from './orchestration-events-state';

type OnCallArgs = Parameters<typeof orchestrationEventsState.on>[0];
type EventHandler = OnCallArgs['handler'];

export const orchestrationEventsStateProxy = (): {
  setupEmpty: () => void;
  captureEmits: (params: { type: OrchestrationEventType }) => readonly CapturedOrchestrationEmit[];
  // Opt-in only. Until a test calls this, `.on` is the real implementation, same as `.emit`/`.off`/
  // `.removeAllListeners` always are — this is state, not I/O, so the honest default runs the whole
  // bus for real. Call this when a test needs the exact handler FUNCTION a subscriber registered, to
  // invoke it directly instead of driving it through a real `.emit()` — server-init-responder's WS
  // relay is the traced case: its test drives each handler by hand with an arbitrary
  // processId/payload. `registerSpyOn` addresses `.on` alone; `.emit`/`.off`/`.removeAllListeners`
  // stay untouched on the same real singleton, so a caller composing this alongside a real
  // `captureEmits()` elsewhere in the same suite is unaffected.
  captureHandlers: () => void;
  getCapturedHandler: (params: { type: OrchestrationEventType }) => EventHandler | undefined;
  getCapturedHandlers: () => Map<OrchestrationEventType, EventHandler>;
} => {
  const onHandleRef: { value: SpyOnHandle | undefined } = { value: undefined };

  // The event NAME is the real address (read by TYPE below, never by call order), but production
  // code registers handlers for many different types in one run (server-init-responder subscribes
  // to every OrchestrationEventType) — so this reads every recorded `.on` call and keeps the LAST
  // handler seen per type, mirroring a real re-`.on()` call for the same type. Empty (no
  // `captureHandlers()` call yet) reads as no calls recorded, so every lookup returns nothing.
  const readCapturedHandlers = (): Map<OrchestrationEventType, EventHandler> => {
    const handlers = new Map<OrchestrationEventType, EventHandler>();
    if (onHandleRef.value === undefined) {
      return handlers;
    }
    for (const call of onHandleRef.value.callsMatching([])) {
      const { type: calledType, handler } = call[0] as OnCallArgs;
      handlers.set(calledType, handler);
    }
    return handlers;
  };

  return {
    setupEmpty: (): void => {
      orchestrationEventsState.removeAllListeners();
    },
    // Real-bus scenario: subscribes a genuine listener through the real `.on()`, so the caller's
    // own real `.emit()` call is what delivers into `captured` — no mock sits between the two.
    captureEmits: ({
      type,
    }: {
      type: OrchestrationEventType;
    }): readonly CapturedOrchestrationEmit[] => {
      orchestrationEventsState.removeAllListeners();
      const captured: CapturedOrchestrationEmit[] = [];
      orchestrationEventsState.on({
        type,
        handler: ({ processId, payload }) => {
          captured.push({ processId, payload } as CapturedOrchestrationEmit);
        },
      });
      return captured;
    },
    captureHandlers: (): void => {
      onHandleRef.value = registerSpyOn({ object: orchestrationEventsState, method: 'on' });
      // No per-call address: every real call passes a fresh `{type, handler}` object whose closure
      // never compares equal to another, so `[]` is the honest description. `.on` itself returns
      // nothing.
      onHandleRef.value.calledWith([]).returns(undefined);
    },
    getCapturedHandler: ({ type }: { type: OrchestrationEventType }): EventHandler | undefined =>
      readCapturedHandlers().get(type),
    getCapturedHandlers: (): Map<OrchestrationEventType, EventHandler> => readCapturedHandlers(),
  };
};

import type { OrchestrationEventType } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import type { CapturedOrchestrationEmit } from '../../contracts/captured-orchestration-emit/captured-orchestration-emit-contract';
// Self-referencing package import, deliberately NOT './orchestration-events-state': a caller in
// another package (server) imports this singleton from '@dungeonmaster/orchestrator', and when
// that SAME test file also composes StartOrchestratorProxy (a property-access registerMock, which
// forces a bare, factory-less jest.mock('@dungeonmaster/orchestrator') — see
// mock-calls-merge-by-module-transformer's own header for why), Jest's automock replaces every
// export of that module, orchestrationEventsState included. A relative import here would spy on a
// SEPARATE, un-mocked module instance from the one the real caller's `.on()` calls reach — matches
// start-orchestrator.proxy.ts's own header, which hit the identical trap first.
import { orchestrationEventsState } from '@dungeonmaster/orchestrator';

type OnCallArgs = Parameters<typeof orchestrationEventsState.on>[0];
type EventHandler = OnCallArgs['handler'];

export const orchestrationEventsStateProxy = (): {
  setupEmpty: () => void;
  captureEmits: (params: { type: OrchestrationEventType }) => readonly CapturedOrchestrationEmit[];
  // Caller-level scenario for a caller that registers its OWN real handler with `.on` (a real
  // subscriber, not this proxy's own captureEmits listener) and needs to invoke that exact handler
  // later without a real `.emit()` — server-init-responder.ts's WS relay is the traced case: its
  // test drives each handler by hand with an arbitrary processId/payload. registerMock (not
  // registerSpyOn) is the right tool here: when the caller's OWN test file ALSO composes
  // StartOrchestratorProxy, `.on` is ALREADY a bare Jest automock (see the import comment above),
  // and jestRegisterMockAdapter's job is exactly "wire dispatch onto an already-mocked function" —
  // registerSpyOn's jest.spyOn on an already-mocked property returns THAT SAME mock, so its own
  // passthrough fallback recurses into itself (confirmed: RangeError, stack traced to
  // jest-register-spy-on-adapter.ts's own passthrough branch). Where `.on` is NOT already a mock
  // (every caller that never touches StartOrchestratorProxy — the three current captureEmits
  // callers), registerMock's own no-op guard (`typeof mock.mockImplementation === 'function'`)
  // skips wiring entirely, leaving `.on` fully real — captureEmits keeps working unmodified there.
  getCapturedHandler: (params: { type: OrchestrationEventType }) => EventHandler | undefined;
  getCapturedHandlers: () => Map<OrchestrationEventType, EventHandler>;
} => {
  const onHandle = registerMock({ fn: orchestrationEventsState.on });
  // No per-call address: every real call passes a fresh `{type, handler}` object whose closure
  // never compares equal to another, so `[]` is the honest description — this only takes effect
  // when `.on` is already a bare automock (see the getCapturedHandler comment); it is a no-op
  // otherwise. `.on` itself returns nothing.
  onHandle.calledWith([]).returns(undefined);

  // The event NAME is the real address (read by TYPE in the two getters below, never by call
  // order), but production code registers handlers for many different types in one run
  // (server-init-responder subscribes to every OrchestrationEventType) — so this reads every
  // recorded `.on` call and keeps the LAST handler seen per type, mirroring a real re-`.on()` call
  // for the same type.
  const readCapturedHandlers = (): Map<OrchestrationEventType, EventHandler> => {
    const handlers = new Map<OrchestrationEventType, EventHandler>();
    for (const call of onHandle.callsMatching([])) {
      const { type: calledType, handler } = call[0] as OnCallArgs;
      handlers.set(calledType, handler);
    }
    return handlers;
  };

  return {
    setupEmpty: (): void => {
      orchestrationEventsState.removeAllListeners();
    },
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
    getCapturedHandler: ({ type }: { type: OrchestrationEventType }): EventHandler | undefined =>
      readCapturedHandlers().get(type),
    getCapturedHandlers: (): Map<OrchestrationEventType, EventHandler> => readCapturedHandlers(),
  };
};

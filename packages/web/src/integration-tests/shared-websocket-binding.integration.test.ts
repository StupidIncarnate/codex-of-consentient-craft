import { QuestIdStub } from '@dungeonmaster/shared/contracts';
import { StartEndpointMock } from '@dungeonmaster/testing';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { testingLibraryRenderHookAdapter } from '../adapters/testing-library/render-hook/testing-library-render-hook-adapter';
import { testingLibraryWaitForAdapter } from '../adapters/testing-library/wait-for/testing-library-wait-for-adapter';
import { useQuestChatBinding } from '../bindings/use-quest-chat/use-quest-chat-binding';
import { useQuestQueueBinding } from '../bindings/use-quest-queue/use-quest-queue-binding';
import { useRateLimitsBinding } from '../bindings/use-rate-limits/use-rate-limits-binding';
import { webConfigStatics } from '../statics/web-config/web-config-statics';

describe('shared websocket connection', () => {
  it('VALID: {chat + queue + rate-limits bindings mounted together} => exactly one WebSocket is opened', async () => {
    // Register MSW handlers for the HTTP calls the queue and rate-limits bindings
    // make on mount. Without handlers, MSW's onUnhandledRequest:'error' throws.
    const queueEndpoint = StartEndpointMock.listen({
      method: 'get',
      url: webConfigStatics.api.routes.questsQueue,
    });
    queueEndpoint.resolves({ data: { entries: [] } });

    const rateLimitsEndpoint = StartEndpointMock.listen({
      method: 'get',
      url: webConfigStatics.api.routes.rateLimits,
    });
    rateLimitsEndpoint.resolves({ data: { snapshot: null } });

    // Spy on the WebSocket constructor so every `new globalThis.WebSocket(...)`
    // call is intercepted and counted. Installed before bindings mount so the
    // useEffect calls hit our implementation.
    const socketConstructions: true[] = [];

    const wsSpy = registerSpyOn({ object: globalThis as never, method: 'WebSocket' });

    // Expose the OPEN constant so the adapter's readyState guard resolves.
    (globalThis.WebSocket as unknown as { OPEN: typeof WebSocket.OPEN }).OPEN = WebSocket.OPEN;

    wsSpy.mockImplementation((() => {
      socketConstructions.push(true);
      // Return a minimal mock socket. The onopen setter fires the handler
      // synchronously so the binding's subscribe-quest handshake runs during
      // mount without needing a separate act() call.
      return {
        set onopen(handler: () => void) {
          handler();
        },
        get onopen(): () => void {
          return () => {};
        },
        onmessage: null as ((e: MessageEvent) => void) | null,
        onclose: null as (() => void) | null,
        readyState: WebSocket.OPEN as typeof WebSocket.OPEN,
        close: (): void => {},
        send: (): void => {},
      };
    }) as never);

    const questId = QuestIdStub({ value: 'test-quest' });

    // Mount all three WS-consuming bindings simultaneously.
    const { result: chatResult } = testingLibraryRenderHookAdapter({
      renderCallback: () => useQuestChatBinding({ questId }),
    });
    const { result: queueResult } = testingLibraryRenderHookAdapter({
      renderCallback: () => useQuestQueueBinding(),
    });
    const { result: rateLimitsResult } = testingLibraryRenderHookAdapter({
      renderCallback: () => useRateLimitsBinding(),
    });

    // Wait until both HTTP-backed bindings finish loading (which confirms all
    // useEffect calls — including the WS constructor — have run), then assert
    // their complete idle state in one pass.
    await testingLibraryWaitForAdapter({
      callback: () => {
        expect(queueResult.current).toStrictEqual({
          activeEntry: null,
          allEntries: [],
          errorEntry: undefined,
          isLoading: false,
        });
        expect(rateLimitsResult.current).toStrictEqual({
          snapshot: null,
          isLoading: false,
        });
      },
    });

    expect(chatResult.current).toStrictEqual({
      entriesBySession: new Map(),
      slotEntries: new Map(),
      quest: null,
      pendingClarification: null,
      isStreaming: false,
      sendMessage: expect.any(Function),
      submitClarifyAnswers: expect.any(Function),
      stopChat: expect.any(Function),
    });

    // THE REFACTOR TARGET: after Phase 1, all three bindings share one
    // WebSocket connection so exactly one constructor call is expected.
    //
    // Current (pre-refactor) state: each binding calls
    // websocketConnectAdapter() independently, producing three separate
    // `new WebSocket(...)` calls — this assertion is intentionally RED until
    // the shared-channel refactor lands.
    expect(socketConstructions).toHaveLength(1);
  });
});

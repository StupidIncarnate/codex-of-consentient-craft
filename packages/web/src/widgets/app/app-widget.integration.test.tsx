import { HealthStatusPayloadStub, QuestIdStub } from '@dungeonmaster/shared/contracts';
import { StartEndpointMock } from '@dungeonmaster/testing';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';
import { testingLibraryWaitForAdapter } from '../../adapters/testing-library/wait-for/testing-library-wait-for-adapter';
import { useHealthStatusBinding } from '../../bindings/use-health-status/use-health-status-binding';
import { useQuestChatBinding } from '../../bindings/use-quest-chat/use-quest-chat-binding';
import { useQuestQueueBinding } from '../../bindings/use-quest-queue/use-quest-queue-binding';
import { useRateLimitsBinding } from '../../bindings/use-rate-limits/use-rate-limits-binding';
import { WsUrlStub } from '../../contracts/ws-url/ws-url.stub';
import { webSocketChannelState } from '../../state/web-socket-channel/web-socket-channel-state';
import { webConfigStatics } from '../../statics/web-config/web-config-statics';

describe('shared websocket connection', () => {
  it('VALID: {chat + queue + rate-limits + health bindings mounted together} => exactly one WebSocket is opened', async () => {
    // Register MSW handlers for the HTTP calls the queue, rate-limits and health-status
    // bindings make on mount. Without handlers, MSW's onUnhandledRequest:'error' throws.
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

    const healthStatusEndpoint = StartEndpointMock.listen({
      method: 'get',
      url: webConfigStatics.api.routes.healthStatus,
    });
    healthStatusEndpoint.resolves({
      data: HealthStatusPayloadStub({ status: 'ok', uptimeSeconds: 11520, version: '1.4.0' }),
    });

    // Spy on the WebSocket constructor so every `new globalThis.WebSocket(...)`
    // call is intercepted and counted. Installed before bindings mount so the
    // useEffect calls hit our implementation.
    const socketConstructions: true[] = [];

    const wsSpy = registerSpyOn({ object: globalThis as never, method: 'WebSocket' });

    // Expose the OPEN constant so the adapter's readyState guard resolves.
    (globalThis.WebSocket as unknown as { OPEN: typeof WebSocket.OPEN }).OPEN = WebSocket.OPEN;

    wsSpy.calledWith([WsUrlStub({ value: 'ws://localhost/ws' })]).implement((() => {
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

    // Reset the channel singleton and connect it the way AppMountFlow does in
    // production. The bindings then subscribe to channel observables; without
    // this connect(), no socket is created at all.
    webSocketChannelState.clear();
    webSocketChannelState.connect({ url: WsUrlStub({ value: 'ws://localhost/ws' }) });

    const questId = QuestIdStub({ value: 'test-quest' });

    // Mount all four WS-consuming bindings simultaneously.
    const { result: chatResult } = testingLibraryRenderHookAdapter({
      renderCallback: () => useQuestChatBinding({ questId }),
    });
    const { result: queueResult } = testingLibraryRenderHookAdapter({
      renderCallback: () => useQuestQueueBinding(),
    });
    const { result: rateLimitsResult } = testingLibraryRenderHookAdapter({
      renderCallback: () => useRateLimitsBinding(),
    });
    const { result: healthResult } = testingLibraryRenderHookAdapter({
      renderCallback: () => useHealthStatusBinding(),
    });

    // Wait until all three HTTP-backed bindings finish loading (which confirms all
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
        expect(healthResult.current).toStrictEqual({
          badgeState: { state: 'online', uptimeSeconds: 11520 },
          retry: expect.any(Function),
        });
      },
    });

    expect(chatResult.current).toStrictEqual({
      entriesBySession: new Map(),
      entriesByWorkItem: new Map(),
      slotEntries: new Map(),
      followupEntries: [],
      quest: null,
      loadError: null,
      pendingClarification: null,
      isStreaming: false,
      isFollowupStreaming: false,
      armStreaming: expect.any(Function),
      disarmStreaming: expect.any(Function),
      disarmFollowupStreaming: expect.any(Function),
      sendMessage: expect.any(Function),
      sendFollowupMessage: expect.any(Function),
      sendCommentBatch: expect.any(Function),
      submitClarifyAnswers: expect.any(Function),
      stopChat: expect.any(Function),
      stopFollowupChat: expect.any(Function),
    });

    // After Phase 1, all four bindings share one WebSocket connection via the
    // singleton webSocketChannelState — exactly one constructor call is expected.
    expect(socketConstructions).toStrictEqual([true]);
  });
});

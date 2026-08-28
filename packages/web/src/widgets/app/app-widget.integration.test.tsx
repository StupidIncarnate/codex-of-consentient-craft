import { screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import {
  DispatchStateStub,
  HealthStatusPayloadStub,
  QuestIdStub,
} from '@dungeonmaster/shared/contracts';
import { StartEndpointMock } from '@dungeonmaster/testing';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { testingLibraryActAsyncAdapter } from '../../adapters/testing-library/act-async/testing-library-act-async-adapter';
import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';
import { testingLibraryWaitForAdapter } from '../../adapters/testing-library/wait-for/testing-library-wait-for-adapter';
import { useHealthStatusBinding } from '../../bindings/use-health-status/use-health-status-binding';
import { useQuestChatBinding } from '../../bindings/use-quest-chat/use-quest-chat-binding';
import { useQuestQueueBinding } from '../../bindings/use-quest-queue/use-quest-queue-binding';
import { useRateLimitsBinding } from '../../bindings/use-rate-limits/use-rate-limits-binding';
import { WsUrlStub } from '../../contracts/ws-url/ws-url.stub';
import { webSocketChannelState } from '../../state/web-socket-channel/web-socket-channel-state';
import { healthBadgeStatics } from '../../statics/health-badge/health-badge-statics';
import { webConfigStatics } from '../../statics/web-config/web-config-statics';
import { AppWidget } from './app-widget';

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

describe('health badge rendered in the app shell', () => {
  it('VALID: {mount, then one health-status frame} => badge carries the testid, the seed is exactly one request with no query string, and the frame moves the rendered text from ONLINE 3h 12m to ONLINE 3h 13m with no further request', async () => {
    // Rendering the WHOLE AppWidget mounts four HTTP-backed bindings (queue, rate-limits,
    // dispatch-toggle inside the queue bar, and health), and MSW runs with
    // onUnhandledRequest:'error' — every one of the four needs a handler or the render throws,
    // even though the empty queue keeps DispatchToggleWidget from ever actually mounting.
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

    const dispatchEndpoint = StartEndpointMock.listen({
      method: 'get',
      url: webConfigStatics.api.routes.orchestrationDispatch,
    });
    dispatchEndpoint.resolves({ data: { state: DispatchStateStub({ mode: 'paused' }) } });

    const healthStatusEndpoint = StartEndpointMock.listen({
      method: 'get',
      url: webConfigStatics.api.routes.healthStatus,
    });
    healthStatusEndpoint.resolves({
      data: HealthStatusPayloadStub({ status: 'ok', uptimeSeconds: 11520, version: '1.4.0' }),
    });

    // Address is the URL (fetchGetWithStatusAdapter's first arg) — a query string appended to
    // the seed request would fail this exact-string address and the callsMatching read below
    // would come back empty, which MSW's own getRequestCount() cannot tell apart from a
    // no-query-string request since MSW matches a handler URL irrespective of search params.
    const fetchSpy = registerSpyOn({ object: globalThis, method: 'fetch', passthrough: true });

    // Reset the channel singleton so a stale connection left by an earlier test in this file
    // cannot leak into this case. dispatchInbound below never depends on isOpen/connect, so no
    // WebSocket spy or connect() call is needed — only the subject-push path is under test.
    webSocketChannelState.clear();

    // Trivial child route so useGuildsBinding (and its GET /api/guilds call) never mounts — the
    // health badge's seed/heartbeat path is what this case proves, not the guild list.
    await testingLibraryActAsyncAdapter({
      callback: async () => {
        mantineRenderAdapter({
          ui: (
            <MemoryRouter initialEntries={['/']}>
              <Routes>
                <Route element={<AppWidget />}>
                  <Route path="/" element={<div data-testid="TRIVIAL_ROUTE" />} />
                </Route>
              </Routes>
            </MemoryRouter>
          ),
        });
        await Promise.resolve();
      },
    });

    await testingLibraryWaitForAdapter({
      callback: () => {
        expect(screen.getByTestId(healthBadgeStatics.testId).textContent).toBe('ONLINE 3h 12m');
      },
    });

    expect(screen.getByTestId(healthBadgeStatics.testId).textContent).toBe('ONLINE 3h 12m');

    const seedFetchUrls = fetchSpy
      .callsMatching([webConfigStatics.api.routes.healthStatus])
      .map((call) => call[0]);

    expect(seedFetchUrls).toStrictEqual([webConfigStatics.api.routes.healthStatus]);

    // dispatchInbound is the PUBLIC member web-socket-channel-state exposes for exactly this: a
    // parsed frame object, pushed straight into the health-status subject the badge already
    // subscribed to at mount — no proxy needed to reach it.
    await testingLibraryActAsyncAdapter({
      callback: async () => {
        webSocketChannelState.dispatchInbound({
          type: 'health-status',
          payload: HealthStatusPayloadStub({
            status: 'ok',
            uptimeSeconds: 11580,
            version: '1.4.0',
          }),
          timestamp: '2026-07-28T10:00:00.000Z',
        });
        await Promise.resolve();
      },
    });

    expect(screen.getByTestId(healthBadgeStatics.testId).textContent).toBe('ONLINE 3h 13m');
    expect(healthStatusEndpoint.getRequestCount()).toBe(1);
  });
});

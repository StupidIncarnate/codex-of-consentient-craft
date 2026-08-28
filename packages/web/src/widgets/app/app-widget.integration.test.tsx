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
import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
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

describe('badge crosses a real socket drop and comes back on a frame, not a click', () => {
  it('VALID: {socket closes, 30s of silence elapses, a second socket reconnects and delivers a frame} => badge moves ONLINE -> OFFLINE -> a DIFFERENT ONLINE, through a real second socket, with exactly one seed request the whole time', async () => {
    // Rendering the WHOLE AppWidget mounts four HTTP-backed bindings, and MSW runs with
    // onUnhandledRequest:'error' — every one of the four needs a handler or the render throws.
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

    // Staged as a failure so the badge can NEVER read an ONLINE string off the seed itself —
    // every ONLINE reading in this case is then attributable to a frame and to nothing else.
    const healthStatusEndpoint = StartEndpointMock.listen({
      method: 'get',
      url: webConfigStatics.api.routes.healthStatus,
    });
    healthStatusEndpoint.responds({ status: 500, body: { error: 'server exploded' } });

    // The fetch spy, not MSW's own request counter, is what proves "no retry and no second seed"
    // below — an MSW counter depends on a response having settled, which this case never awaits.
    const fetchSpy = registerSpyOn({ object: globalThis, method: 'fetch', passthrough: true });

    webSocketChannelState.clear();

    // Captured straight off each fake socket's onmessage/onclose SETTER as the real adapter code
    // assigns them, rather than stored as a tracked object — the reconnect is proven by these two
    // handlers coming from two DIFFERENT `WebSocket` constructions, addressed via onceFor/calledWith
    // below, never by re-reading a shared array. Defaulted to a no-op (never to null) so reading them
    // later needs no nullable narrowing — a `let` reassigned only from inside an uninvoked closure is
    // exactly the shape that trips TS's flow analysis into narrowing a nullable capture to `never`.
    let firstOnMessage: (event: MessageEvent) => void = (): void => undefined;
    let firstOnClose: () => void = (): void => undefined;
    let secondOnMessage: (event: MessageEvent) => void = (): void => undefined;
    let socketConstructionCount = 0;

    const wsSpy = registerSpyOn({ object: globalThis as never, method: 'WebSocket' });
    (globalThis.WebSocket as unknown as { OPEN: typeof WebSocket.OPEN }).OPEN = WebSocket.OPEN;

    // The FIRST construction only — onceFor is what lets this address hand back a DIFFERENT fake
    // socket than every construction after it, without a conditional inside the implementation.
    wsSpy.onceFor([WsUrlStub({ value: 'ws://localhost/ws' })]).implement((() => {
      socketConstructionCount += 1;
      return {
        set onopen(handler: () => void) {
          handler();
        },
        get onopen(): () => void {
          return () => {};
        },
        set onmessage(handler: (event: MessageEvent) => void) {
          firstOnMessage = handler;
        },
        get onmessage(): (event: MessageEvent) => void {
          return () => {};
        },
        set onclose(handler: () => void) {
          firstOnClose = handler;
        },
        get onclose(): () => void {
          return () => {};
        },
        readyState: WebSocket.OPEN as typeof WebSocket.OPEN,
        close: (): void => {},
        send: (): void => {},
      };
    }) as never);

    // Every construction after the first — the channel's own reconnect lands here.
    wsSpy.calledWith([WsUrlStub({ value: 'ws://localhost/ws' })]).implement((() => {
      socketConstructionCount += 1;
      return {
        set onopen(handler: () => void) {
          handler();
        },
        get onopen(): () => void {
          return () => {};
        },
        set onmessage(handler: (event: MessageEvent) => void) {
          secondOnMessage = handler;
        },
        get onmessage(): (event: MessageEvent) => void {
          return () => {};
        },
        onclose: null as (() => void) | null,
        readyState: WebSocket.OPEN as typeof WebSocket.OPEN,
        close: (): void => {},
        send: (): void => {},
      };
    }) as never);

    // connect() constructs the first socket synchronously, before the render even starts — the
    // channel's connection lifecycle is independent of AppWidget, which never calls connect itself.
    webSocketChannelState.connect({ url: WsUrlStub({ value: 'ws://localhost/ws' }) });

    // Fake clock installed BEFORE render, real timers restored before the case ends, inline — no
    // hooks. Modern fake timers fake Date too, so the binding's own Date.now()/toISOString() stamps
    // move with it, which is what lands the 30-second silence boundary exactly.
    jest.useFakeTimers({ now: new Date('2026-07-28T10:00:00.000Z').getTime() });

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

    testingLibraryActAdapter({
      callback: () => {
        firstOnMessage({
          data: JSON.stringify({
            type: 'health-status',
            payload: HealthStatusPayloadStub({
              status: 'ok',
              uptimeSeconds: 11520,
              version: '1.4.0',
            }),
            timestamp: '2026-07-28T10:00:00.000Z',
          }),
        } as MessageEvent);
      },
    });

    expect(screen.getByTestId(healthBadgeStatics.testId).textContent).toBe('ONLINE 3h 12m');

    // The drop: called directly, not wrapped in act — it only flips plain module state on the
    // channel singleton (isOpen, socket, a scheduled reconnect timer), never a React state setter.
    firstOnClose();

    // ONE advance fires both: the channel's OWN reconnect at t+3000 (constructing socket #2 through
    // the same spy) and the badge's silence flip at t+30000 — no openConnection() call from the test.
    testingLibraryActAdapter({
      callback: () => {
        jest.advanceTimersByTime(30000);
      },
    });

    expect(screen.getByTestId(healthBadgeStatics.testId).textContent).toBe('OFFLINE');
    expect(socketConstructionCount).toBe(2);

    // The restoring frame arrives through the SECOND recorded socket, with a DIFFERENT uptimeSeconds
    // than frame one — proving this ONLINE reading came from the post-reconnect frame and not a stale
    // re-render of the first.
    testingLibraryActAdapter({
      callback: () => {
        secondOnMessage({
          data: JSON.stringify({
            type: 'health-status',
            payload: HealthStatusPayloadStub({
              status: 'ok',
              uptimeSeconds: 11580,
              version: '1.4.0',
            }),
            timestamp: '2026-07-28T10:00:30.000Z',
          }),
        } as MessageEvent);
      },
    });

    expect(screen.getByTestId(healthBadgeStatics.testId).textContent).toBe('ONLINE 3h 13m');

    jest.useRealTimers();

    const seedFetchUrls = fetchSpy
      .callsMatching([webConfigStatics.api.routes.healthStatus])
      .map((call) => call[0]);

    expect(seedFetchUrls).toStrictEqual([webConfigStatics.api.routes.healthStatus]);
  });

  it('VALID: {one frame delivered inside a synchronous act} => badge text updates in that same tick, under 1 second of wall-clock time', async () => {
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

    // A 500 seed means the OFFLINE reading below cannot be the "checking" branch settling lucky —
    // it is the seed's own failure branch, and the ONLINE reading after it can only be the frame.
    const healthStatusEndpoint = StartEndpointMock.listen({
      method: 'get',
      url: webConfigStatics.api.routes.healthStatus,
    });
    healthStatusEndpoint.responds({ status: 500, body: { error: 'server exploded' } });

    webSocketChannelState.clear();

    let firstOnMessage: (event: MessageEvent) => void = (): void => undefined;

    const wsSpy = registerSpyOn({ object: globalThis as never, method: 'WebSocket' });
    (globalThis.WebSocket as unknown as { OPEN: typeof WebSocket.OPEN }).OPEN = WebSocket.OPEN;

    wsSpy.calledWith([WsUrlStub({ value: 'ws://localhost/ws' })]).implement((() => {
      return {
        set onopen(handler: () => void) {
          handler();
        },
        get onopen(): () => void {
          return () => {};
        },
        set onmessage(handler: (event: MessageEvent) => void) {
          firstOnMessage = handler;
        },
        get onmessage(): (event: MessageEvent) => void {
          return () => {};
        },
        onclose: null as (() => void) | null,
        readyState: WebSocket.OPEN as typeof WebSocket.OPEN,
        close: (): void => {},
        send: (): void => {},
      };
    }) as never);

    webSocketChannelState.connect({ url: WsUrlStub({ value: 'ws://localhost/ws' }) });

    // Real timers throughout this case — the claim under test is wall-clock elapsed time, which a
    // faked clock cannot measure.
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
        expect(screen.getByTestId(healthBadgeStatics.testId).textContent).toBe('OFFLINE');
      },
    });

    const beforeFrameAt = Date.now();

    // The expect immediately below reads the badge with NOTHING awaited between the synchronous
    // act and the read — an `await waitFor` here would hide whether the move took 5ms or 5s, which
    // is the entire content of "within 1 second".
    testingLibraryActAdapter({
      callback: () => {
        firstOnMessage({
          data: JSON.stringify({
            type: 'health-status',
            payload: HealthStatusPayloadStub({
              status: 'ok',
              uptimeSeconds: 11520,
              version: '1.4.0',
            }),
            timestamp: '2026-07-28T10:00:00.000Z',
          }),
        } as MessageEvent);
      },
    });

    expect(screen.getByTestId(healthBadgeStatics.testId).textContent).toBe('ONLINE 3h 12m');

    const elapsedMs = Date.now() - beforeFrameAt;

    expect(elapsedMs).toBeLessThan(1000);
  });
});

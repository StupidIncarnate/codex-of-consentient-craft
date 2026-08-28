import { HealthStatusPayloadStub } from '@dungeonmaster/shared/contracts';

import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';
import { testingLibraryWaitForAdapter } from '../../adapters/testing-library/wait-for/testing-library-wait-for-adapter';
import { webSocketChannelState } from '../../state/web-socket-channel/web-socket-channel-state';
import { useHealthStatusBinding } from './use-health-status-binding';
import { useHealthStatusBindingProxy } from './use-health-status-binding.proxy';

describe('useHealthStatusBinding', () => {
  it('VALID: {mount} => badgeState starts as the checking branch, then becomes the seed result', async () => {
    const proxy = useHealthStatusBindingProxy();
    proxy.setupConnectedChannel();
    proxy.setupSeed({
      payload: HealthStatusPayloadStub({ status: 'ok', uptimeSeconds: 11520, version: '1.4.0' }),
    });

    const { result } = testingLibraryRenderHookAdapter({
      renderCallback: () => useHealthStatusBinding(),
    });

    const currentState = (): ReturnType<typeof useHealthStatusBinding> => result.current;

    expect(currentState().badgeState).toStrictEqual({ state: 'checking' });

    await testingLibraryWaitForAdapter({
      callback: () => {
        expect(currentState().badgeState).toStrictEqual({ state: 'online', uptimeSeconds: 11520 });
      },
    });

    expect(currentState().badgeState).toStrictEqual({ state: 'online', uptimeSeconds: 11520 });
  });

  it('VALID: {mount, then a re-render} => calls the seed broker exactly once', async () => {
    const proxy = useHealthStatusBindingProxy();
    proxy.setupConnectedChannel();
    proxy.setupSeed({
      payload: HealthStatusPayloadStub({ status: 'ok', uptimeSeconds: 11520, version: '1.4.0' }),
    });

    const { result, rerender } = testingLibraryRenderHookAdapter({
      renderCallback: () => useHealthStatusBinding(),
    });

    const currentState = (): ReturnType<typeof useHealthStatusBinding> => result.current;

    await testingLibraryWaitForAdapter({
      callback: () => {
        expect(currentState().badgeState.state).toBe('online');
      },
    });

    rerender();

    expect(proxy.getRequestCount()).toBe(1);
  });

  it('VALID: {three delivered heartbeats} => replaces badgeState each time with no additional seed request', async () => {
    const proxy = useHealthStatusBindingProxy();
    proxy.setupConnectedChannel();
    proxy.setupSeed({
      payload: HealthStatusPayloadStub({ status: 'ok', uptimeSeconds: 11520, version: '1.4.0' }),
    });

    const { result } = testingLibraryRenderHookAdapter({
      renderCallback: () => useHealthStatusBinding(),
    });

    const currentState = (): ReturnType<typeof useHealthStatusBinding> => result.current;

    await testingLibraryWaitForAdapter({
      callback: () => {
        expect(currentState().badgeState.state).toBe('online');
      },
    });

    testingLibraryActAdapter({
      callback: () => {
        proxy.deliverHeartbeat({ payload: HealthStatusPayloadStub({ status: 'degraded' }) });
      },
    });

    // Asserted immediately after the act() that delivered the frame, with nothing awaited in
    // between — proving the state is readable on the SAME act() the frame arrived on.
    expect(currentState().badgeState).toStrictEqual({
      state: 'degraded',
      lastHeartbeatAt: '2026-07-28T10:00:00.000Z',
    });

    testingLibraryActAdapter({
      callback: () => {
        proxy.deliverHeartbeat({
          payload: HealthStatusPayloadStub({ status: 'ok', uptimeSeconds: 11520 }),
        });
      },
    });

    testingLibraryActAdapter({
      callback: () => {
        proxy.deliverHeartbeat({
          payload: HealthStatusPayloadStub({ status: 'ok', uptimeSeconds: 11580 }),
        });
      },
    });

    expect(currentState().badgeState).toStrictEqual({
      state: 'online',
      uptimeSeconds: 11580,
      lastHeartbeatAt: '2026-07-28T10:00:00.000Z',
    });
    expect(proxy.getRequestCount()).toBe(1);
  });

  it('VALID: {two heartbeats carrying 11520 then 11580} => badgeState ends at uptimeSeconds 11580', async () => {
    const proxy = useHealthStatusBindingProxy();
    proxy.setupConnectedChannel();
    proxy.setupSeed({
      payload: HealthStatusPayloadStub({ status: 'ok', uptimeSeconds: 11520, version: '1.4.0' }),
    });

    const { result } = testingLibraryRenderHookAdapter({
      renderCallback: () => useHealthStatusBinding(),
    });

    const currentState = (): ReturnType<typeof useHealthStatusBinding> => result.current;

    await testingLibraryWaitForAdapter({
      callback: () => {
        expect(currentState().badgeState.state).toBe('online');
      },
    });

    testingLibraryActAdapter({
      callback: () => {
        proxy.deliverHeartbeat({
          payload: HealthStatusPayloadStub({ status: 'ok', uptimeSeconds: 11520 }),
        });
      },
    });

    testingLibraryActAdapter({
      callback: () => {
        proxy.deliverHeartbeat({
          payload: HealthStatusPayloadStub({ status: 'ok', uptimeSeconds: 11580 }),
        });
      },
    });

    expect(currentState().badgeState).toStrictEqual({
      state: 'online',
      uptimeSeconds: 11580,
      lastHeartbeatAt: '2026-07-28T10:00:00.000Z',
    });
  });

  it('VALID: {socket closes and reconnects} => the first frame after reconnect moves the state out of offline with no retry call', async () => {
    const proxy = useHealthStatusBindingProxy();
    proxy.setupConnectedChannel();
    proxy.setupServerError();

    const { result } = testingLibraryRenderHookAdapter({
      renderCallback: () => useHealthStatusBinding(),
    });

    const currentState = (): ReturnType<typeof useHealthStatusBinding> => result.current;

    await testingLibraryWaitForAdapter({
      callback: () => {
        expect(currentState().badgeState.state).toBe('offline');
      },
    });

    expect(proxy.getRequestCount()).toBe(1);

    proxy.triggerClose();
    proxy.triggerReconnect();

    testingLibraryActAdapter({
      callback: () => {
        proxy.deliverHeartbeat({
          payload: HealthStatusPayloadStub({ status: 'ok', uptimeSeconds: 11520 }),
        });
      },
    });

    expect(currentState().badgeState.state).toBe('online');
    expect(proxy.getRequestCount()).toBe(1);
  });

  it('VALID: {mount then unmount} => releases the channel health-status subscriber', async () => {
    const proxy = useHealthStatusBindingProxy();
    proxy.setupConnectedChannel();
    proxy.setupSeed({
      payload: HealthStatusPayloadStub({ status: 'ok', uptimeSeconds: 11520, version: '1.4.0' }),
    });

    const { result, unmount } = testingLibraryRenderHookAdapter({
      renderCallback: () => useHealthStatusBinding(),
    });

    const currentState = (): ReturnType<typeof useHealthStatusBinding> => result.current;

    await testingLibraryWaitForAdapter({
      callback: () => {
        expect(currentState().badgeState.state).toBe('online');
      },
    });

    expect(webSocketChannelState.hasHealthStatusSubscribers()).toBe(true);

    unmount();

    expect(webSocketChannelState.hasHealthStatusSubscribers()).toBe(false);
  });

  it('VALID: {frame delivered after unmount} => leaves the last state untouched and logs no console error', async () => {
    const proxy = useHealthStatusBindingProxy();
    proxy.setupConnectedChannel();
    proxy.setupSeed({
      payload: HealthStatusPayloadStub({ status: 'ok', uptimeSeconds: 11520, version: '1.4.0' }),
    });

    const { result, unmount } = testingLibraryRenderHookAdapter({
      renderCallback: () => useHealthStatusBinding(),
    });

    const currentState = (): ReturnType<typeof useHealthStatusBinding> => result.current;

    await testingLibraryWaitForAdapter({
      callback: () => {
        expect(currentState().badgeState.state).toBe('online');
      },
    });

    const lastState = currentState().badgeState;

    unmount();

    proxy.deliverHeartbeat({ payload: HealthStatusPayloadStub({ status: 'degraded' }) });

    expect(currentState().badgeState).toStrictEqual(lastState);
    expect(proxy.hadNoConsoleErrors()).toBe(true);
  });

  it('EDGE: {silence tick fires with no heartbeat ever delivered} => badgeState is untouched, still the checking branch', () => {
    const proxy = useHealthStatusBindingProxy();
    proxy.setupConnectedChannel();
    proxy.setupServerError();
    proxy.installSilenceClock();

    const { result, unmount } = testingLibraryRenderHookAdapter({
      renderCallback: () => useHealthStatusBinding(),
    });

    testingLibraryActAdapter({
      callback: () => {
        jest.advanceTimersByTime(60000);
      },
    });

    unmount();
    proxy.restoreRealClock();

    expect(result.current.badgeState).toStrictEqual({ state: 'checking' });
  });

  it('EDGE: {29 seconds of silence since the last heartbeat} => badgeState is still the online branch from that frame', () => {
    const proxy = useHealthStatusBindingProxy();
    proxy.setupConnectedChannel();
    proxy.setupServerError();
    proxy.installSilenceClock();

    const { result, unmount } = testingLibraryRenderHookAdapter({
      renderCallback: () => useHealthStatusBinding(),
    });

    testingLibraryActAdapter({
      callback: () => {
        proxy.deliverHeartbeat({
          payload: HealthStatusPayloadStub({ status: 'ok', uptimeSeconds: 11520 }),
        });
      },
    });

    testingLibraryActAdapter({
      callback: () => {
        jest.advanceTimersByTime(29000);
      },
    });

    unmount();
    proxy.restoreRealClock();

    expect(result.current.badgeState).toStrictEqual({
      state: 'online',
      uptimeSeconds: 11520,
      lastHeartbeatAt: '2026-07-28T10:00:00.000Z',
    });
  });

  it('EDGE: {30 seconds of silence since the last heartbeat} => badgeState becomes the offline branch with offlineCause silence', () => {
    const proxy = useHealthStatusBindingProxy();
    proxy.setupConnectedChannel();
    proxy.setupServerError();
    proxy.installSilenceClock();

    const { result, unmount } = testingLibraryRenderHookAdapter({
      renderCallback: () => useHealthStatusBinding(),
    });

    testingLibraryActAdapter({
      callback: () => {
        proxy.deliverHeartbeat({
          payload: HealthStatusPayloadStub({ status: 'ok', uptimeSeconds: 11520 }),
        });
      },
    });

    testingLibraryActAdapter({
      callback: () => {
        jest.advanceTimersByTime(30000);
      },
    });

    unmount();
    proxy.restoreRealClock();

    expect(result.current.badgeState).toStrictEqual({
      state: 'offline',
      offlineCause: 'silence',
      lastHeartbeatAt: '2026-07-28T10:00:00.000Z',
    });
  });

  it('VALID: {retry after an offline seed} => issues one new seed request and recovers to online with uptime', async () => {
    const proxy = useHealthStatusBindingProxy();
    proxy.setupConnectedChannel();
    proxy.setupServerError();

    const { result } = testingLibraryRenderHookAdapter({
      renderCallback: () => useHealthStatusBinding(),
    });

    const currentState = (): ReturnType<typeof useHealthStatusBinding> => result.current;

    await testingLibraryWaitForAdapter({
      callback: () => {
        expect(currentState().badgeState.state).toBe('offline');
      },
    });

    expect(proxy.getRequestCount()).toBe(1);

    proxy.setupSeed({
      payload: HealthStatusPayloadStub({ status: 'ok', uptimeSeconds: 11520, version: '1.4.0' }),
    });

    testingLibraryActAdapter({
      callback: () => {
        currentState().retry();
      },
    });

    await testingLibraryWaitForAdapter({
      callback: () => {
        expect(currentState().badgeState.state).toBe('online');
      },
    });

    expect(proxy.getRequestCount()).toBe(2);
    expect(currentState().badgeState).toStrictEqual({ state: 'online', uptimeSeconds: 11520 });
  });
});

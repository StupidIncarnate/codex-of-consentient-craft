import { HealthSnapshotStub } from '@dungeonmaster/shared/contracts';

import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';
import { testingLibraryWaitForAdapter } from '../../adapters/testing-library/wait-for/testing-library-wait-for-adapter';
import { useHealthBinding } from './use-health-binding';
import { useHealthBindingProxy } from './use-health-binding.proxy';

describe('useHealthBinding', () => {
  it('VALID: {mount} => issues exactly one GET before any frame, then resolves the snapshot', async () => {
    const proxy = useHealthBindingProxy();
    proxy.setupConnectedChannel();
    const snapshot = HealthSnapshotStub();
    proxy.setupSnapshot({ snapshot });

    const { result } = testingLibraryRenderHookAdapter({
      renderCallback: () => useHealthBinding(),
    });

    const currentState = (): ReturnType<typeof useHealthBinding> => result.current;

    await testingLibraryWaitForAdapter({
      callback: () => {
        expect(proxy.getRequestCount()).toBe(1);
      },
    });

    await testingLibraryWaitForAdapter({
      callback: () => {
        expect(currentState().isLoading).toBe(false);
      },
    });

    expect(result.current).toStrictEqual({
      snapshot,
      isLoading: false,
      error: null,
      refresh: expect.any(Function),
    });
  });

  it('VALID: {health-updated tick} => refetches exactly once per tick', async () => {
    const proxy = useHealthBindingProxy();
    proxy.setupConnectedChannel();
    const initial = HealthSnapshotStub();
    proxy.setupSnapshot({ snapshot: initial });

    const { result } = testingLibraryRenderHookAdapter({
      renderCallback: () => useHealthBinding(),
    });

    const currentState = (): ReturnType<typeof useHealthBinding> => result.current;

    await testingLibraryWaitForAdapter({
      callback: () => {
        expect(currentState().isLoading).toBe(false);
      },
    });

    expect(proxy.getRequestCount()).toBe(1);

    const updated = HealthSnapshotStub({ uptimeSeconds: 900 });
    proxy.setupSnapshot({ snapshot: updated });

    testingLibraryActAdapter({
      callback: () => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'health-updated',
            payload: {},
            timestamp: '2026-05-05T13:00:00.000Z',
          }),
        });
      },
    });

    await testingLibraryWaitForAdapter({
      callback: () => {
        expect(currentState().snapshot).toStrictEqual(updated);
      },
    });

    expect(proxy.getRequestCount()).toBe(2);

    const secondUpdate = HealthSnapshotStub({ uptimeSeconds: 1200 });
    proxy.setupSnapshot({ snapshot: secondUpdate });

    testingLibraryActAdapter({
      callback: () => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'health-updated',
            payload: {},
            timestamp: '2026-05-05T13:00:05.000Z',
          }),
        });
      },
    });

    await testingLibraryWaitForAdapter({
      callback: () => {
        expect(currentState().snapshot).toStrictEqual(secondUpdate);
      },
    });

    expect(proxy.getRequestCount()).toBe(3);
  });

  it('VALID: {unrelated ws type} => does not re-fetch', async () => {
    const proxy = useHealthBindingProxy();
    proxy.setupConnectedChannel();
    const initial = HealthSnapshotStub();
    proxy.setupSnapshot({ snapshot: initial });

    const { result } = testingLibraryRenderHookAdapter({
      renderCallback: () => useHealthBinding(),
    });

    const currentState = (): ReturnType<typeof useHealthBinding> => result.current;

    await testingLibraryWaitForAdapter({
      callback: () => {
        expect(currentState().isLoading).toBe(false);
      },
    });

    expect(proxy.getRequestCount()).toBe(1);

    proxy.setupSnapshot({ snapshot: HealthSnapshotStub({ uptimeSeconds: 4200 }) });

    testingLibraryActAdapter({
      callback: () => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'rate-limits-updated',
            payload: {},
            timestamp: '2026-05-05T13:00:00.000Z',
          }),
        });
      },
    });

    await Promise.resolve();

    expect(result.current).toStrictEqual({
      snapshot: initial,
      isLoading: false,
      error: null,
      refresh: expect.any(Function),
    });
    expect(proxy.getRequestCount()).toBe(1);
  });

  it('INVALID: {200 body missing uptimeSeconds} => takes the offline branch with the parse error', async () => {
    const proxy = useHealthBindingProxy();
    proxy.setupConnectedChannel();
    proxy.setupInvalidBody();

    const { result } = testingLibraryRenderHookAdapter({
      renderCallback: () => useHealthBinding(),
    });

    const currentState = (): ReturnType<typeof useHealthBinding> => result.current;

    await testingLibraryWaitForAdapter({
      callback: () => {
        expect(currentState().isLoading).toBe(false);
      },
    });

    expect(result.current).toStrictEqual({
      snapshot: null,
      isLoading: false,
      error:
        '[\n' +
        '  {\n' +
        '    "code": "invalid_type",\n' +
        '    "expected": "number",\n' +
        '    "received": "undefined",\n' +
        '    "path": [\n' +
        '      "uptimeSeconds"\n' +
        '    ],\n' +
        '    "message": "Required"\n' +
        '  }\n' +
        ']',
      refresh: expect.any(Function),
    });
  });

  it('ERROR: {server 500} => snapshot null, error set', async () => {
    const proxy = useHealthBindingProxy();
    proxy.setupConnectedChannel();
    proxy.setupServerError();

    const { result } = testingLibraryRenderHookAdapter({
      renderCallback: () => useHealthBinding(),
    });

    const currentState = (): ReturnType<typeof useHealthBinding> => result.current;

    await testingLibraryWaitForAdapter({
      callback: () => {
        expect(currentState().isLoading).toBe(false);
      },
    });

    expect(result.current).toStrictEqual({
      snapshot: null,
      isLoading: false,
      error: 'GET /api/health failed with status 500',
      refresh: expect.any(Function),
    });
  });

  it('ERROR: {network error} => snapshot null, error set', async () => {
    const proxy = useHealthBindingProxy();
    proxy.setupConnectedChannel();
    proxy.setupNetworkError();

    const { result } = testingLibraryRenderHookAdapter({
      renderCallback: () => useHealthBinding(),
    });

    const currentState = (): ReturnType<typeof useHealthBinding> => result.current;

    await testingLibraryWaitForAdapter({
      callback: () => {
        expect(currentState().isLoading).toBe(false);
      },
    });

    expect(result.current).toStrictEqual({
      snapshot: null,
      isLoading: false,
      error: 'Failed to fetch',
      refresh: expect.any(Function),
    });
  });

  it('EDGE: {socket close after successful mount} => snapshot flips to null in place, error set', async () => {
    const proxy = useHealthBindingProxy();
    proxy.setupConnectedChannel();
    const snapshot = HealthSnapshotStub();
    proxy.setupSnapshot({ snapshot });

    const { result } = testingLibraryRenderHookAdapter({
      renderCallback: () => useHealthBinding(),
    });

    const currentState = (): ReturnType<typeof useHealthBinding> => result.current;

    await testingLibraryWaitForAdapter({
      callback: () => {
        expect(currentState().isLoading).toBe(false);
      },
    });
    await testingLibraryWaitForAdapter({
      callback: () => {
        expect(currentState().snapshot).toStrictEqual(snapshot);
      },
    });

    testingLibraryActAdapter({
      callback: () => {
        proxy.closeChannel();
      },
    });

    expect(result.current).toStrictEqual({
      snapshot: null,
      isLoading: false,
      error: 'WebSocket connection lost',
      refresh: expect.any(Function),
    });
  });

  it('VALID: {refresh() after a server error} => issues one more GET and swaps the error for the new snapshot', async () => {
    const proxy = useHealthBindingProxy();
    proxy.setupConnectedChannel();
    proxy.setupServerError();

    const { result } = testingLibraryRenderHookAdapter({
      renderCallback: () => useHealthBinding(),
    });

    const currentState = (): ReturnType<typeof useHealthBinding> => result.current;

    await testingLibraryWaitForAdapter({
      callback: () => {
        expect(currentState().isLoading).toBe(false);
      },
    });

    expect(proxy.getRequestCount()).toBe(1);

    const recovered = HealthSnapshotStub();
    proxy.setupSnapshot({ snapshot: recovered });

    const { refresh } = result.current;

    testingLibraryActAdapter({
      callback: () => {
        refresh().catch((error: unknown) => {
          globalThis.console.error('[test] refresh failed', error);
        });
      },
    });

    await testingLibraryWaitForAdapter({
      callback: () => {
        expect(proxy.getRequestCount()).toBe(2);
      },
    });

    await testingLibraryWaitForAdapter({
      callback: () => {
        expect(currentState().error).toBe(null);
      },
    });

    expect(result.current).toStrictEqual({
      snapshot: recovered,
      isLoading: false,
      error: null,
      refresh: expect.any(Function),
    });
  });

  it('VALID: {refresh() after a socket close} => snapshot returns and error clears without waiting on the socket', async () => {
    const proxy = useHealthBindingProxy();
    proxy.setupConnectedChannel();
    const initial = HealthSnapshotStub();
    proxy.setupSnapshot({ snapshot: initial });

    const { result } = testingLibraryRenderHookAdapter({
      renderCallback: () => useHealthBinding(),
    });

    const currentState = (): ReturnType<typeof useHealthBinding> => result.current;

    await testingLibraryWaitForAdapter({
      callback: () => {
        expect(currentState().isLoading).toBe(false);
      },
    });
    await testingLibraryWaitForAdapter({
      callback: () => {
        expect(currentState().snapshot).toStrictEqual(initial);
      },
    });

    testingLibraryActAdapter({
      callback: () => {
        proxy.closeChannel();
      },
    });

    expect(currentState().snapshot).toBe(null);

    const recovered = HealthSnapshotStub({ uptimeSeconds: 900 });
    proxy.setupSnapshot({ snapshot: recovered });

    const { refresh } = result.current;

    testingLibraryActAdapter({
      callback: () => {
        refresh().catch((error: unknown) => {
          globalThis.console.error('[test] refresh failed', error);
        });
      },
    });

    await testingLibraryWaitForAdapter({
      callback: () => {
        expect(currentState().snapshot).toStrictEqual(recovered);
      },
    });

    expect(result.current).toStrictEqual({
      snapshot: recovered,
      isLoading: false,
      error: null,
      refresh: expect.any(Function),
    });
  });
});

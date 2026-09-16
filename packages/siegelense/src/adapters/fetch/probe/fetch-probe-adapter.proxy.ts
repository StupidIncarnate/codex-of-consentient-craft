// PURPOSE: Proxy for fetch-probe-adapter that mocks the global fetch via registerSpyOn
// USAGE: const proxy = fetchProbeAdapterProxy(); proxy.setupReachable({ url });

import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

export const fetchProbeAdapterProxy = (): {
  setupReachable: (params: { url: string }) => void;
  setupServerError: (params: { url: string }) => void;
  setupRedirect: (params: { url: string }) => void;
  setupClientError: (params: { url: string }) => void;
  setupUnreachable: (params: { url: string }) => void;
  setupAborted: (params: { url: string }) => void;
  setupUnexpectedError: (params: { url: string; error: Error }) => void;
} => {
  const handle = registerSpyOn({ object: globalThis, method: 'fetch' });

  return {
    // Keyed on the URL (the first fetch() argument) — a prefix match, so the real call's second
    // `{signal}` argument does not need describing here. `ok` is what the adapter actually reads;
    // `status` rides along so a failing assertion's diff shows a real HTTP status, not just a bool.
    setupReachable: ({ url }: { url: string }): void => {
      handle.calledWith([url]).resolves({ ok: true, status: 200 } as Response);
    },
    // A resolved response, not a rejection — the server is up and answering, just not with success.
    setupServerError: ({ url }: { url: string }): void => {
      handle.calledWith([url]).resolves({ ok: false, status: 500 } as Response);
    },
    setupRedirect: ({ url }: { url: string }): void => {
      handle.calledWith([url]).resolves({ ok: false, status: 302 } as Response);
    },
    setupClientError: ({ url }: { url: string }): void => {
      handle.calledWith([url]).resolves({ ok: false, status: 404 } as Response);
    },
    setupUnreachable: ({ url }: { url: string }): void => {
      handle.calledWith([url]).rejects(new Error('connect ECONNREFUSED'));
    },
    // `Object.assign` rather than `new DOMException(...)`: `mockStagingCreateTransformer`'s
    // `rejects()` re-wraps anything that fails `instanceof Error` in a fresh plain Error via
    // `String(val)`, which loses the `.name` a real DOMException carries — a plain Error with `.name`
    // overridden survives that check and still matches what `fetchProbeAdapter` reads.
    setupAborted: ({ url }: { url: string }): void => {
      handle
        .calledWith([url])
        .rejects(Object.assign(new Error('This operation was aborted'), { name: 'AbortError' }));
    },
    // Any rejection that is neither an abort nor a connection refusal — a malformed URL, a coding
    // defect — must come back out of `fetchProbeAdapter` unchanged rather than reading as "not ready".
    setupUnexpectedError: ({ url, error }: { url: string; error: Error }): void => {
      handle.calledWith([url]).rejects(error);
    },
  };
};

// PURPOSE: Proxy for fetch-probe-adapter that mocks the global fetch via registerSpyOn
// USAGE: const proxy = fetchProbeAdapterProxy(); proxy.setupReachable({ url });

import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

export const fetchProbeAdapterProxy = (): {
  setupReachable: (params: { url: string }) => void;
  setupUnreachable: (params: { url: string }) => void;
} => {
  const handle = registerSpyOn({ object: globalThis, method: 'fetch' });

  return {
    // Keyed on the URL (the first fetch() argument) — a prefix match, so the real call's second
    // `{signal}` argument does not need describing here.
    setupReachable: ({ url }: { url: string }): void => {
      handle.calledWith([url]).resolves({} as Response);
    },
    setupUnreachable: ({ url }: { url: string }): void => {
      handle.calledWith([url]).rejects(new Error('connect ECONNREFUSED'));
    },
  };
};

// PURPOSE: Proxy for fetch-patch-adapter that mocks Node's global fetch via registerSpyOn
// USAGE: const proxy = fetchPatchAdapterProxy(); proxy.setupSuccess(); proxy.setupNetworkError({ error });

import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

const buildResponse = ({
  ok,
  status,
  bodyText,
}: {
  ok: boolean;
  status: number;
  bodyText: string;
}): Response =>
  ({
    ok,
    status,
    text: async () => Promise.resolve(bodyText),
  }) as never;

export const fetchPatchAdapterProxy = (): {
  setupSuccess: () => void;
  setupNotOk: (params: { status: number; bodyText: string }) => void;
  setupNetworkError: (params: { error: Error }) => void;
  getLastCallUrl: () => unknown;
  getLastCallBody: () => unknown;
} => {
  const handle = registerSpyOn({ object: globalThis, method: 'fetch' });
  handle.mockResolvedValue(buildResponse({ ok: true, status: 200, bodyText: '' }));

  return {
    setupSuccess: (): void => {
      handle.mockResolvedValueOnce(buildResponse({ ok: true, status: 200, bodyText: '' }));
    },
    setupNotOk: ({ status, bodyText }: { status: number; bodyText: string }): void => {
      handle.mockResolvedValueOnce(buildResponse({ ok: false, status, bodyText }));
    },
    setupNetworkError: ({ error }: { error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
    getLastCallUrl: (): unknown => {
      const { calls } = handle.mock;
      const lastCall = calls[calls.length - 1];
      return lastCall?.[0];
    },
    getLastCallBody: (): unknown => {
      const { calls } = handle.mock;
      const lastCall = calls[calls.length - 1];
      if (!lastCall) return undefined;
      const init = lastCall[1] as { body?: unknown } | undefined;
      if (!init?.body) return undefined;
      const rawBody = init.body;
      if (typeof rawBody !== 'string') return rawBody;
      try {
        return JSON.parse(rawBody) as unknown;
      } catch {
        return rawBody;
      }
    },
  };
};

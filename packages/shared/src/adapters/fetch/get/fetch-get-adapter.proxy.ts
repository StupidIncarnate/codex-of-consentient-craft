// PURPOSE: Proxy for fetch-get-adapter that mocks Node's global fetch via registerSpyOn
// USAGE: const proxy = fetchGetAdapterProxy(); proxy.setupSuccess({ body: { ok: true } });

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

export const fetchGetAdapterProxy = (): {
  setupSuccess: (params: { body: unknown }) => void;
  setupNotOk: (params: { status: number; bodyText: string }) => void;
  setupInvalidJson: (params: { bodyText: string }) => void;
} => {
  const handle = registerSpyOn({ object: globalThis, method: 'fetch' });

  return {
    setupSuccess: ({ body }: { body: unknown }): void => {
      handle.mockResolvedValueOnce(
        buildResponse({ ok: true, status: 200, bodyText: JSON.stringify(body) }),
      );
    },
    setupNotOk: ({ status, bodyText }: { status: number; bodyText: string }): void => {
      handle.mockResolvedValueOnce(buildResponse({ ok: false, status, bodyText }));
    },
    setupInvalidJson: ({ bodyText }: { bodyText: string }): void => {
      handle.mockResolvedValueOnce(buildResponse({ ok: true, status: 200, bodyText }));
    },
  };
};

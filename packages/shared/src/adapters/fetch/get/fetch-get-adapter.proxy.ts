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
  setupSuccess: (params: { url: string; body: unknown }) => void;
  setupNotOk: (params: { url: string; status: number; bodyText: string }) => void;
  setupInvalidJson: (params: { url: string; bodyText: string }) => void;
} => {
  const handle = registerSpyOn({ object: globalThis, method: 'fetch' });

  return {
    // Keyed on the URL — the first fetch() argument — so two endpoints staged in the same
    // test each answer only their own call, instead of sharing one order-based queue.
    setupSuccess: ({ url, body }: { url: string; body: unknown }): void => {
      handle
        .calledWith([url])
        .resolves(buildResponse({ ok: true, status: 200, bodyText: JSON.stringify(body) }));
    },
    setupNotOk: ({
      url,
      status,
      bodyText,
    }: {
      url: string;
      status: number;
      bodyText: string;
    }): void => {
      handle.calledWith([url]).resolves(buildResponse({ ok: false, status, bodyText }));
    },
    setupInvalidJson: ({ url, bodyText }: { url: string; bodyText: string }): void => {
      handle.calledWith([url]).resolves(buildResponse({ ok: true, status: 200, bodyText }));
    },
  };
};

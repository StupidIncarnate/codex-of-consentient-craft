// PURPOSE: Proxy for fetch-patch-adapter that mocks Node's global fetch via registerSpyOn
// USAGE: const proxy = fetchPatchAdapterProxy(); proxy.setupSuccess({ url }); proxy.setupNetworkError({ url, error });

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
  setupSuccess: (params: { url: string }) => void;
  setupNotOk: (params: { url: string; status: number; bodyText: string }) => void;
  setupNetworkError: (params: { url: string; error: Error }) => void;
} => {
  const handle = registerSpyOn({ object: globalThis, method: 'fetch' });

  return {
    // The URL is the address — two endpoints staged in one test must be told apart by URL, not
    // by which setup call happened to run first.
    setupSuccess: ({ url }: { url: string }): void => {
      handle.calledWith([url]).resolves(buildResponse({ ok: true, status: 200, bodyText: '' }));
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
    setupNetworkError: ({ url, error }: { url: string; error: Error }): void => {
      handle.calledWith([url]).rejects(error);
    },
  };
};

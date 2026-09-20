/**
 * PURPOSE: Mocks global `fetch` — the one npm-adjacent boundary `fetchPostAdapter` calls. Addressed
 * by URL, since two endpoints staged in one test must be told apart by URL, not by call order.
 *
 * USAGE:
 * const proxy = fetchPostAdapterProxy();
 * proxy.succeeds({ url, status: 201, body: '{"id":"g1"}' });
 */
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

export const fetchPostAdapterProxy = (): {
  succeeds: (params: { url: string; status: number; body: string }) => void;
  throws: (params: { url: string; error: Error }) => void;
} => {
  const handle = registerSpyOn({ object: globalThis, method: 'fetch' });

  return {
    succeeds: ({ url, status, body }: { url: string; status: number; body: string }): void => {
      handle.calledWith([url]).resolves({
        status,
        text: async () => Promise.resolve(body),
      } as never);
    },
    throws: ({ url, error }: { url: string; error: Error }): void => {
      handle.calledWith([url]).rejects(error);
    },
  };
};

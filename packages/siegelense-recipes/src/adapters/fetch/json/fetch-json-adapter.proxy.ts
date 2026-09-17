// PURPOSE: Proxy for fetch-json-adapter — mocks the global fetch via registerSpyOn, addressed by
// url AND by the request init, so a POST and a PATCH to the same route never answer each other.
// USAGE: const proxy = fetchJsonAdapterProxy(); proxy.answers({ url, method, body: { id: 'g1' } });

import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

export const fetchJsonAdapterProxy = (): {
  answers: (params: { url: string; method: string; body: unknown }) => void;
  answersOnce: (params: { url: string; method: string; body: unknown }) => void;
  refuses: (params: { url: string; method: string; status: number; body: string }) => void;
  answersNonJson: (params: { url: string; method: string; body: string }) => void;
  requestsMatching: (params: { url: string; method: string }) => readonly unknown[][];
  allRequests: () => RecordedCalls;
} => {
  const handle = registerSpyOn({ object: globalThis, method: 'fetch' });

  return {
    // Addressed by url plus a partial init object — objects compare only on the keys written, so
    // `{ method }` matches the real call's full `{ method, headers, body }` init while still
    // telling a POST apart from a PATCH to the same route.
    answers: ({ url, method, body }: { url: string; method: string; body: unknown }): void => {
      handle.calledWith([url, { method }]).resolves({
        ok: true,
        status: 200,
        text: async () => Promise.resolve(JSON.stringify(body)),
      } as Response);
    },
    // Same address, applied ONCE — three POSTs to one route have to answer three different ids,
    // and a second `calledWith` at the same specificity would silently replace the first.
    answersOnce: ({ url, method, body }: { url: string; method: string; body: unknown }): void => {
      handle.onceFor([url, { method }]).resolves({
        ok: true,
        status: 200,
        text: async () => Promise.resolve(JSON.stringify(body)),
      } as Response);
    },
    refuses: ({
      url,
      method,
      status,
      body,
    }: {
      url: string;
      method: string;
      status: number;
      body: string;
    }): void => {
      handle.calledWith([url, { method }]).resolves({
        ok: false,
        status,
        text: async () => Promise.resolve(body),
      } as Response);
    },
    answersNonJson: ({
      url,
      method,
      body,
    }: {
      url: string;
      method: string;
      body: string;
    }): void => {
      handle.calledWith([url, { method }]).resolves({
        ok: true,
        status: 200,
        text: async () => Promise.resolve(body),
      } as Response);
    },
    requestsMatching: ({ url, method }: { url: string; method: string }): readonly unknown[][] =>
      handle.callsMatching([url, { method }]),
    allRequests: (): RecordedCalls => handle.callsMatching([]),
  };
};

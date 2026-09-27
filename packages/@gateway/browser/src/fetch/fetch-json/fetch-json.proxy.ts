import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { ConnectionRefusedErrorStub } from '#gateway/node/net/connection-refused-error/connection-refused-error.stub';
import type { ValueMatcher } from '../../gateway-test-support/value-matcher';

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

export const fetchJsonProxy = (): {
  setupSuccess: (params: { url: string; body: unknown }) => void;
  setupNotOk: (params: { url: string; status: number; bodyText: string }) => void;
  setupInvalidJson: (params: { url: string; bodyText: string }) => void;
  setupEmptyBody: (params: { url: string }) => void;
  setupConnectionRefused: (params: { url: string }) => Promise<void>;
  setupAborted: (params: { url: string }) => void;
  returnsMatchingUrl: (params: { url: ValueMatcher; body: unknown }) => void;
  getCallsFor: (params: { url: ValueMatcher }) => readonly unknown[][];
} => {
  const handle = registerSpyOn({ object: globalThis, method: 'fetch' });

  return {
    // Keyed on the URL — the first fetch() argument — so two endpoints staged in one test each
    // answer only their own call.
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
    setupEmptyBody: ({ url }: { url: string }): void => {
      handle.calledWith([url]).resolves(buildResponse({ ok: true, status: 200, bodyText: '' }));
    },
    setupConnectionRefused: async ({ url }: { url: string }): Promise<void> => {
      handle.calledWith([url]).rejects(await ConnectionRefusedErrorStub());
    },
    setupAborted: ({ url }: { url: string }): void => {
      handle
        .calledWith([url])
        .rejects(Object.assign(new Error('This operation was aborted'), { name: 'AbortError' }));
    },

    returnsMatchingUrl: ({ url, body }: { url: ValueMatcher; body: unknown }): void => {
      handle
        .calledWith([url])
        .resolves(buildResponse({ ok: true, status: 200, bodyText: JSON.stringify(body) }));
    },

    getCallsFor: ({ url }: { url: ValueMatcher }): readonly unknown[][] =>
      handle.callsMatching([url]),
  };
};

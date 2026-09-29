import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { AbortErrorStub } from '../abort-error/abort-error.stub';

const HTTP_OK_STATUS_MIN = 200;
const HTTP_OK_STATUS_MAX_EXCLUSIVE = 300;

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

export const fetchWithStatusProxy = (): {
  setupResponse: (params: { url: string; status: number; bodyText: string }) => void;
  setupRefused: (params: { url: string; cause: Error }) => void;
  setupAbortImmediate: (params: { url: string }) => void;
  setupAbortsOnSignal: (params: { url: string }) => void;
  getCallsFor: (params: { url: string }) => readonly unknown[][];
} => {
  const handle = registerSpyOn({ object: globalThis, method: 'fetch' });

  return {
    // Keyed on the URL — the first fetch() argument — so two endpoints staged in one test each
    // answer only their own call. `ok` is derived from `status`, exactly as the real Response does.
    setupResponse: ({
      url,
      status,
      bodyText,
    }: {
      url: string;
      status: number;
      bodyText: string;
    }): void => {
      handle.calledWith([url]).resolves(
        buildResponse({
          ok: status >= HTTP_OK_STATUS_MIN && status < HTTP_OK_STATUS_MAX_EXCLUSIVE,
          status,
          bodyText,
        }),
      );
    },
    // `cause` carries its own `.cause` chain (a duck-typed error with `.code`), so the rejection
    // this stages matches what Node's real `fetch` raises for a refused socket.
    setupRefused: ({ url, cause }: { url: string; cause: Error }): void => {
      handle.calledWith([url]).rejects(new TypeError('fetch failed', { cause }));
    },
    setupAbortImmediate: ({ url }: { url: string }): void => {
      handle.calledWith([url]).implement(async () => Promise.reject(AbortErrorStub()));
    },
    // Only rejects once the real `AbortController` this adapter builds actually fires its signal —
    // proves the internal timer is wired to the fetch call rather than merely swallowing an
    // unconditional rejection.
    setupAbortsOnSignal: ({ url }: { url: string }): void => {
      handle.calledWith([url]).implement(
        async (_url: string, init: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => {
              reject(AbortErrorStub());
            });
          }),
      );
    },
    // The full `(url, init)` tuple of every fetch call to that url, in call order.
    getCallsFor: ({ url }: { url: string }): readonly unknown[][] => handle.callsMatching([url]),
  };
};

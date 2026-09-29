import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { AbortErrorStub } from '../abort-error/abort-error.stub';

const NULL_BODY_TEXT = '';

export const fetchWithStatusProxy = (): {
  setupResponse: (params: {
    url: string;
    status: number;
    bodyText: string;
    statusText?: string;
  }) => void;
  setupRefused: (params: { url: string; cause: Error }) => void;
  setupAbortImmediate: (params: { url: string }) => void;
  setupAbortsOnSignal: (params: { url: string }) => void;
  getCallsFor: (params: { url: string }) => readonly unknown[][];
} => {
  const handle = registerSpyOn({ object: globalThis, method: 'fetch' });

  return {
    // Keyed on the URL — the first fetch() argument — so two endpoints staged in one test each
    // answer only their own call. Each call builds a fresh real Response (a body reads once), so
    // `ok` derives from `status` exactly as in production; `statusText` is empty unless staged.
    setupResponse: ({
      url,
      status,
      bodyText,
      statusText,
    }: {
      url: string;
      status: number;
      bodyText: string;
      statusText?: string;
    }): void => {
      handle.calledWith([url]).implement(async () =>
        Promise.resolve(
          new Response(bodyText === NULL_BODY_TEXT ? null : bodyText, {
            status,
            ...(statusText === undefined ? {} : { statusText }),
          }),
        ),
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

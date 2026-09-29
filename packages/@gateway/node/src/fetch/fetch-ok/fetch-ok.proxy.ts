import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { ConnectionRefusedRecordedErrorStub } from '../../net/connection-refused-recorded-error/connection-refused-recorded-error.stub';
import { AbortErrorStub } from '../abort-error/abort-error.stub';

export const fetchOkProxy = (): {
  setupReachable: (params: { url: string }) => void;
  setupServerError: (params: { url: string }) => void;
  setupClientError: (params: { url: string }) => void;
  setupUnreachable: (params: { url: string }) => void;
  setupAborted: (params: { url: string }) => void;
  setupUnexpectedError: (params: { url: string; error: Error }) => void;
  getCallsFor: (params: { url: string }) => readonly unknown[][];
} => {
  const handle = registerSpyOn({ object: globalThis, method: 'fetch' });

  return {
    // Keyed on the URL (fetch's first argument) — a prefix match, so the real call's second
    // `{signal}` argument does not need describing here.
    setupReachable: ({ url }: { url: string }): void => {
      handle.calledWith([url]).resolves({ ok: true, status: 200 } as Response);
    },
    setupServerError: ({ url }: { url: string }): void => {
      handle.calledWith([url]).resolves({ ok: false, status: 500 } as Response);
    },
    setupClientError: ({ url }: { url: string }): void => {
      handle.calledWith([url]).resolves({ ok: false, status: 404 } as Response);
    },
    setupUnreachable: ({ url }: { url: string }): void => {
      // `fetch` wraps the socket error as the `.cause` of `TypeError: fetch failed`. The cause is the
      // recorded-as-data stub: the capturing one opens a socket, which a composer's I/O trap stops.
      handle
        .calledWith([url])
        .implement(async () =>
          Promise.reject(
            new TypeError('fetch failed', { cause: ConnectionRefusedRecordedErrorStub() }),
          ),
        );
    },
    setupAborted: ({ url }: { url: string }): void => {
      handle.calledWith([url]).implement(async () => Promise.reject(AbortErrorStub()));
    },
    setupUnexpectedError: ({ url, error }: { url: string; error: Error }): void => {
      handle.calledWith([url]).rejects(error);
    },
    getCallsFor: ({ url }: { url: string }): readonly unknown[][] => handle.callsMatching([url]),
  };
};

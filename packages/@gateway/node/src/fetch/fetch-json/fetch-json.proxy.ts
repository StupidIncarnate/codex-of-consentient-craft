import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { AbortErrorStub } from '../abort-error/abort-error.stub';
import { ConnectionRefusedRecordedErrorStub } from '../../net/connection-refused-recorded-error/connection-refused-recorded-error.stub';

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
  setupConnectionRefused: (params: { url: string }) => void;
  setupAborted: (params: { url: string }) => void;
  getCallsFor: (params: { url: string }) => readonly unknown[][];
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
    // The recorded-as-data stub: the capturing one opens a socket, which a composer's I/O trap stops.
    setupConnectionRefused: ({ url }: { url: string }): void => {
      handle.calledWith([url]).rejects(ConnectionRefusedRecordedErrorStub());
    },
    setupAborted: ({ url }: { url: string }): void => {
      handle.calledWith([url]).implement(async () => Promise.reject(AbortErrorStub()));
    },
    // The full `(url, init)` tuple of every fetch call to that url, in call order.
    getCallsFor: ({ url }: { url: string }): readonly unknown[][] => handle.callsMatching([url]),
  };
};

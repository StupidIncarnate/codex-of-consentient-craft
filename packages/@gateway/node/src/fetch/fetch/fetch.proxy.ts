import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

const NULL_BODY_TEXT = '';

// Keyed on the URL — the first fetch() argument — so two endpoints staged in one test each answer
// only their own call. Every call builds a fresh Response: a body can be read once, so one shared
// instance would fail the second reader. Nothing answers a URL no method staged: the spy throws.
export const fetchProxy = (): {
  setupResponse: (params: {
    url: string;
    status: number;
    bodyText: string;
    headers?: Record<string, string>;
  }) => void;
  setupRefused: (params: { url: string; cause: Error }) => void;
  callsMatching: (params: { url: string }) => RecordedCalls;
} => {
  const handle = registerSpyOn({ object: globalThis, method: 'fetch' });

  return {
    setupResponse: ({
      url,
      status,
      bodyText,
      headers,
    }: {
      url: string;
      status: number;
      bodyText: string;
      headers?: Record<string, string>;
    }): void => {
      handle.calledWith([url]).implement(async () =>
        Promise.resolve(
          new Response(bodyText === NULL_BODY_TEXT ? null : bodyText, {
            status,
            ...(headers === undefined ? {} : { headers }),
          }),
        ),
      );
    },

    // `cause` carries its own `.code`, so the rejection matches what Node's real `fetch` raises
    // for a refused socket.
    setupRefused: ({ url, cause }: { url: string; cause: Error }): void => {
      handle.calledWith([url]).rejects(new TypeError('fetch failed', { cause }));
    },

    callsMatching: ({ url }: { url: string }): RecordedCalls => handle.callsMatching([url]),
  };
};

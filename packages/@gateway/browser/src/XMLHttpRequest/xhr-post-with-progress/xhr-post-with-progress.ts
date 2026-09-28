/// <reference lib="dom" />
/**
 * PURPOSE: POSTs a JSON body via `XMLHttpRequest` and reports upload progress while it is in
 * flight — the only browser API that reports bytes sent; `fetch` gives no signal until the request
 * settles. Resolves `{status, ok, body}` for ANY response, with `body` the raw response text left
 * unparsed (the `fetchWithStatus` shape). Rejects, naming `url`, only when no response arrived: a
 * network error, a timeout or an abort. `onProgress` fires only for length-computable events.
 *
 * USAGE:
 * const result = await xhrPostWithProgress({
 *   url: '/api/quests/abc/chat',
 *   body: { text: 'hello' },
 *   onProgress: ({ bytesSent, bytesTotal }) => setPercent(bytesSent, bytesTotal),
 * });
 * // result = { status, ok, body } — body is the raw response text, never parsed
 */

const OK_MIN = 200;
const OK_MAX = 300;

export const xhrPostWithProgress = async ({
  url,
  body,
  onProgress,
}: {
  url: string;
  body: unknown;
  onProgress: (params: { bytesSent: number; bytesTotal: number }) => void;
}): Promise<{ status: number; ok: boolean; body: string }> =>
  new Promise((resolve, reject) => {
    // Read at call time: a test harness may replace the global after this module loads.
    const xhr = new globalThis.XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');

    xhr.upload.addEventListener('progress', (event): void => {
      if (!event.lengthComputable) {
        return;
      }
      onProgress({ bytesSent: event.loaded, bytesTotal: event.total });
    });

    xhr.addEventListener('load', (): void => {
      resolve({
        status: xhr.status,
        ok: xhr.status >= OK_MIN && xhr.status < OK_MAX,
        body: xhr.responseText,
      });
    });

    xhr.addEventListener('error', (): void => {
      reject(new Error(`POST ${url} failed: network error`));
    });

    xhr.addEventListener('timeout', (): void => {
      reject(new Error(`POST ${url} failed: timed out`));
    });

    // An aborted XHR fires neither load, error nor timeout; without this the promise never settles.
    xhr.addEventListener('abort', (): void => {
      reject(new Error(`POST ${url} failed: aborted`));
    });

    xhr.send(typeof body === 'string' ? body : JSON.stringify(body));
  });

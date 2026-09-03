/**
 * PURPOSE: Reach for this over fetchPostWithStatusAdapter when the caller needs to observe upload
 * progress while a large request body (a chat message carrying several pasted images, tens of MB of
 * base64) is still in flight — XMLHttpRequest's `upload` progress event is the only browser API that
 * reports bytes sent, and `fetch` gives no signal until the whole request settles. `ok` is derived
 * from `httpStatusStatics.ok`'s min/max boundary, matching fetch's own `Response.ok` definition
 * without hardcoding that pair here; a status the result contract refuses rejects the returned
 * promise rather than leaving it unsettled.
 *
 * USAGE:
 * const result = await xhrPostWithProgressAdapter({
 *   url: '/api/quests/abc/messages',
 *   body: { text: 'hello' },
 *   onProgress: ({ bytesSent, bytesTotal }) => setPercent(bytesSent, bytesTotal),
 * });
 * // result = { status, ok, body } — same shape as fetchPostWithStatusAdapter
 */

import { byteLengthContract } from '../../../contracts/byte-length/byte-length-contract';
import { fetchPostWithStatusResultContract } from '../../../contracts/fetch-post-with-status-result/fetch-post-with-status-result-contract';
import { uploadProgressPostContract } from '../../../contracts/upload-progress-post/upload-progress-post-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import type { FetchPostWithStatusResult } from '../../../contracts/fetch-post-with-status-result/fetch-post-with-status-result-contract';
import type { UploadProgressHandler } from '../../../contracts/upload-progress-post/upload-progress-post-contract';

export const xhrPostWithProgressAdapter = async ({
  url,
  body,
  onProgress,
}: {
  url: string;
  body: unknown;
  onProgress: UploadProgressHandler;
}): Promise<FetchPostWithStatusResult> =>
  new Promise((resolve, reject) => {
    const { url: validatedUrl } = uploadProgressPostContract.parse({ url, body, onProgress });
    const xhr = new globalThis.XMLHttpRequest();
    xhr.open('POST', validatedUrl);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');

    xhr.upload.addEventListener('progress', (event): void => {
      if (!event.lengthComputable) {
        return;
      }
      onProgress({
        bytesSent: byteLengthContract.parse(event.loaded),
        bytesTotal: byteLengthContract.parse(event.total),
      });
    });

    xhr.addEventListener('load', (): void => {
      const text = xhr.responseText;
      let parsedBody: unknown = null;
      if (text.length > 0) {
        try {
          parsedBody = JSON.parse(text) as unknown;
        } catch {
          parsedBody = text;
        }
      }

      try {
        resolve(
          fetchPostWithStatusResultContract.parse({
            status: xhr.status,
            ok: xhr.status >= httpStatusStatics.ok.min && xhr.status < httpStatusStatics.ok.max,
            body: parsedBody,
          }),
        );
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });

    xhr.addEventListener('error', (): void => {
      reject(new Error(`xhrPostWithProgressAdapter: network error posting to ${validatedUrl}`));
    });

    xhr.addEventListener('timeout', (): void => {
      reject(new Error(`xhrPostWithProgressAdapter: request to ${validatedUrl} timed out`));
    });

    // Without this, an aborted request (the browser tearing down the connection, a caller
    // cancelling in some other way) fires neither 'load' nor 'error' nor 'timeout', so the promise
    // above never settles — every caller awaiting it, and everything gated on that await
    // (`.then`/`.catch`/`.finally` chains further up), hangs until a full page reload. `abort` is
    // its own terminal XHR event precisely because it is neither a success nor a network failure.
    xhr.addEventListener('abort', (): void => {
      reject(new Error(`xhrPostWithProgressAdapter: request to ${validatedUrl} was aborted`));
    });

    xhr.send(JSON.stringify(body));
  });

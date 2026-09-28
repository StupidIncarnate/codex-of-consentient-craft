/**
 * PURPOSE: Turns an HTTP response envelope into what the hydration runner's `record`
 * contract expects — the parsed body on a success status — or throws HttpEnvelopeFailureError
 * carrying url, status, and body on a non-2xx status code.
 *
 * USAGE:
 * dmHttpResponseUnwrapTransformer({ response: { status: 200, body: { id: 'g1' } }, url: 'http://x/api/guilds' });
 * // Returns { id: 'g1' } on success; throws HttpEnvelopeFailureError otherwise
 */
import { HttpEnvelopeFailureError } from '@dungeonmaster/hydration/errors';
import { isHttpStatusSuccessGuard } from '../../guards/is-http-status-success/is-http-status-success-guard';
import type { DmHttpResponse } from '../../contracts/dm-http-response/dm-http-response-contract';

export const dmHttpResponseUnwrapTransformer = <T>({
  response,
  url,
}: {
  response: DmHttpResponse<T>;
  url: string;
}): T => {
  if (isHttpStatusSuccessGuard({ status: response.status })) {
    return response.body;
  }

  throw new HttpEnvelopeFailureError({
    url,
    status: response.status,
    body: JSON.stringify(response.body),
  });
};

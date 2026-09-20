/**
 * PURPOSE: Turns `dmHttpRequestAdapter`'s envelope into what the hydration runner's `record`
 * contract expects — the parsed body on a success status — or throws the shape
 * `routeFailureTransformer` mines (`url`, `status`, `body`) on anything else. Reach for this from
 * every `api` route rather than handing the runner the envelope directly: `guildContract` and
 * `questContract` can never parse `{ status, body }`, so an unwrapped envelope fails every create,
 * successful ones included — the runner has no way to tell an envelope from a record that
 * legitimately owns fields named `status` or `body`, so the route is what has to know.
 *
 * USAGE:
 * dmHttpResponseUnwrapAdapter({ response: { status: 201, body: { id: 'g1' } }, url: 'http://x/api/guilds' });
 * // Returns { id: 'g1' } on a success status; throws naming url/status/body otherwise
 */
import { isHttpStatusSuccessGuard } from '../../../guards/is-http-status-success/is-http-status-success-guard';
import type { DmHttpResponse } from '../../../contracts/dm-http-response/dm-http-response-contract';

export const dmHttpResponseUnwrapAdapter = ({
  response,
  url,
}: {
  response: DmHttpResponse;
  url: string;
}): unknown => {
  if (isHttpStatusSuccessGuard({ status: response.status })) {
    return response.body;
  }

  throw Object.assign(new Error(`${url} answered ${String(response.status)}`), {
    url,
    status: response.status,
    body: JSON.stringify(response.body),
  });
};

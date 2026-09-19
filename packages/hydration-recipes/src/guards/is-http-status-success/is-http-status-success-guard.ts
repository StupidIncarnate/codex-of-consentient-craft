/**
 * PURPOSE: True for any HTTP status in the [200, 300) success range. Reach for this wherever an
 * `api` route decides whether `dmHttpRequestAdapter`'s resolved response is a record to trust or a
 * failure to report — the adapter itself never throws for a bad status (it resolves for every
 * status a real server answers with), so every `api` route makes this call before touching the
 * body.
 *
 * USAGE:
 * isHttpStatusSuccessGuard({ status: DmHttpResponseStub({ status: 201 }).status });
 * // Returns true
 */
import type { DmHttpResponse } from '../../contracts/dm-http-response/dm-http-response-contract';

const HTTP_SUCCESS_STATUS_FLOOR = 200;
const HTTP_SUCCESS_STATUS_CEILING = 300;

export const isHttpStatusSuccessGuard = ({
  status,
}: {
  status?: DmHttpResponse['status'];
}): boolean => {
  if (status === undefined) {
    return false;
  }
  return status >= HTTP_SUCCESS_STATUS_FLOOR && status < HTTP_SUCCESS_STATUS_CEILING;
};

/**
 * PURPOSE: Logs one finished HTTP request — called by `RequestLogFlow`'s catch-all middleware once
 * the route handler has answered. The error detail on a failed request comes from the thrown
 * error when a handler threw, else from the response body for any 5xx, since most responders
 * catch their own failure and answer `500 { error }` rather than throwing, and that body is the
 * only record of why. The body is read off a clone, so the client still receives it whole.
 * Writing is gated in `processRequestLogAdapter`; reach for this over `processDevLogAdapter`,
 * which carries the `[dev]` event stream.
 *
 * USAGE:
 * await ServerRequestLogResponder({ method: 'GET', path: '/api/guilds', response, durationMs: 12, error: undefined });
 * // Writes '[http] info GET /api/guilds 200 12ms' when DUNGEONMASTER_REQUEST_LOG=1
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { processRequestLogAdapter } from '../../../adapters/process/request-log/process-request-log-adapter';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import { errorFormatReasonTransformer } from '../../../transformers/error-format-reason/error-format-reason-transformer';
import { requestLogLineTransformer } from '../../../transformers/request-log-line/request-log-line-transformer';

export const ServerRequestLogResponder = async ({
  method,
  path,
  response,
  durationMs,
  error,
}: {
  method: string;
  path: string;
  response: Response;
  durationMs: number;
  error: unknown;
}): Promise<AdapterResult> => {
  const detail =
    error === undefined
      ? response.status >= httpStatusStatics.serverError.internal
        ? await response
            .clone()
            .text()
            .catch(
              (bodyError: unknown) =>
                `response body unreadable: ${errorFormatReasonTransformer({ error: bodyError })}`,
            )
        : null
      : errorFormatReasonTransformer({ error });

  return processRequestLogAdapter({
    line: requestLogLineTransformer({
      method,
      path,
      status: response.status,
      durationMs,
      detail,
    }),
  });
};

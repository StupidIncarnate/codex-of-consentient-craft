/**
 * PURPOSE: Builds the one `[http]` line the API server writes per request when request logging is
 * on — level, method, path, status, duration, and the error detail a failed request carries. The
 * level word leads the line so a reader of the raw log (siegelense's `results --kind server
 * --where-level error` matches the word `error`) can tell a 500 from a 200 without parsing it:
 * `error` for any 5xx (a thrown handler answers 500), `warn` for a 4xx, `info` otherwise. Reach for this over
 * `devLogEventFormatTransformer`, which formats orchestration events for the `[dev]` stream.
 *
 * USAGE:
 * requestLogLineTransformer({ method: 'GET', path: '/api/guilds', status: 500, durationMs: 4, detail: '{"error":"boom"}' });
 * // Returns '[http] error GET /api/guilds 500 4ms: {"error":"boom"}'
 */

import { devLogLineContract } from '../../contracts/dev-log-line/dev-log-line-contract';
import type { DevLogLine } from '../../contracts/dev-log-line/dev-log-line-contract';
import { httpStatusStatics } from '../../statics/http-status/http-status-statics';

export const requestLogLineTransformer = ({
  method,
  path,
  status,
  durationMs,
  detail,
}: {
  method: string;
  path: string;
  status: number;
  durationMs: number;
  detail: string | null;
}): DevLogLine => {
  // A multi-line body or stack would split one request across several log lines, and a reader
  // slicing the log by line would then see fragments with no method or path on them.
  const flatDetail = detail === null ? '' : detail.replace(/\s*\n\s*/gu, ' ').trim();

  const level =
    status >= httpStatusStatics.serverError.internal
      ? 'error'
      : status >= httpStatusStatics.clientError.badRequest
        ? 'warn'
        : 'info';

  const suffix = flatDetail.length === 0 ? '' : `: ${flatDetail}`;

  return devLogLineContract.parse(
    `[http] ${level} ${method} ${path} ${String(status)} ${String(durationMs)}ms${suffix}`,
  );
};

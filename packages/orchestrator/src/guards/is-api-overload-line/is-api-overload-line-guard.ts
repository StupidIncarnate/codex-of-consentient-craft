/**
 * PURPOSE: True when a raw Claude CLI output line carries an upstream API overload marker
 *          (HTTP 529 / `overloaded_error`). The dispatch spawn layer pairs this with a non-zero
 *          exit code to tell "the API was down" apart from "the agent crashed", because only the
 *          first is worth waiting out.
 *
 * USAGE:
 * isApiOverloadLineGuard({ line: 'API Error: 529 Overloaded.' });
 * // Returns true
 * isApiOverloadLineGuard({ line: '{"type":"assistant","message":{}}' });
 * // Returns false
 *
 * WHEN-NOT-TO-USE: On its own as a failure verdict — a line can mention 529 in an agent's prose.
 *   Always gate on the child's exit code as well.
 */

import { apiOverloadRetryStatics } from '../../statics/api-overload-retry/api-overload-retry-statics';

export const isApiOverloadLineGuard = ({ line }: { line?: string }): boolean => {
  if (line === undefined) {
    return false;
  }
  return apiOverloadRetryStatics.markers.some((marker) => line.includes(marker));
};

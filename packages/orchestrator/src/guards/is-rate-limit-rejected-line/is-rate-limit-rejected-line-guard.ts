/**
 * PURPOSE: True when a raw Claude CLI output line carries a quota-refusal marker (HTTP 429). Reach
 *   for this over isApiOverloadLineGuard, which matches the 529 case: both guards answer "did the
 *   upstream kill this child", but the answers diverge on what to do next. A 529 is waited out in
 *   place by respawning the same child; a 429 means every child would die the same way, so the
 *   whole queue holds instead.
 *
 * USAGE:
 * isRateLimitRejectedLineGuard({ line: "You've hit your weekly limit · resets Sep 12, 11pm" });
 * // Returns true
 *
 * WHEN-NOT-TO-USE: On its own as a failure verdict — an agent can print any of these strings as
 *   prose. Always pair it with the child's non-zero exit code, as the spawn layer does.
 */

import { rateLimitRejectionStatics } from '../../statics/rate-limit-rejection/rate-limit-rejection-statics';

export const isRateLimitRejectedLineGuard = ({ line }: { line?: string }): boolean => {
  if (line === undefined) {
    return false;
  }
  return rateLimitRejectionStatics.markers.some((marker) => line.includes(marker));
};

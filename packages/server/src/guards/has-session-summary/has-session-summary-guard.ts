/**
 * PURPOSE: Checks whether a session list entry has an extracted summary for display
 *
 * USAGE:
 * hasSessionSummaryGuard({ session: { summary: SessionSummaryStub() } }); // true
 * hasSessionSummaryGuard({ session: {} }); // false
 */

import type { SessionSummary } from '../../contracts/session-summary/session-summary-contract';

export const hasSessionSummaryGuard = ({
  session,
}: {
  session?: { summary?: SessionSummary };
}): boolean => {
  if (!session) {
    return false;
  }

  return session.summary !== undefined;
};

/**
 * PURPOSE: Checks whether a session list entry has an extracted summary for display
 *
 * USAGE:
 * hasSessionSummaryGuard({ session: { summary: SessionSummaryStub() } }); // true
 * hasSessionSummaryGuard({ session: {} }); // false
 */

export const hasSessionSummaryGuard = ({
  session,
}: {
  session?: { summary?: string };
}): boolean => {
  if (!session) {
    return false;
  }

  return session.summary !== undefined;
};

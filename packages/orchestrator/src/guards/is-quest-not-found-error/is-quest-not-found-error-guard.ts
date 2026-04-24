/**
 * PURPOSE: Detects errors thrown by questFindQuestPathBroker when a quest id has no matching folder in any guild, so callers can distinguish a gone quest from other load failures
 *
 * USAGE:
 * isQuestNotFoundErrorGuard({ error });
 * // Returns: true when error is an Error whose message matches /not found in any guild/, false otherwise
 *
 * WHEN-TO-USE: Long-running loops that touch a quest by id and must stop cleanly when the quest is deleted or
 * abandoned mid-run (e.g. smoketest scenario driver poll sweep).
 * WHEN-NOT-TO-USE: For generic error classification — this guard is narrow to the "no guild contains this quest" path.
 */

export const isQuestNotFoundErrorGuard = ({ error }: { error?: unknown }): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }
  return error.message.includes('not found in any guild');
};

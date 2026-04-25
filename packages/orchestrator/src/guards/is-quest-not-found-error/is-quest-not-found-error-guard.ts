/**
 * PURPOSE: Detects errors thrown by questFindQuestPathBroker (no matching folder in any guild) OR by guildGetBroker (guild removed from config), so callers can distinguish a gone-quest / gone-guild from other load failures
 *
 * USAGE:
 * isQuestNotFoundErrorGuard({ error });
 * // Returns: true when error is an Error whose message matches /not found in any guild/ OR /Guild not found:/, false otherwise
 *
 * WHEN-TO-USE: Long-running loops that touch a quest by id and must stop cleanly when the quest or its guild is deleted or
 * abandoned mid-run (e.g. queue-runner advancing past a stale entry whose guild was removed by a test cleanup).
 * WHEN-NOT-TO-USE: For generic error classification — this guard is narrow to the "no guild contains this quest" / "guild gone" path.
 */

export const isQuestNotFoundErrorGuard = ({ error }: { error?: unknown }): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }
  return (
    error.message.includes('not found in any guild') || error.message.includes('Guild not found:')
  );
};

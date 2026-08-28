/**
 * PURPOSE: Holds the one work-item role a ward verdict may be applied to, and the sentence handed
 * back to a caller that named a different one. The text lives here rather than inline at the throw
 * because it is written for a WORKER minion — the caller that reaches for the `run-ward` MCP tool
 * by hand mid-chunk to capture red-phase evidence — and its whole job is to redirect that session
 * to the scoped Bash ward run it actually wanted, which is content rather than a diagnostic.
 *
 * Reach for `requiredRole` here rather than `workItemRoleStatics.command`: that tuple answers "does
 * a dispatcher run this itself" and holds `riftcarver` as well, and a `run-ward` aimed at a
 * riftcarver item has to be refused exactly as hard as one aimed at a codeweaver item.
 *
 * USAGE:
 * runWardRefusalStatics.requiredRole;
 * // Returns 'ward'
 * runWardRefusalStatics.messageTemplate
 *   .replace('$WORK_ITEM_ID', () => String(workItemId))
 *   .replace('$QUEST_ID', () => String(questId))
 *   .replace('$ROLE', () => String(role));
 * // Returns the refusal text, every placeholder filled in once
 */

export const runWardRefusalStatics = {
  requiredRole: 'ward',
  messageTemplate:
    'run-ward refused: work item $WORK_ITEM_ID on quest $QUEST_ID has role "$ROLE", not "ward". run-ward is the dispatcher\'s tool for a ward work item: it stamps the named item in_progress, resets its startedAt, and writes ward\'s exit code onto it as a terminal status — so aimed at any other item it marks a session that is still running failed with errorMessage "ward_failed". To capture ward evidence for your own chunk, run ward yourself from Bash instead: npm run ward -- -- <your own files>',
} as const;

/**
 * PURPOSE: Quest statuses that allow starting or restarting the execution pipeline
 *
 * USAGE:
 * startableQuestStatusesStatics.includes(quest.status);
 * // Returns true if the quest can be started/restarted
 */

export const startableQuestStatusesStatics = [
  'approved',
  'design_approved',
  'in_progress',
] as const;

/**
 * PURPOSE: Quest statuses that indicate an active quest that should be recovered on server restart
 *
 * USAGE:
 * recoverableQuestStatusesStatics.some((s) => s === quest.status);
 * // Returns true if the quest should be auto-recovered
 */

export const recoverableQuestStatusesStatics = [
  'created',
  'pending',
  'explore_flows',
  'flows_approved',
  'explore_observables',
  'explore_design',
  'seek_scope',
  'seek_synth',
  'seek_walk',
  'seek_plan',
  'in_progress',
] as const;

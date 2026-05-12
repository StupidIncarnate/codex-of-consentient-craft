/**
 * PURPOSE: Ships the curated cap on how many steps a single codeweaver/lawbringer work item may bundle when `agents.batchGroups` collapses same-folder-type steps
 *
 * USAGE:
 * defaultMaxStepsPerChunkStatics.value;
 * // Returns the cap (6) — group accumulators are sliced into sub-chunks of size <= this
 */

export const defaultMaxStepsPerChunkStatics = {
  value: 6,
} as const;

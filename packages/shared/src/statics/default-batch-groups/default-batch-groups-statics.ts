/**
 * PURPOSE: Ships the curated folder-type batch-group default applied when `agents.batchGroups` is omitted from a project's `.dungeonmaster` config
 *
 * USAGE:
 * defaultBatchGroupsStatics.value;
 * // Returns the curated batch-group list — two wide groups; folder types outside every group stay one-per-codeweaver
 */

export const defaultBatchGroupsStatics = {
  value: [
    ['contracts', 'statics', 'errors', 'guards', 'transformers', 'state', 'middleware', 'adapters'],
    ['responders', 'flows'],
  ],
} as const;

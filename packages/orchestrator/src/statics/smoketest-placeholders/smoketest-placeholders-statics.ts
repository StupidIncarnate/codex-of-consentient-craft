/**
 * PURPOSE: The placeholder tokens a canned smoketest prompt carries until a live run resolves them.
 * Reach for this rather than writing `'{{questId}}'` inline: the tokens are written by
 * `smoketestPromptsStatics` and read by TWO different substitution sites — the bundled suites'
 * enqueue-time pass over a whole work-item array, and the orchestration driver's stamp-time pass
 * over one work item as the relay mints it — and a token spelt differently at either end leaves the
 * literal `{{...}}` in the prompt the agent runs.
 *
 * `workItemId` is the one that cannot be resolved at authoring time by any other means. `signal-back`
 * REQUIRES `questId` and `workItemId`, and a scripted agent's whole prompt is one instruction: it
 * never calls `get-agent-prompt`, so nothing else in its context could tell it which work item it
 * is. A prompt omitting them is rejected by the tool, the agent never signals, and orphan recovery
 * burns the quest's reset budget before blocking it.
 *
 * USAGE:
 * smoketestPlaceholdersStatics.workItemId;
 * // Returns '{{workItemId}}'
 */

export const smoketestPlaceholdersStatics = {
  questId: '{{questId}}',
  guildId: '{{guildId}}',
  processId: '{{processId}}',
  workItemId: '{{workItemId}}',
} as const;

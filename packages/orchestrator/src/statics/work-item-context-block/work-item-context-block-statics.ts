/**
 * PURPOSE: Static format strings used by workItemContextBlockTransformer to append a "Work item context"
 * block to an agent prompt when a sub-agent calls get-agent-prompt with both questId and workItemId.
 *
 * USAGE:
 * workItemContextBlockStatics.heading;
 * // Returns '## Work item context'
 */

export const workItemContextBlockStatics = {
  separator: '---',
  heading: '## Work item context',
  labels: {
    questId: '- questId:',
    workItemId: '- workItemId:',
    role: '- role:',
    packagesAffected: '- packagesAffected:',
    wardMode: '- wardMode:',
  },
} as const;

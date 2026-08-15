/**
 * PURPOSE: Names the stages git worktree preparation must clear AND the failure class each one
 * routes to, so `WorktreePrepareError`'s `step` argument, the broker driving preparation, and the
 * failure router all share one vocabulary instead of each side hand-rolling its own strings.
 * `classifications` is keyed by the step's own VALUE — the thing `WorktreePrepareError` carries —
 * so a caught error routes without a second key to translate through.
 *
 * USAGE:
 * worktreePrepareStepStatics.steps.nodeModules;
 * // Returns 'node_modules'
 *
 * worktreePrepareStepStatics.classifications[worktreePrepareStepStatics.steps.build];
 * // Returns 'repairable' — a build failure earns a spiritmender pass and a fresh attempt,
 * // where 'git-state' halts the quest so no agent is dispatched into the repo-root checkout
 */

import { locationsStatics } from '@dungeonmaster/shared/statics';

export const worktreePrepareStepStatics = {
  steps: {
    create: 'create',
    baseBranch: 'base_branch',
    nodeModules: locationsStatics.repoRoot.nodeModules,
    build: 'build',
  },
  classifications: {
    create: 'git-state',
    base_branch: 'git-state',
    [locationsStatics.repoRoot.nodeModules]: 'repairable',
    build: 'repairable',
  },
} as const;

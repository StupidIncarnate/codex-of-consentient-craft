/**
 * PURPOSE: Names the three stages git worktree preparation must clear — so
 * `WorktreePrepareError`'s `step` argument and the broker driving preparation share one
 * vocabulary instead of each side hand-rolling its own strings.
 *
 * USAGE:
 * worktreePrepareStepStatics.steps.nodeModules;
 * // Returns 'node_modules'
 */

import { locationsStatics } from '@dungeonmaster/shared/statics';

export const worktreePrepareStepStatics = {
  steps: {
    create: 'create',
    nodeModules: locationsStatics.repoRoot.nodeModules,
    build: 'build',
  },
} as const;

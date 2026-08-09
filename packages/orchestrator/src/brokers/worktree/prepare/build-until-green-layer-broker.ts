/**
 * PURPOSE: Runs a worktree's configured build command in repeated passes until it exits 0, because a
 * workspace build script iterates its packages in the order npm lists them rather than in dependency
 * order, and a fresh worktree has no `dist` for a package that sorts after its own dependents. Each
 * pass therefore emits at least one more layer of the reference graph, and the next pass gets further.
 * Reach for this over calling `buildPreflightBroker` directly whenever the tree has never been built.
 *
 * Repeating the real command is what keeps every package compiled from the worktree's OWN source.
 * Copying the repo root's already-built `dist` in as a seed would also silence the missing-reference
 * error, but those files are type-checked against, so a seed seeded from a different branch reports
 * errors the worktree's branch does not have.
 *
 * USAGE:
 * const { success, output } = await buildUntilGreenLayerBroker({
 *   buildCommand: 'npm run build',
 *   cwd: AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' }),
 * });
 * // output is the LAST pass's combined output, so a genuine failure is reported, not a first-pass
 * // ordering artefact
 */

import type { AbsoluteFilePath, ErrorMessage } from '@dungeonmaster/shared/contracts';

import { buildPreflightBroker } from '../../build/preflight/build-preflight-broker';

// One pass per level of the workspace dependency graph. Three covers this monorepo's depth with room
// to spare; a genuinely broken build burns the passes and then reports, which costs a rebuild of an
// already-warm tree rather than a wrong answer.
const MAX_PASSES = 3;

export const buildUntilGreenLayerBroker = async ({
  buildCommand,
  cwd,
  passesRemaining = MAX_PASSES,
}: {
  buildCommand: string;
  cwd: AbsoluteFilePath;
  // Internal: decremented per recursive pass. Callers leave this at its default.
  passesRemaining?: number;
}): Promise<{ success: boolean; output: ErrorMessage }> => {
  const { success, output } = await buildPreflightBroker({ buildCommand, cwd });

  if (success || passesRemaining <= 1) {
    return { success, output };
  }

  return buildUntilGreenLayerBroker({ buildCommand, cwd, passesRemaining: passesRemaining - 1 });
};

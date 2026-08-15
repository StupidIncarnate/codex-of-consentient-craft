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
 * Lives beside `buildPreflightBroker` under `brokers/build/` rather than inside the worktree-prepare
 * folder because both the Start layer and the riftcarver work item drive it, and a `-layer-` file is
 * importable only from its own domain folder.
 *
 * USAGE:
 * const { success, output } = await buildUntilGreenBroker({
 *   buildCommand: 'npm run build',
 *   cwd: AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' }),
 *   onLine: (line) => emit(line),
 * });
 * // output is the LAST pass's combined output, so a genuine failure is reported, not a first-pass
 * // ordering artefact; onLine sees a `— build pass N/3 —` banner ahead of each pass
 */

import type { AbsoluteFilePath, ErrorMessage } from '@dungeonmaster/shared/contracts';

import { buildPreflightBroker } from '../preflight/build-preflight-broker';

// One pass per level of the workspace dependency graph. Three covers this monorepo's depth with room
// to spare; a genuinely broken build burns the passes and then reports, which costs a rebuild of an
// already-warm tree rather than a wrong answer.
const MAX_PASSES = 3;

export const buildUntilGreenBroker = async ({
  buildCommand,
  cwd,
  onLine,
  passesRemaining = MAX_PASSES,
}: {
  buildCommand: string;
  cwd: AbsoluteFilePath;
  // Required, never optional — see packages/shared/CLAUDE.md, "Streaming Adapters". Callers with
  // nowhere to send output pass `() => undefined` so the choice is visible at the call site.
  onLine: (line: string) => void;
  // Internal: decremented per recursive pass. Callers leave this at its default.
  passesRemaining?: number;
}): Promise<{ success: boolean; output: ErrorMessage }> => {
  // Without a banner the panel shows one build's worth of output up to three times over and reads
  // as a hang; the pass number is the only thing that tells a reader the repeat is by design.
  onLine(`— build pass ${MAX_PASSES - passesRemaining + 1}/${MAX_PASSES} —`);

  const { success, output } = await buildPreflightBroker({ buildCommand, cwd, onLine });

  if (success || passesRemaining <= 1) {
    return { success, output };
  }

  return buildUntilGreenBroker({
    buildCommand,
    cwd,
    onLine,
    passesRemaining: passesRemaining - 1,
  });
};

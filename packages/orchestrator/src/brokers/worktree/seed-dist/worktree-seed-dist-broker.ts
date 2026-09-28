/**
 * PURPOSE: Brings the main checkout's compiled output across to a freshly carved worktree, because
 * two mechanisms each fail to: `git worktree add` checks out TRACKED files and `dist` is gitignored,
 * and the `node_modules` mirror copies a `@dungeonmaster/<pkg>` SYMLINK rather than the compiled
 * files behind it. Without this a worktree holds source and no binaries, and ward — whose own entry
 * point is compiled output — cannot run at all. Reach for this over building the worktree from cold
 * to fill the gap: the seed is measured at 1.57s against a 55-71s cold build, and the preflight
 * typecheck that follows emits nothing, so nothing else produces those binaries.
 *
 * The copy is `cp -a` and MUST NOT become `cp -al`. Compilers truncate-and-write the same inode, so
 * a hardlinked `dist` sends a worktree's rebuild straight back into the main checkout's output —
 * `dist` is precisely the directory tools write in place. `node_modules` is the opposite case and
 * IS hardlinked (see populate-one-root-layer-broker); the two are not interchangeable.
 *
 * Re-entrant like every other worktree step: the done-check reads the TARGET on disk per package, so
 * a `pt N` carve re-copies only the packages genuinely missing one.
 *
 * USAGE:
 * await worktreeSeedDistBroker({
 *   repoRoot: AbsoluteFilePathStub({ value: '/repo' }),
 *   worktreePath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe' }),
 * });
 * // Rejects with WorktreePrepareError naming every package whose source dist is missing —
 * //   that state means the main checkout was never built, which only the operator can fix
 */

import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
  type AdapterResult,
} from '@dungeonmaster/shared/contracts';
import { locationsStatics, projectMapStatics } from '@dungeonmaster/shared/statics';
import { run, RunNotFoundError } from '#gateway/node/child_process';
import { readdirEntriesSync } from '#gateway/node/fs';
import { join } from '#gateway/node/path';

import { pathExists } from '#gateway/node/fs__promises';
import { WorktreePrepareError } from '../../../errors/worktree-prepare/worktree-prepare-error';
import { worktreePrepareStepStatics } from '../../../statics/worktree-prepare-step/worktree-prepare-step-statics';
import { worktreeFailureDetailTransformer } from '../../../transformers/worktree-failure-detail/worktree-failure-detail-transformer';

const STEPS = worktreePrepareStepStatics.steps;

const COPY_COMMAND = 'cp';
// `-a` is archive: recursive, preserving mode, timestamps and symlinks. `-l` is deliberately NOT
// here — see this file's header for why a hardlinked `dist` corrupts the main checkout.
const COPY_ARCHIVE_FLAG = '-a';
const COPY_GREEN_EXIT_CODE = 0;

export const worktreeSeedDistBroker = async ({
  repoRoot,
  worktreePath,
}: {
  repoRoot: AbsoluteFilePath;
  worktreePath: AbsoluteFilePath;
}): Promise<AdapterResult> => {
  const sourcePackagesDir = absoluteFilePathContract.parse(
    join(repoRoot, projectMapStatics.packagesDirName),
  );

  // A repo with no `packages/` is not a monorepo, so nothing was re-pointed at a workspace package
  // and every dependency already carries its own published `dist`. Nothing to seed, and that is a
  // legitimate state rather than a failure.
  const packagesDirPresent = await pathExists(sourcePackagesDir);

  if (!packagesDirPresent) {
    return { success: true as const };
  }

  const candidates = readdirEntriesSync(sourcePackagesDir).filter(
    (entry) => entry.kind === 'directory',
  );

  const inspected = await Promise.all(
    candidates.map(async (entry) => {
      const sourcePackage = join(sourcePackagesDir, entry.name);
      const sourceDist = join(sourcePackage, locationsStatics.repoRoot.dist);
      const targetPackage = join(worktreePath, projectMapStatics.packagesDirName, entry.name);
      const targetDist = join(targetPackage, locationsStatics.repoRoot.dist);

      const [isPackage, hasSourceDist, hasTargetDist] = await Promise.all([
        pathExists(join(sourcePackage, projectMapStatics.packageJsonName)),
        pathExists(sourceDist),
        pathExists(targetDist),
      ]);

      return { name: entry.name, isPackage, hasSourceDist, hasTargetDist, sourceDist, targetDist };
    }),
  );

  const packages = inspected.filter((candidate) => candidate.isPackage);
  const unbuilt = packages.filter((candidate) => !candidate.hasSourceDist);

  // Surfaced, never papered over: a package with no compiled output means the main checkout was
  // never built, and no amount of worktree work makes that true. Every missing package is named in
  // one message so the operator runs one build rather than discovering them one carve at a time.
  if (unbuilt.length > 0) {
    throw new WorktreePrepareError({
      step: STEPS.seedDist,
      detail: worktreeFailureDetailTransformer({
        worktreePath,
        cause: `the main checkout at ${repoRoot} has no compiled output for ${String(unbuilt.length)} package(s) — run the repo's build before carving a worktree: ${unbuilt.map((candidate) => candidate.name).join(', ')}`,
      }),
    });
  }

  const missing = packages.filter((candidate) => !candidate.hasTargetDist);

  if (missing.length === 0) {
    return { success: true as const };
  }

  // One spawn per package rather than one for the whole set: each `dist` lands at its own package
  // path inside the worktree, and `cp` has no form that maps N sources onto N distinct destinations.
  const copies = await Promise.all(
    missing.map(async (candidate) =>
      run({
        command: COPY_COMMAND,
        args: [COPY_ARCHIVE_FLAG, candidate.sourceDist, candidate.targetDist],
        cwd: repoRoot,
      }).catch((error: unknown) => {
        if (!(error instanceof RunNotFoundError)) {
          throw error;
        }
        // A missing `cp` binary rejects `run` with RunNotFoundError rather than resolving a
        // result — folded into the same failed-run shape the old spawn-capture adapter resolved
        // for an ENOENT, so the exit-code check right below still sees a real result to report.
        return { exitCode: 1, output: '', signal: null, timedOut: false };
      }),
    ),
  );

  const failed = copies.filter((copy) => copy.exitCode !== COPY_GREEN_EXIT_CODE);

  if (failed.length > 0) {
    throw new WorktreePrepareError({
      step: STEPS.seedDist,
      detail: worktreeFailureDetailTransformer({
        worktreePath,
        cause: failed.map((copy) => copy.output).join(' | '),
      }),
    });
  }

  return { success: true as const };
};

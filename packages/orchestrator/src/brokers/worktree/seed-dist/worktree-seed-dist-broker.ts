/**
 * PURPOSE: Brings the main checkout's compiled output across to a freshly carved worktree, because
 * two mechanisms each fail to: `git worktree add` checks out TRACKED files and `dist` is gitignored,
 * and the `node_modules` mirror copies a `@dungeonmaster/<pkg>` SYMLINK rather than the compiled
 * files behind it. Without this a worktree holds source and no binaries, and ward — whose own entry
 * point is compiled output — cannot run at all. Reach for this over letting the preflight build fill
 * the gap: the seed is measured at 1.57s against a 55-71s cold build, and the build that follows
 * then only has to cover what the worktree itself changes.
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
  childProcessSpawnCaptureAdapter,
  fsReaddirWithTypesAdapter,
  pathJoinAdapter,
} from '@dungeonmaster/shared/adapters';
import {
  absoluteFilePathContract,
  filePathContract,
  type AbsoluteFilePath,
  type AdapterResult,
} from '@dungeonmaster/shared/contracts';
import { locationsStatics, projectMapStatics } from '@dungeonmaster/shared/statics';

import { fsIsAccessibleAdapter } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter';
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
    pathJoinAdapter({ paths: [repoRoot, projectMapStatics.packagesDirName] }),
  );

  // A repo with no `packages/` is not a monorepo, so nothing was re-pointed at a workspace package
  // and every dependency already carries its own published `dist`. Nothing to seed, and that is a
  // legitimate state rather than a failure.
  const packagesDirPresent = await fsIsAccessibleAdapter({
    filePath: filePathContract.parse(sourcePackagesDir),
  });

  if (!packagesDirPresent) {
    return { success: true as const };
  }

  const candidates = fsReaddirWithTypesAdapter({ dirPath: sourcePackagesDir }).filter((entry) =>
    entry.isDirectory(),
  );

  const inspected = await Promise.all(
    candidates.map(async (entry) => {
      const sourcePackage = pathJoinAdapter({ paths: [sourcePackagesDir, entry.name] });
      const sourceDist = pathJoinAdapter({
        paths: [sourcePackage, locationsStatics.repoRoot.dist],
      });
      const targetPackage = pathJoinAdapter({
        paths: [worktreePath, projectMapStatics.packagesDirName, entry.name],
      });
      const targetDist = pathJoinAdapter({
        paths: [targetPackage, locationsStatics.repoRoot.dist],
      });

      const [isPackage, hasSourceDist, hasTargetDist] = await Promise.all([
        fsIsAccessibleAdapter({
          filePath: filePathContract.parse(
            pathJoinAdapter({ paths: [sourcePackage, projectMapStatics.packageJsonName] }),
          ),
        }),
        fsIsAccessibleAdapter({ filePath: filePathContract.parse(sourceDist) }),
        fsIsAccessibleAdapter({ filePath: filePathContract.parse(targetDist) }),
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
      childProcessSpawnCaptureAdapter({
        command: COPY_COMMAND,
        args: [COPY_ARCHIVE_FLAG, candidate.sourceDist, candidate.targetDist],
        cwd: repoRoot,
      }),
    ),
  );

  const failed = copies.filter((copy) => copy.exitCode !== COPY_GREEN_EXIT_CODE);

  if (failed.length > 0) {
    throw new WorktreePrepareError({
      step: STEPS.seedDist,
      detail: worktreeFailureDetailTransformer({
        worktreePath,
        cause: failed.map((copy) => String(copy.output)).join(' | '),
      }),
    });
  }

  return { success: true as const };
};

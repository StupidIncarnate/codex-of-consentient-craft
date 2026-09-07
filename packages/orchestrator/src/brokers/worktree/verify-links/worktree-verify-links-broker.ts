/**
 * PURPOSE: The last gate before a worktree path is handed to anything that will run commands in it.
 * A link under `node_modules` whose target is ABSOLUTE, or whose target climbs out of the worktree,
 * silently points the worktree at the MAIN checkout — so a build, a ward run or an agent session
 * inside it reads and grades code the worktree never changed, and comes back GREEN. Nothing else
 * reports that: the run succeeds, the answer is about the wrong tree. Reach for this over trusting
 * the populate that just ran, because the failure has no other symptom.
 *
 * It REFUSES rather than repairs. Rewriting the offending links would leave a worktree half-built
 * by two different mechanisms, and dispatching a session into it to fix them makes the leak worse —
 * that session would be measuring the main checkout while it works.
 *
 * USAGE:
 * await worktreeVerifyLinksBroker({
 *   worktreePath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe' }),
 * });
 * // Rejects with WorktreePrepareError naming each offending link, its stored target and where
 * //   that target actually lands
 */

import { locationsNodeModulesPathFindBroker } from '@dungeonmaster/shared/brokers';
import {
  filePathContract,
  type AbsoluteFilePath,
  type AdapterResult,
} from '@dungeonmaster/shared/contracts';

import { fsIsAccessibleAdapter } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter';
import { WorktreePrepareError } from '../../../errors/worktree-prepare/worktree-prepare-error';
import { worktreePrepareStepStatics } from '../../../statics/worktree-prepare-step/worktree-prepare-step-statics';
import { worktreeVerifyLinksStatics } from '../../../statics/worktree-verify-links/worktree-verify-links-statics';
import { worktreeFailureDetailTransformer } from '../../../transformers/worktree-failure-detail/worktree-failure-detail-transformer';
import { walkSymlinksLayerBroker } from './walk-symlinks-layer-broker';

const STEPS = worktreePrepareStepStatics.steps;

export const worktreeVerifyLinksBroker = async ({
  worktreePath,
}: {
  worktreePath: AbsoluteFilePath;
}): Promise<AdapterResult> => {
  const nodeModules = locationsNodeModulesPathFindBroker({ rootPath: worktreePath });

  const nodeModulesPresent = await fsIsAccessibleAdapter({
    filePath: filePathContract.parse(nodeModules),
  });

  // A worktree carved but not yet mirrored holds no links at all. That is a stage, not a leak —
  // the caller's next step is the populate, and this same check runs again after it.
  if (!nodeModulesPresent) {
    return { success: true as const };
  }

  const audits = await walkSymlinksLayerBroker({ worktreePath, dirPath: nodeModules });

  // BOTH conditions, not either: an absolute target that happens to land inside the worktree today
  // stops doing so the moment the tree is moved or copied, and it is written by exactly the
  // hand-rolled populate this gate exists to catch.
  const escaping = audits.filter((audit) => !audit.relative || !audit.inside);

  if (escaping.length === 0) {
    return { success: true as const };
  }

  const reported = escaping
    .slice(0, worktreeVerifyLinksStatics.maxReportedLinks)
    .map(
      (audit) =>
        `${String(audit.linkPath)} -> ${String(audit.storedTarget)} (lands at ${String(audit.resolvedTarget)})`,
    )
    .join('; ');
  const elided =
    escaping.length - Math.min(escaping.length, worktreeVerifyLinksStatics.maxReportedLinks);

  throw new WorktreePrepareError({
    step: STEPS.verifyLinks,
    detail: worktreeFailureDetailTransformer({
      worktreePath,
      cause: `${String(escaping.length)} of ${String(audits.length)} node_modules symlink(s) do not resolve inside the worktree, so every command run here would grade the main checkout: ${reported}${elided > 0 ? ` (+${String(elided)} more)` : ''}`,
    }),
  });
};

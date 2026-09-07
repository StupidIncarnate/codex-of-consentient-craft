/**
 * PURPOSE: The half of a worktree that turns a checked-out tree into one commands can be RUN in, and
 * the single body every caller shares for it — the MCP tool and the riftcarver carve alike. Reach
 * for this over calling the mirror, the seed and the audit yourself: their ORDER is the whole point,
 * and a caller that assembles its own sequence gets it wrong in a way nothing reports. The audit has
 * to run LAST, after the mirror, because the links it grades are the ones the mirror just wrote —
 * run against a bare tree it finds no links, passes, and gates nothing.
 *
 * It NAMES the step it failed at rather than throwing, because the three sub-steps classify
 * differently — a mirror failure earns a spiritmender pass, while an unbuilt main checkout or a
 * leaking link halt the quest — and a caller several frames up cannot tell which one it reached.
 * A carve that guessed would dispatch a repair session into a worktree that grades the main
 * checkout.
 *
 * It takes a tree that already exists. Creating one is `worktreePrepareBroker`, which the two
 * callers reach differently: the MCP tool carves on a directory that is simply absent, while
 * riftcarver decides from the quest's own record plus a live git probe and has a collision refusal
 * of its own to run first.
 *
 * USAGE:
 * const provisioned = await worktreeProvisionBroker({
 *   repoRoot: AbsoluteFilePathStub({ value: '/repo' }),
 *   worktreePath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe' }),
 *   onLine: (line) => emit(line),
 * });
 * // { ok: true }, or { ok: false, failedStep: 'verify-links', error } for the caller to route
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { worktreePrepareStepStatics } from '../../../statics/worktree-prepare-step/worktree-prepare-step-statics';
import { worktreePopulateNodeModulesBroker } from '../populate-node-modules/worktree-populate-node-modules-broker';
import { worktreeSeedDistBroker } from '../seed-dist/worktree-seed-dist-broker';
import { worktreeVerifyLinksBroker } from '../verify-links/worktree-verify-links-broker';

const STEPS = worktreePrepareStepStatics.steps;

export type WorktreeProvisionResult =
  | { ok: true }
  | {
      ok: false;
      failedStep: typeof STEPS.nodeModules | typeof STEPS.seedDist | typeof STEPS.verifyLinks;
      error: Error;
    };

export const worktreeProvisionBroker = async ({
  repoRoot,
  worktreePath,
  onLine,
}: {
  repoRoot: AbsoluteFilePath;
  worktreePath: AbsoluteFilePath;
  // Required, never optional — see packages/shared/CLAUDE.md, "Streaming Adapters". The mirror is
  // the long step, and this callback is the only route its output has to a UI.
  onLine: (line: string) => void;
}): Promise<WorktreeProvisionResult> => {
  try {
    await worktreePopulateNodeModulesBroker({ repoRoot, worktreePath, onLine });
  } catch (error: unknown) {
    return {
      ok: false,
      failedStep: STEPS.nodeModules,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  try {
    // The seed runs here even where a carve already ran it: `git worktree add` brings across TRACKED
    // files only and `dist` is gitignored, so a tree carved by an earlier attempt and only being
    // re-provisioned now has never been seeded at all. It done-checks per package.
    await worktreeSeedDistBroker({ repoRoot, worktreePath });
  } catch (error: unknown) {
    return {
      ok: false,
      failedStep: STEPS.seedDist,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  try {
    await worktreeVerifyLinksBroker({ worktreePath });
  } catch (error: unknown) {
    return {
      ok: false,
      failedStep: STEPS.verifyLinks,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  return { ok: true };
};

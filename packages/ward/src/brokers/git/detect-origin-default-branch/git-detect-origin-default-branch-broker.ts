/**
 * PURPOSE: Resolves which ref stands for "origin's default branch", so a committed-work diff has a
 * remote-side base to measure against. Reach for this over gitDetectDefaultBranchBroker when the
 * question is what the REMOTE holds — the local main/master that broker finds can itself be ahead of
 * origin, so a diff against it reports nothing for commits origin has never seen.
 *
 * THE BRANCH'S OWN TRACKING REF IS DELIBERATELY NOT CONSULTED. `--committed` asks "what has this
 * branch added on top of origin's main line", and `@{upstream}` answers a different question — on a
 * branch that has already been pushed it resolves to that branch's own remote copy, so the diff
 * collapses to nothing the moment a reviewer pushes. That collapse is what made every reviewer on a
 * long quest grade a window that shrank to its own pass.
 *
 * USAGE:
 * const ref = await gitDetectOriginDefaultBranchBroker({ cwd: AbsoluteFilePathStub({ value: '/project' }) });
 * // Returns GitBranchName('origin/master'), or null when the repo has no origin refs at all
 */

import { detectOriginDefaultBranch, GitNotInstalledError } from '#gateway/bin/git';


export const gitDetectOriginDefaultBranchBroker = async ({
  cwd,
}: {
  cwd: string;
}): Promise<string | null> => {
  // A missing `git` binary makes the gateway throw GitNotInstalledError rather than resolve a
  // result — folded into null here so "git is not on this machine" reads as "neither origin ref
  // verified".
  try {
    const ref = await detectOriginDefaultBranch({ cwd });
    return ref === null ? null : ref;
  } catch (error: unknown) {
    if (!(error instanceof GitNotInstalledError)) {
      throw error;
    }
    return null;
  }
};

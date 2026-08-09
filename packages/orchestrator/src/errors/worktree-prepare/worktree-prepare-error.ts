/**
 * PURPOSE: Represents an error when one step of git worktree preparation (create, node_modules
 * population, or build) fails after the branch/worktree names were confirmed available.
 *
 * USAGE:
 * throw new WorktreePrepareError({ step: 'create', detail: '/repo/worktrees/add-auth-7bc217a1' });
 * // Throws error naming which step failed and why
 *
 * WHEN-TO-USE: From the broker driving worktree preparation, once past the two name-collision
 * checks, so the Quest Start responder can `instanceof`-check it and answer 500 with the failing
 * step named.
 * WHEN-NOT-TO-USE: For the two name-collision rejections — those are BaseBranchNotFoundError and
 * QuestBranchNameTakenError, and answer 400, not 500.
 */
export class WorktreePrepareError extends Error {
  public constructor({ step, detail }: { step: string; detail: string }) {
    super(`Worktree preparation failed at ${step}: ${detail}`);
    this.name = 'WorktreePrepareError';
  }
}

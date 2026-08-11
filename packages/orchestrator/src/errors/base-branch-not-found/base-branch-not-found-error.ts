/**
 * PURPOSE: Represents an error when Quest Start cannot find a local `main` or `master` branch to
 * fork the quest's git worktree from.
 *
 * USAGE:
 * throw new BaseBranchNotFoundError();
 * // Throws error naming that no local base branch exists
 *
 * WHEN-TO-USE: From the git-lifecycle broker that resolves the base branch, so the Quest Start
 * responder can `instanceof`-check it and answer 400 instead of 500.
 * WHEN-NOT-TO-USE: For any other git failure during worktree preparation — that is
 * WorktreePrepareError.
 */
export class BaseBranchNotFoundError extends Error {
  public constructor() {
    super('No local main or master branch found');
    this.name = 'BaseBranchNotFoundError';
  }
}

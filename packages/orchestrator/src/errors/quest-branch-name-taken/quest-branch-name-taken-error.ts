/**
 * PURPOSE: Represents an error when the branch name Quest Start computed for a quest is already in
 * use — some other branch or worktree already owns that exact name.
 *
 * USAGE:
 * throw new QuestBranchNameTakenError({ branchName: 'quest/add-auth-7bc217a1' });
 * // Throws error naming the exact branch name that is taken
 *
 * WHEN-TO-USE: From the git-lifecycle broker that checks branch/worktree name availability before
 * creating either, so the Quest Start responder can `instanceof`-check it and answer 400 instead of
 * 500.
 * WHEN-NOT-TO-USE: For any other git failure during worktree preparation — that is
 * WorktreePrepareError.
 */
export class QuestBranchNameTakenError extends Error {
  public constructor({ branchName }: { branchName: string }) {
    super(`${branchName} already exists — name is in use by other work`);
    this.name = 'QuestBranchNameTakenError';
  }
}

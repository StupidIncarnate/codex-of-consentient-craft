/**
 * PURPOSE: Bounds and literals `questToGitNamesTransformer` needs to turn a quest title + id into
 * a safe branch/worktree name, so the truncation ceiling and the punctuation-only fallback are not
 * magic numbers or inline literals inside that transformer.
 *
 * USAGE:
 * questBranchStatics.branchPrefix;
 * // Returns 'quest/'
 */

export const questBranchStatics = {
  branchPrefix: 'quest/',
  questIdSuffixLength: 8,
  slugMaxLength: 48,
  fallbackSlug: 'quest',
} as const;

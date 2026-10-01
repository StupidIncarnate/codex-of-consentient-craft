/**
 * PURPOSE: Brings a plan file path to the one form check 9 compares against a package location —
 * repo-relative, `packages/<package>/…`, no `./`. A planner writes all three forms, so the ownership
 * check measures one shape instead of three; an absolute path under no accepted root has no
 * repo-relative reading and comes back `undefined`.
 *
 * USAGE:
 * workPlanFileRepoRelativeTransformer({
 *   filePath: '/repo/worktrees/add-auth-1a2b3c4d/packages/web/src/a.tsx',
 *   roots: ['/repo/worktrees/add-auth-1a2b3c4d', '/repo'],
 * });
 * // Returns 'packages/web/src/a.tsx'
 *
 * The longest matching root wins, so a worktree path is never read as a main-checkout path whose
 * first segment is `worktrees`. A root matches whole segments only: `/repo-other/x` is not under
 * `/repo`.
 */

export const workPlanFileRepoRelativeTransformer = ({
  filePath,
  roots,
}: {
  filePath: string;
  roots: string[];
}): string | undefined => {
  const isAbsolute = filePath.startsWith('/') || /^[A-Za-z]:\\/u.test(filePath);

  if (!isAbsolute) {
    return filePath.replace(/^\.\//u, '');
  }

  const matchingRoot = [...roots]
    .sort((left, right) => right.length - left.length)
    .find((root) => filePath.startsWith(`${root}/`));

  return matchingRoot === undefined ? undefined : filePath.slice(matchingRoot.length + 1);
};

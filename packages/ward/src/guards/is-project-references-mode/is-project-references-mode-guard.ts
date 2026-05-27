/**
 * PURPOSE: Determines whether ward should use TypeScript project references mode (tsc -b) for typecheck
 *
 * USAGE:
 * isProjectReferencesModeGuard({ rootHasWorkspaces: true, eligibleWorkspaceCount: 5 });
 * // Returns true when the repo is a TS monorepo with at least one composite-eligible package
 */

export const isProjectReferencesModeGuard = ({
  rootHasWorkspaces,
  eligibleWorkspaceCount,
}: {
  rootHasWorkspaces?: boolean;
  eligibleWorkspaceCount?: number;
}): boolean => {
  if (rootHasWorkspaces !== true) {
    return false;
  }
  if (eligibleWorkspaceCount === undefined || eligibleWorkspaceCount <= 0) {
    return false;
  }
  return true;
};

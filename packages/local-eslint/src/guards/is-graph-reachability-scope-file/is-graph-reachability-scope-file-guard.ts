/**
 * PURPOSE: Decides whether a filename is one of the statics files `rule-graph-reachability-broker`
 * reads its graph from and therefore may report on.
 *
 * USAGE:
 * isGraphReachabilityScopeFileGuard({
 *   filename: '/repo/packages/shared/src/statics/quest-flow/quest-flow-statics.ts',
 *   scopeFilePaths: graphReachabilityStatics.scopeFilePaths,
 * });
 * // Returns true
 * isGraphReachabilityScopeFileGuard({ filename: '/repo/packages/web/src/foo.ts', scopeFilePaths: graphReachabilityStatics.scopeFilePaths });
 * // Returns false
 *
 * WHEN-TO-USE: Only inside rule-graph-reachability-broker.
 */

export const isGraphReachabilityScopeFileGuard = ({
  filename,
  scopeFilePaths,
}: {
  filename?: string;
  scopeFilePaths?: readonly string[];
}): boolean => {
  if (filename === undefined || filename.length === 0 || scopeFilePaths === undefined) {
    return false;
  }

  const normalized = filename.replace(/\\/gu, '/');
  return scopeFilePaths.some((scopeFilePath) => normalized.endsWith(scopeFilePath));
};

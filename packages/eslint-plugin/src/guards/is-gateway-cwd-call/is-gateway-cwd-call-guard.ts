/**
 * PURPOSE: Determines if an AST node calls the gateway process wrapper's `cwd`, through a local binding of the named import or through a namespace member. Reach for isProcessCwdCallGuard for the bare `process.cwd()` form.
 *
 * USAGE:
 * isGatewayCwdCallGuard({ node, cwdLocalNames: new Set(['cwd']), namespaceLocalNames: new Set(['p']) });
 * // Returns true for `cwd()` and `p.cwd()`
 *
 * WHEN-TO-USE: Inside ESLint rules that track imports from the gateway process wrapper
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { noBareProcessCwdStatics } from '../../statics/no-bare-process-cwd/no-bare-process-cwd-statics';

export const isGatewayCwdCallGuard = ({
  node,
  cwdLocalNames,
  namespaceLocalNames,
}: {
  node?: TSESTree.Node | undefined;
  cwdLocalNames?: ReadonlySet<string> | undefined;
  namespaceLocalNames?: ReadonlySet<string> | undefined;
}): boolean => {
  if (node?.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }
  const { callee } = node;
  if (callee.type === AST_NODE_TYPES.Identifier) {
    return cwdLocalNames?.has(callee.name) ?? false;
  }
  if (callee.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }
  return (
    callee.object.type === AST_NODE_TYPES.Identifier &&
    (namespaceLocalNames?.has(callee.object.name) ?? false) &&
    !callee.computed &&
    callee.property.type === AST_NODE_TYPES.Identifier &&
    callee.property.name === noBareProcessCwdStatics.gateway.cwdExport
  );
};

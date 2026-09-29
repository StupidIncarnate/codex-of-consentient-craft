/**
 * PURPOSE: Checks if an AST node is a .includes(...) call expression
 *
 * USAGE:
 * isAstIncludesCallGuard({ node });
 * // Returns true if node represents something.includes(...)
 *
 * WHEN-TO-USE: When ESLint rules need to detect .includes() usage in expect() arguments
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const isAstIncludesCallGuard = ({
  node,
}: {
  node?: TSESTree.Node | null | undefined;
}): boolean => {
  if (node === undefined || node === null) {
    return false;
  }

  if (node.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }

  const { callee } = node;
  if (callee.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }

  return (
    (callee.property.type === AST_NODE_TYPES.Identifier ||
      callee.property.type === AST_NODE_TYPES.PrivateIdentifier) &&
    callee.property.name === 'includes'
  );
};

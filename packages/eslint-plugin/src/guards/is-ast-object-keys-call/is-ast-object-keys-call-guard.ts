/**
 * PURPOSE: Checks if an AST node is an Object.keys(...) call expression
 *
 * USAGE:
 * isAstObjectKeysCallGuard({ node });
 * // Returns true if node represents Object.keys(...)
 *
 * WHEN-TO-USE: When ESLint rules need to detect Object.keys() usage in expect() arguments
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const isAstObjectKeysCallGuard = ({
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

  if (callee.object.type !== AST_NODE_TYPES.Identifier || callee.object.name !== 'Object') {
    return false;
  }

  return (
    (callee.property.type === AST_NODE_TYPES.Identifier ||
      callee.property.type === AST_NODE_TYPES.PrivateIdentifier) &&
    callee.property.name === 'keys'
  );
};

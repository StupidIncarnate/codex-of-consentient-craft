/**
 * PURPOSE: Determines if an AST node is a `process.cwd()` call expression
 *
 * USAGE:
 * if (isProcessCwdCallGuard({ node })) {
 *   // Returns true when node is `process.cwd()`
 * }
 *
 * WHEN-TO-USE: Inside ESLint rules that need to flag bare process.cwd() invocations
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const isProcessCwdCallGuard = ({ node }: { node?: TSESTree.Node | undefined }): boolean => {
  if (node?.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }
  const { callee } = node;
  if (callee.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }
  const objectName =
    callee.object.type === AST_NODE_TYPES.Identifier ? callee.object.name : undefined;
  const propertyName =
    callee.property.type === AST_NODE_TYPES.Identifier ||
    callee.property.type === AST_NODE_TYPES.PrivateIdentifier
      ? callee.property.name
      : undefined;
  return objectName === 'process' && propertyName === 'cwd';
};

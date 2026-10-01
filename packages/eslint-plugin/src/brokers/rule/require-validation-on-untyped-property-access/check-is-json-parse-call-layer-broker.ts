/**
 * PURPOSE: Determines whether an AST node is a direct `JSON.parse(...)` call expression
 *
 * USAGE:
 * const ok = checkIsJsonParseCallLayerBroker({ node });
 * // Returns true if node is a CallExpression whose callee is `JSON.parse`
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const checkIsJsonParseCallLayerBroker = ({
  node,
}: {
  node?: TSESTree.Node | null;
}): boolean => {
  if (node?.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }
  const { callee } = node;
  if (callee.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }
  const { object, property } = callee;
  return (
    object.type === AST_NODE_TYPES.Identifier &&
    object.name === 'JSON' &&
    property.type === AST_NODE_TYPES.Identifier &&
    property.name === 'parse'
  );
};

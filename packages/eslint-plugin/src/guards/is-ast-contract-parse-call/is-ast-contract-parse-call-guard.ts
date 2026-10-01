/**
 * PURPOSE: Checks if an AST node is a contract.parse() call expression
 *
 * USAGE:
 * const callNode = // AST node for: userContract.parse({ name: 'John' })
 * if (isAstContractParseCallGuard({ node: callNode })) {
 *   // Node is a valid contract.parse() call
 * }
 * // Returns true if node is CallExpression with pattern: {identifier}Contract.parse()
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const isAstContractParseCallGuard = ({ node }: { node?: TSESTree.Node }): boolean => {
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
    object.name.endsWith('Contract') &&
    property.type === AST_NODE_TYPES.Identifier &&
    property.name === 'parse'
  );
};

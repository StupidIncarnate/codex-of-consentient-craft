/**
 * PURPOSE: Checks if an object expression contains spread of contract.parse() call
 *
 * USAGE:
 * const objNode = // AST node for: { ...userContract.parse({ name: 'John' }), extra: 'field' }
 * if (isAstObjectContractParseSpreadGuard({ node: objNode })) {
 *   // Object has spread of contract.parse() result
 * }
 * // Returns true if any property is SpreadElement with contract.parse() argument
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isAstContractParseCallGuard } from '../is-ast-contract-parse-call/is-ast-contract-parse-call-guard';

export const isAstObjectContractParseSpreadGuard = ({
  node,
}: {
  node?: TSESTree.Node;
}): boolean => {
  if (node === undefined || node.type !== AST_NODE_TYPES.ObjectExpression) {
    return false;
  }

  // Check if any property is a SpreadElement with contract.parse()
  return node.properties.some((prop) => {
    if (prop.type === AST_NODE_TYPES.SpreadElement) {
      return isAstContractParseCallGuard({ node: prop.argument });
    }
    return false;
  });
};

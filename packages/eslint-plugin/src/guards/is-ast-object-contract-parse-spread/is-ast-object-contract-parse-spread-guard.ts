import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';
import { isAstContractParseCallGuard } from '../is-ast-contract-parse-call/is-ast-contract-parse-call-guard';

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
export const isAstObjectContractParseSpreadGuard = ({ node }: { node?: Tsestree }): boolean => {
  if (node === undefined || node.type !== 'ObjectExpression' || !node.properties) {
    return false;
  }

  // Check if any property is a SpreadElement with contract.parse()
  return node.properties.some((prop) => {
    if (prop.type === 'SpreadElement' && prop.argument) {
      return isAstContractParseCallGuard({ node: prop.argument });
    }
    return false;
  });
};

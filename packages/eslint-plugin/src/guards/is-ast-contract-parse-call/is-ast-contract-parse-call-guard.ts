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
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const isAstContractParseCallGuard = ({ node }: { node?: Tsestree }): boolean => {
  if (node === undefined || node.type !== 'CallExpression' || !node.callee) {
    return false;
  }

  const { callee } = node;
  if (callee.type !== 'MemberExpression') {
    return false;
  }

  const { object, property } = callee;
  return Boolean(
    object &&
      object.type === 'Identifier' &&
      object.name &&
      object.name.endsWith('Contract') &&
      property &&
      property.type === 'Identifier' &&
      property.name === 'parse',
  );
};

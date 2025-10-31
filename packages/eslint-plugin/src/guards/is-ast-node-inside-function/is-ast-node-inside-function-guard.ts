/**
 * PURPOSE: Checks if an AST node is nested inside a function in its parent chain
 *
 * USAGE:
 * const varNode = // AST node for variable inside: const outer = () => { const inner = 5; }
 * if (isAstNodeInsideFunctionGuard({ node: varNode })) {
 *   // Node is inside a function (arrow, expression, or declaration)
 * }
 * // Returns true if any parent is a function type
 */
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const isAstNodeInsideFunctionGuard = ({
  node,
}: {
  node?: Tsestree | undefined;
}): boolean => {
  if (node === undefined) {
    return false;
  }
  let current = node.parent;
  while (current !== undefined && current !== null) {
    if (
      current.type === 'ArrowFunctionExpression' ||
      current.type === 'FunctionExpression' ||
      current.type === 'FunctionDeclaration'
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
};

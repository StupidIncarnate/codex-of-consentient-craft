/**
 * PURPOSE: Walks a node's `.parent` chain up to the nearest enclosing function-like declaration —
 * a `ReturnStatement`'s own parent is its block, never the function, so callers that need the
 * function itself (its return type, its parameters) reach for this instead of one `.parent` hop.
 *
 * USAGE:
 * findEnclosingFunctionLayerBroker({ node: returnStatementNode.parent });
 * // Returns the nearest FunctionDeclaration/FunctionExpression/ArrowFunctionExpression ancestor,
 * // or undefined at the top of the chain
 */
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

export const findEnclosingFunctionLayerBroker = ({
  node,
}: {
  node: Tsestree | null | undefined;
}): Tsestree | undefined => {
  if (!node) {
    return undefined;
  }

  if (
    node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression' ||
    node.type === 'ArrowFunctionExpression'
  ) {
    return node;
  }

  return findEnclosingFunctionLayerBroker({ node: node.parent });
};

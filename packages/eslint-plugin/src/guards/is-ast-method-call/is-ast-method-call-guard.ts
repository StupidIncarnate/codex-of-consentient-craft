/**
 * PURPOSE: Checks if an AST node matches a specific method call pattern (object.method())
 *
 * USAGE:
 * const callNode = // AST node for: jest.mock('./module')
 * if (isAstMethodCallGuard({ node: callNode, object: 'jest', method: 'mock' })) {
 *   // Node is a jest.mock() call
 * }
 * // Returns true if node is CallExpression matching object.method() pattern
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const isAstMethodCallGuard = ({
  node,
  object,
  method,
}: {
  node?: TSESTree.Node;
  object?: string;
  method?: string;
}): boolean =>
  (node?.type === AST_NODE_TYPES.CallExpression || node?.type === AST_NODE_TYPES.NewExpression) &&
  node.callee.type === AST_NODE_TYPES.MemberExpression &&
  node.callee.object.type === AST_NODE_TYPES.Identifier &&
  node.callee.object.name === object &&
  node.callee.property.type === AST_NODE_TYPES.Identifier &&
  node.callee.property.name === method;

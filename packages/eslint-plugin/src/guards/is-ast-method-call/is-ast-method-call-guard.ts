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
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const isAstMethodCallGuard = ({
  node,
  object,
  method,
}: {
  node?: Tsestree;
  object?: string;
  method?: string;
}): boolean =>
  node?.callee?.type === 'MemberExpression' &&
  node.callee.object?.type === 'Identifier' &&
  node.callee.object.name === object &&
  node.callee.property?.type === 'Identifier' &&
  node.callee.property.name === method;

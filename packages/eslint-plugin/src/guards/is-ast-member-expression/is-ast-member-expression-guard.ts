/**
 * PURPOSE: Checks if an AST node is a member expression (object.property access)
 *
 * USAGE:
 * const node = // AST node for: user.name
 * if (isAstMemberExpressionGuard({ node })) {
 *   // Node is a member expression
 * }
 * // Returns true if node type is 'MemberExpression'
 */
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const isAstMemberExpressionGuard = ({
  node,
}: {
  node?: Tsestree | null | undefined;
}): boolean => node !== null && node !== undefined && node.type === 'MemberExpression';

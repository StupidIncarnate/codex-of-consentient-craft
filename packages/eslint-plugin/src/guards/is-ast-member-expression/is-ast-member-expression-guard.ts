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
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const isAstMemberExpressionGuard = ({
  node,
}: {
  node?: TSESTree.Node | null | undefined;
}): boolean => node !== null && node !== undefined && node.type === AST_NODE_TYPES.MemberExpression;

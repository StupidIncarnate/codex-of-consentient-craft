/**
 * PURPOSE: Extracts the root object name from a member expression chain
 *
 * USAGE:
 * const root = astGetMemberExpressionRootTransformer({ expr: memberExpressionNode });
 * // Returns 'obj' for obj.prop.nested, 'result' for result.files, or null if not found
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { identifierContract, type Identifier } from '@dungeonmaster/shared/contracts';

export const astGetMemberExpressionRootTransformer = ({
  expr,
}: {
  expr?: TSESTree.Node;
}): Identifier | null => {
  let current: TSESTree.Node | undefined = expr;

  // Traverse up the member expression chain
  while (current?.type === AST_NODE_TYPES.MemberExpression) {
    current = current.object;
  }

  // At the root, should be an Identifier
  if (current?.type === AST_NODE_TYPES.Identifier) {
    return identifierContract.parse(current.name);
  }

  return null;
};

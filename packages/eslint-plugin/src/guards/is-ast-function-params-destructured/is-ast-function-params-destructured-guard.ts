/**
 * PURPOSE: Checks if all function parameters use object destructuring pattern
 *
 * USAGE:
 * const funcNode = // AST node for: ({ name, age }: User) => void
 * if (isAstFunctionParamsDestructuredGuard({ funcNode })) {
 *   // All parameters use destructuring
 * }
 * // Returns true if all params are ObjectPattern or AssignmentPattern with ObjectPattern
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const isAstFunctionParamsDestructuredGuard = ({
  funcNode,
}: {
  funcNode?:
    TSESTree.ArrowFunctionExpression | TSESTree.FunctionDeclaration | TSESTree.FunctionExpression;
}): boolean => {
  if (!funcNode || funcNode.params.length === 0) {
    return true; // No params means no violation
  }

  // Check if ALL parameters use object destructuring
  // Handle two cases:
  // 1. Direct ObjectPattern: ({ x }: { x: Type })
  // 2. AssignmentPattern with ObjectPattern left: ({ x = 5 } = {})
  return funcNode.params.every(
    (param) =>
      param.type === AST_NODE_TYPES.ObjectPattern ||
      (param.type === AST_NODE_TYPES.AssignmentPattern &&
        param.left.type === AST_NODE_TYPES.ObjectPattern),
  );
};

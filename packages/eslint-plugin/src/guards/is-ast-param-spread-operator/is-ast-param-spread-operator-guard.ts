/**
 * PURPOSE: Checks if function's first parameter uses spread/rest operator in destructuring
 *
 * USAGE:
 * const funcNode = // AST node for: ({ ...props }: Props) => void
 * if (isAstParamSpreadOperatorGuard({ funcNode })) {
 *   // Function uses spread/rest operator in first parameter
 * }
 * // Returns true if first param is ObjectPattern with single RestElement property
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const isAstParamSpreadOperatorGuard = ({
  funcNode,
}: {
  funcNode?: TSESTree.Node;
}): boolean => {
  if (
    !(funcNode && 'params' in funcNode) ||
    ('params' in funcNode && funcNode.params.length === 0)
  ) {
    return false;
  }

  const [firstParam] = 'params' in funcNode ? funcNode.params : [];
  if (!firstParam) {
    return false;
  }

  // Handle both ObjectPattern and AssignmentPattern wrapping ObjectPattern
  const pattern =
    firstParam.type === AST_NODE_TYPES.ObjectPattern
      ? firstParam
      : firstParam.type === AST_NODE_TYPES.AssignmentPattern
        ? firstParam.left
        : null;

  if (!pattern || pattern.type !== AST_NODE_TYPES.ObjectPattern) {
    return false;
  }

  const { properties } = pattern;
  if (properties.length === 0) {
    return false;
  }

  // Must have exactly one property and it must be a RestElement
  return properties.length === 1 && properties[0]?.type === AST_NODE_TYPES.RestElement;
};

/**
 * PURPOSE: Checks if function's first parameter is single property destructuring named 'value'
 *
 * USAGE:
 * const funcNode = // AST node for: ({ value }: { value: string }) => void
 * if (isAstParamSingleValuePropertyGuard({ funcNode })) {
 *   // Function has single parameter property named 'value'
 * }
 * // Returns true if first param is ObjectPattern with single 'value' property
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const isAstParamSingleValuePropertyGuard = ({
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
  if (properties.length !== 1) {
    return false;
  }

  const [prop] = properties;
  if (!prop) {
    return false;
  }

  // Check if it's a single property named 'value'
  return (
    prop.type === AST_NODE_TYPES.Property &&
    prop.key.type === AST_NODE_TYPES.Identifier &&
    prop.key.name === 'value'
  );
};

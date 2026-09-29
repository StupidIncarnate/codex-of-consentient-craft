/**
 * PURPOSE: Checks if function's first parameter has StubArgument type annotation
 *
 * USAGE:
 * const funcNode = // AST node for: ({ name }: StubArgument<User>) => User
 * if (isAstParamStubArgumentTypeGuard({ funcNode })) {
 *   // Function's first parameter is typed as StubArgument
 * }
 * // Returns true if first param's type annotation is TSTypeReference to 'StubArgument'
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const isAstParamStubArgumentTypeGuard = ({
  funcNode,
}: {
  funcNode?:
    TSESTree.ArrowFunctionExpression | TSESTree.FunctionDeclaration | TSESTree.FunctionExpression;
}): boolean => {
  const [firstParam] = funcNode?.params ?? [];
  if (!firstParam) {
    return false;
  }

  // Get the type annotation - could be on AssignmentPattern or ObjectPattern
  const typeAnnotation =
    ('typeAnnotation' in firstParam ? firstParam.typeAnnotation : undefined) ??
    (firstParam.type === AST_NODE_TYPES.AssignmentPattern
      ? firstParam.left.typeAnnotation
      : undefined);

  if (!typeAnnotation) {
    return false;
  }

  const typeNode = typeAnnotation.typeAnnotation;

  // Check if it's a TSTypeReference with name 'StubArgument'
  if (typeNode.type !== AST_NODE_TYPES.TSTypeReference) {
    return false;
  }

  const { typeName } = typeNode;

  return typeName.type === AST_NODE_TYPES.Identifier && typeName.name === 'StubArgument';
};

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
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const isAstParamStubArgumentTypeGuard = ({ funcNode }: { funcNode?: Tsestree }): boolean => {
  if (!funcNode?.params || funcNode.params.length === 0) {
    return false;
  }

  const [firstParam] = funcNode.params;
  if (!firstParam) {
    return false;
  }

  // Get the type annotation - could be on AssignmentPattern or ObjectPattern
  const typeAnnotation = firstParam.typeAnnotation ?? firstParam.left?.typeAnnotation;

  if (!typeAnnotation?.typeAnnotation) {
    return false;
  }

  const typeNode = typeAnnotation.typeAnnotation;

  // Check if it's a TSTypeReference with name 'StubArgument'
  if (typeNode.type !== 'TSTypeReference') {
    return false;
  }

  const { typeName } = typeNode;
  if (!typeName || typeName.type !== 'Identifier') {
    return false;
  }

  return typeName.name === 'StubArgument';
};

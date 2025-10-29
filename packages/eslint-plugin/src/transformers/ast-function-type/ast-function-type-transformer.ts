import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

/**
 * PURPOSE: Determines if an arrow function is a guard or transformer based on its return type
 *
 * USAGE:
 * const type = astFunctionTypeTransformer({ node: arrowFunctionNode });
 * // Returns 'guard' if return type is boolean
 * // Returns 'transformer' if return type is something else
 * // Returns 'unknown' if cannot determine
 *
 * WHEN-TO-USE: When validating function naming conventions based on their return types
 */
export const astFunctionTypeTransformer = ({
  node,
}: {
  node?: Tsestree | undefined;
}): 'guard' | 'transformer' | 'unknown' => {
  if (node === undefined) {
    return 'unknown';
  }

  // Check if parent is VariableDeclarator to get return type annotation
  const { parent } = node;
  if (parent === undefined || parent === null || parent.type !== 'VariableDeclarator') {
    return 'unknown';
  }

  // Check if it's an arrow function with return type
  const arrowFunc = parent.init;
  if (
    arrowFunc === undefined ||
    arrowFunc === null ||
    arrowFunc.type !== 'ArrowFunctionExpression'
  ) {
    return 'unknown';
  }

  // Check return type annotation
  const { returnType } = arrowFunc;
  if (returnType === undefined || returnType === null) {
    return 'unknown';
  }

  // Type annotation structure: TSTypeAnnotation > TSBooleanKeyword
  const { typeAnnotation } = returnType;
  if (typeAnnotation === undefined || typeAnnotation === null) {
    return 'unknown';
  }

  if (typeAnnotation.type === 'TSBooleanKeyword') {
    return 'guard';
  }

  return 'transformer';
};

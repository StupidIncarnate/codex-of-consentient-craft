import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

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

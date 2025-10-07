import type { TSESTree } from '../../adapters/typescript-eslint-utils/typescript-eslint-utils-tsestree';

interface VariableDeclaratorNode {
  type: string;
  init?: {
    type?: string;
    returnType?: {
      typeAnnotation?: {
        type?: string;
      };
    };
  };
}

export const astFunctionTypeTransformer = ({
  node,
}: {
  node: TSESTree.Node;
}): 'guard' | 'transformer' | 'unknown' => {
  // Check if parent is VariableDeclarator to get return type annotation
  const parent = node.parent as VariableDeclaratorNode | undefined;
  const parentType = parent?.type;
  if (!parent || parentType !== 'VariableDeclarator') {
    return 'unknown';
  }

  // Check if it's an arrow function with return type
  const arrowFunc = parent.init;
  const arrowFuncType = arrowFunc?.type;
  if (!arrowFunc || arrowFuncType !== 'ArrowFunctionExpression') {
    return 'unknown';
  }

  // Check return type annotation
  const { returnType } = arrowFunc;
  if (!returnType) {
    return 'unknown';
  }

  // Type annotation structure: TSTypeAnnotation > TSBooleanKeyword
  const annotationType = returnType.typeAnnotation?.type;
  if (annotationType === 'TSBooleanKeyword') {
    return 'guard';
  }

  return 'transformer';
};

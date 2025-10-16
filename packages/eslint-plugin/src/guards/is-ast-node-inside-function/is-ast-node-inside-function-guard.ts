import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const isAstNodeInsideFunctionGuard = ({ node }: { node: Tsestree }): boolean => {
  let current = node.parent;
  while (current) {
    const nodeType = current.type as string;
    if (
      nodeType === 'ArrowFunctionExpression' ||
      nodeType === 'FunctionExpression' ||
      nodeType === 'FunctionDeclaration'
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
};

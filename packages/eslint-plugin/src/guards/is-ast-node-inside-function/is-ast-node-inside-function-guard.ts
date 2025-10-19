import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const isAstNodeInsideFunctionGuard = ({
  node,
}: {
  node?: Tsestree | undefined;
}): boolean => {
  if (node === undefined) {
    return false;
  }
  let current = node.parent;
  while (current !== undefined && current !== null) {
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

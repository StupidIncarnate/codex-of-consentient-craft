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
    if (
      current.type === 'ArrowFunctionExpression' ||
      current.type === 'FunctionExpression' ||
      current.type === 'FunctionDeclaration'
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
};

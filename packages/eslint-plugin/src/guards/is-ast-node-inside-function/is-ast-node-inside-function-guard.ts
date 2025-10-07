import type { TSESTree } from '../../adapters/typescript-eslint-utils/typescript-eslint-utils-tsestree';

export const isAstNodeInsideFunctionGuard = ({ node }: { node: TSESTree.Node }): boolean => {
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

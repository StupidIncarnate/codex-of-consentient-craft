import type { TSESTree } from '../../adapters/typescript-eslint-utils/typescript-eslint-utils-tsestree';

export const isAstNodeExportedGuard = ({ node }: { node: TSESTree.Node }): boolean => {
  let current = node.parent;
  while (current) {
    const nodeType = current.type as string;
    if (nodeType === 'ExportNamedDeclaration' || nodeType === 'ExportDefaultDeclaration') {
      return true;
    }
    current = current.parent;
  }
  return false;
};

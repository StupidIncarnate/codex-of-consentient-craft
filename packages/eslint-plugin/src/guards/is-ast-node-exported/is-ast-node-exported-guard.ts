import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const isAstNodeExportedGuard = ({ node }: { node: Tsestree }): boolean => {
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

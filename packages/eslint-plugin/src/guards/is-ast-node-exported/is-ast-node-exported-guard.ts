import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const isAstNodeExportedGuard = ({ node }: { node?: Tsestree | undefined }): boolean => {
  if (node === undefined) {
    return false;
  }
  let current = node.parent;
  while (current !== undefined && current !== null) {
    const nodeType = current.type;
    if (nodeType === 'ExportNamedDeclaration' || nodeType === 'ExportDefaultDeclaration') {
      return true;
    }
    current = current.parent;
  }
  return false;
};

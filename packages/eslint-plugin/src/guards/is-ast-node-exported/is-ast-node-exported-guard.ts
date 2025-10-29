import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

/**
 * PURPOSE: Checks if an AST node has an export declaration in its parent chain
 *
 * USAGE:
 * const funcNode = // AST node for: export const foo = () => {}
 * if (isAstNodeExportedGuard({ node: funcNode })) {
 *   // Node is exported (has ExportNamedDeclaration or ExportDefaultDeclaration parent)
 * }
 * // Returns true if any parent is an export declaration
 */
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

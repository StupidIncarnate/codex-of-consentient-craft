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
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const isAstNodeExportedGuard = ({ node }: { node?: TSESTree.Node | undefined }): boolean => {
  if (node === undefined) {
    return false;
  }
  let current = node.parent;
  while (current) {
    const nodeType = current.type;
    if (
      nodeType === AST_NODE_TYPES.ExportNamedDeclaration ||
      nodeType === AST_NODE_TYPES.ExportDefaultDeclaration
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
};

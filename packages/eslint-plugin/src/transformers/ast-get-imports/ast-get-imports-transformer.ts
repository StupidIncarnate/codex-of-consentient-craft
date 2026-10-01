/**
 * PURPOSE: Extracts imported names and their sources from an ImportDeclaration AST node
 *
 * USAGE:
 * const imports = astGetImportsTransformer({ node: importDeclarationNode });
 * // Returns Map { 'foo' => 'bar' } for import { foo } from 'bar'
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const astGetImportsTransformer = ({
  node,
}: {
  node?: TSESTree.Node;
}): Map<string, string> => {
  const imports = new Map<string, string>();

  if (node?.type !== AST_NODE_TYPES.ImportDeclaration) {
    return imports;
  }

  const modulePath = node.source.value;

  // Track all imported names: named, default and namespace imports alike
  for (const spec of node.specifiers) {
    imports.set(spec.local.name, modulePath);
  }

  return imports;
};

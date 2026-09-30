/**
 * PURPOSE: Extracts imported names and their sources from an ImportDeclaration AST node
 *
 * USAGE:
 * const imports = astGetImportsTransformer({ node: importDeclarationNode });
 * // Returns Map { 'foo' => 'bar' } for import { foo } from 'bar'
 */
import { identifierContract } from '@dungeonmaster/shared/contracts';
import type { Identifier } from '@dungeonmaster/shared/contracts';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const astGetImportsTransformer = ({
  node,
}: {
  node?: TSESTree.Node;
}): Map<Identifier, string> => {
  const imports = new Map<Identifier, string>();

  if (!node || node.type !== AST_NODE_TYPES.ImportDeclaration) {
    return imports;
  }

  const modulePath = node.source.value as string;

  // Track all imported names: named, default and namespace imports alike
  for (const spec of node.specifiers) {
    imports.set(identifierContract.parse(spec.local.name), modulePath);
  }

  return imports;
};

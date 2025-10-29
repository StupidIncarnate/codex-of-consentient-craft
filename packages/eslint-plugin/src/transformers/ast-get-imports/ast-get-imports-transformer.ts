/**
 * PURPOSE: Extracts imported names and their sources from an ImportDeclaration AST node
 *
 * USAGE:
 * const imports = astGetImportsTransformer({ node: importDeclarationNode });
 * // Returns Map { 'foo' => 'bar' } for import { foo } from 'bar'
 */
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';
import type { Identifier, ModulePath } from '@questmaestro/shared/contracts';

export const astGetImportsTransformer = ({
  node,
}: {
  node?: Tsestree;
}): Map<Identifier, ModulePath> => {
  const imports = new Map<Identifier, ModulePath>();

  if (!node || node.type !== 'ImportDeclaration') {
    return imports;
  }

  const source = node.source?.value;

  if (typeof source !== 'string') {
    return imports;
  }

  const modulePath = source as ModulePath;

  // Track all imported names
  const specifiers = node.specifiers ?? [];
  for (const spec of specifiers) {
    if (spec.type === 'ImportSpecifier' && spec.local?.name) {
      // Named import: import { foo } from 'bar'
      imports.set(spec.local.name, modulePath);
    } else if (spec.type === 'ImportDefaultSpecifier' && spec.local?.name) {
      // Default import: import foo from 'bar'
      imports.set(spec.local.name, modulePath);
    } else if (spec.type === 'ImportNamespaceSpecifier' && spec.local?.name) {
      // Namespace import: import * as foo from 'bar'
      imports.set(spec.local.name, modulePath);
    }
  }

  return imports;
};

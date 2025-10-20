import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

/**
 * Extracts imported names and their sources from an ImportDeclaration AST node.
 * Handles named imports, default imports, and namespace imports.
 *
 * @returns Map of local name -> import source
 * @example
 * // import { foo } from 'bar' => Map { 'foo' => 'bar' }
 * // import foo from 'bar' => Map { 'foo' => 'bar' }
 * // import * as foo from 'bar' => Map { 'foo' => 'bar' }
 */
export const astGetImportsTransformer = ({ node }: { node?: Tsestree }): Map<string, string> => {
  const imports = new Map<string, string>();

  if (!node || node.type !== 'ImportDeclaration') {
    return imports;
  }

  const source = node.source?.value;

  if (typeof source !== 'string') {
    return imports;
  }

  // Track all imported names
  const specifiers = node.specifiers ?? [];
  for (const spec of specifiers) {
    if (spec.type === 'ImportSpecifier' && spec.local?.name) {
      // Named import: import { foo } from 'bar'
      imports.set(spec.local.name, source);
    } else if (spec.type === 'ImportDefaultSpecifier' && spec.local?.name) {
      // Default import: import foo from 'bar'
      imports.set(spec.local.name, source);
    } else if (spec.type === 'ImportNamespaceSpecifier' && spec.local?.name) {
      // Namespace import: import * as foo from 'bar'
      imports.set(spec.local.name, source);
    }
  }

  return imports;
};

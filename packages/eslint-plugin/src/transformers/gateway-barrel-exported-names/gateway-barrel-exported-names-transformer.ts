/**
 * PURPOSE: Reads a gateway barrel file's own source text and answers which names it exports directly
 * (`export { readFile } from './read-file/read-file'`, `export const x = ...`, `export * as ns from
 * '...'`), plus the module specifiers of any `export * from '...'` passthrough lines it also carries.
 * enforce-gateway-config-names-exist follows those passthrough targets itself (a relative file gets a
 * second text scan, a bare specifier gets `require()`d) — this transformer only reads the ONE file
 * it is given, so it stays a pure text-in/data-out function instead of walking the filesystem itself.
 *
 * USAGE:
 * gatewayBarrelExportedNamesTransformer({ sourceText: "export { readFile } from './read-file/read-file';\nexport * from 'fs/promises';\n" });
 * // Returns { directNames: [Identifier('readFile')], reexportTargets: [ImportPath('fs/promises')] }
 */
import { importPathContract } from '@dungeonmaster/shared/contracts';
import type { ImportPath } from '@dungeonmaster/shared/contracts';

const NAMED_EXPORT_LIST = /export\s*\{([^}]+)\}(?:\s*from\s*['"][^'"]+['"])?/gu;
const NAMED_DECLARATION = /export\s+(?:const|function|class)\s+([A-Za-z0-9_$]+)/gu;
const NAMESPACE_REEXPORT = /export\s*\*\s*as\s+([A-Za-z0-9_$]+)\s*from\s*['"][^'"]+['"]/gu;
const PASSTHROUGH_REEXPORT = /export\s*\*\s*from\s*['"]([^'"]+)['"]/gu;

export const gatewayBarrelExportedNamesTransformer = ({
  sourceText,
}: {
  sourceText: string;
}): { directNames: string[]; reexportTargets: ImportPath[] } => {
  const directNames = new Set<string>();

  for (const match of sourceText.matchAll(NAMED_EXPORT_LIST)) {
    const [, list] = match;
    for (const rawSpecifier of (list ?? '').split(',')) {
      const specifier = rawSpecifier.trim();
      if (specifier.length === 0 || /^type\s+/u.test(specifier)) {
        continue;
      }
      const parts = specifier.split(/\s+as\s+/u);
      const exportedName = parts[parts.length - 1]?.trim();
      if (exportedName !== undefined && exportedName.length > 0) {
        directNames.add(exportedName);
      }
    }
  }

  for (const match of sourceText.matchAll(NAMED_DECLARATION)) {
    const [, name] = match;
    if (name !== undefined) {
      directNames.add(name);
    }
  }

  for (const match of sourceText.matchAll(NAMESPACE_REEXPORT)) {
    const [, name] = match;
    if (name !== undefined) {
      directNames.add(name);
    }
  }

  const reexportTargets = Array.from(sourceText.matchAll(PASSTHROUGH_REEXPORT))
    .map((match) => match[1])
    .filter((target) => target !== undefined)
    .map((target) => importPathContract.parse(target));

  return {
    directNames: Array.from(directNames),
    reexportTargets,
  };
};

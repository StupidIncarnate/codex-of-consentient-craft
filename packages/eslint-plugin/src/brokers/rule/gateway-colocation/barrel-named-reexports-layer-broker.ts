/**
 * PURPOSE: Walks a barrel's own `Program` body and returns every `export { a } from './a/a'`-shaped
 * statement as a flat `{name, source}` list — the one piece of data barrel-single-home,
 * barrel-no-test-support-reexport and barrel-completeness all need, computed once per barrel visit
 * instead of three times. Package-agnostic: reads only the AST, never a gateway guard, so B03 can
 * reuse it for a workspace package's own barrel later. `export *`, `export =` and global-capture
 * statements carry no per-name source to check and are not represented here.
 *
 * USAGE:
 * barrelNamedReexportsLayerBroker({ node: barrelProgramNode });
 * // Returns [{ name: 'readFileSync', source: './read-file-sync/read-file-sync' }, ...]
 */
import { importPathContract } from '@dungeonmaster/shared/contracts';
import type { Identifier, ImportPath } from '@dungeonmaster/shared/contracts';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

export const barrelNamedReexportsLayerBroker = ({
  node,
}: {
  node: Tsestree;
}): { name: Identifier; source: ImportPath }[] => {
  const statements = Array.isArray(node.body) ? node.body : [];
  const reexports: { name: Identifier; source: ImportPath }[] = [];

  for (const statement of statements) {
    if (statement.type !== 'ExportNamedDeclaration') {
      continue;
    }

    const sourceValue = statement.source?.value;
    if (typeof sourceValue !== 'string') {
      continue;
    }

    const source = importPathContract.parse(sourceValue);
    for (const specifier of statement.specifiers ?? []) {
      const exportedName = specifier.exported?.name;
      if (exportedName !== undefined) {
        reexports.push({ name: exportedName, source });
      }
    }
  }

  return reexports;
};

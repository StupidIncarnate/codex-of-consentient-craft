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
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const barrelNamedReexportsLayerBroker = ({
  node,
}: {
  node: TSESTree.Program;
}): { name: string; source: ImportPath }[] => {
  const reexports: { name: string; source: ImportPath }[] = [];

  for (const statement of node.body) {
    if (statement.type !== AST_NODE_TYPES.ExportNamedDeclaration || statement.source === null) {
      continue;
    }

    const source = importPathContract.parse(statement.source.value);
    for (const specifier of statement.specifiers) {
      if (specifier.exported.type === AST_NODE_TYPES.Identifier) {
        reexports.push({ name: specifier.exported.name, source });
      }
    }
  }

  return reexports;
};

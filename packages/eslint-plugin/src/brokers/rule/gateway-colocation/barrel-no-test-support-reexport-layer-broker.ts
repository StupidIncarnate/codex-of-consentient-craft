/**
 * PURPOSE: Refuses a production barrel that re-exports a name from a sibling `.proxy.ts` or
 * `.stub.ts` file. Under G26 there is no `_test_` barrel collecting proxies and stubs for
 * completeness — each is imported from its own file — so the only check left for a barrel is
 * negative: a `<subpath>.ts` re-export whose source ends in `.proxy` or `.stub` moves that file's
 * real "home" to the wrong place. Does not require a stub to exist (G18's job); only refuses one the
 * barrel already reaches for.
 *
 * USAGE:
 * const clean = barrelNoTestSupportReexportLayerBroker({
 *   node: barrelProgramNode,
 *   context,
 *   fileName: 'fs.ts',
 *   reexports: [{ name: 'readFileSyncProxy', source: './read-file-sync/read-file-sync.proxy' }],
 * });
 * // Reports 'barrelReexportsTestSupportFile' once, returns false
 */
import type { Identifier, ImportPath } from '@dungeonmaster/shared/contracts';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

export const barrelNoTestSupportReexportLayerBroker = ({
  node,
  context,
  fileName,
  reexports,
}: {
  node: Tsestree;
  context: EslintContext;
  fileName: string;
  reexports: { name: Identifier; source: ImportPath }[];
}): boolean => {
  let clean = true;

  for (const reexport of reexports) {
    if (!reexport.source.endsWith('.proxy') && !reexport.source.endsWith('.stub')) {
      continue;
    }

    clean = false;
    context.report({
      node,
      messageId: 'barrelReexportsTestSupportFile',
      data: { fileName, name: reexport.name, source: reexport.source },
    });
  }

  return clean;
};

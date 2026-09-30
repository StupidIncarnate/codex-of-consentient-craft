/**
 * PURPOSE: Refuses a barrel's named re-export whose relative `source` climbs out of the barrel's
 * own directory (`../fs/is-fs-error/is-fs-error`) — a barrel may re-export only from its OWN subpath
 * folder tree, never a sibling subpath's. A source starting with `./` stays inside; one starting
 * with `../` has already climbed at least one level above the subpath directory the barrel itself
 * sits in, which is enough to flag regardless of how deep it then descends again. A bare specifier
 * (an npm package or Node builtin, `'zod'`, `'fs/promises'`) is a pass-through, not a same-home
 * question, and never starts with `.` — untouched here.
 *
 * USAGE:
 * const stayedHome = barrelSingleHomeLayerBroker({
 *   node: barrelProgramNode,
 *   context,
 *   fileName: 'fs__promises.ts',
 *   reexports: [{ name: 'isFsError', source: '../fs/is-fs-error/is-fs-error' }],
 * });
 * // Reports 'reexportOutsideOwnSubpath' once, returns false
 */
import type { ImportPath } from '@dungeonmaster/shared/contracts';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const barrelSingleHomeLayerBroker = ({
  node,
  context,
  fileName,
  reexports,
}: {
  node: TSESTree.Node;
  context: TSESLint.RuleContext<string, unknown[]>;
  fileName: string;
  reexports: { name: string; source: ImportPath }[];
}): boolean => {
  let stayedHome = true;

  for (const reexport of reexports) {
    if (!reexport.source.startsWith('../')) {
      continue;
    }

    stayedHome = false;
    context.report({
      node,
      messageId: 'reexportOutsideOwnSubpath',
      data: { fileName, name: reexport.name, source: reexport.source },
    });
  }

  return stayedHome;
};

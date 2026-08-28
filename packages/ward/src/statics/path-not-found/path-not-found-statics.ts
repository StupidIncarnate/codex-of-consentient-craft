/**
 * PURPOSE: The lines ward prints when a `-- <files>` list names a path that is not on disk, in place
 * of the empty run it would otherwise report at exit 0
 *
 * USAGE:
 * import { pathNotFoundStatics } from '../../statics/path-not-found/path-not-found-statics';
 * process.stdout.write(`${pathNotFoundStatics.heading}\n${missing.join('\n')}\n`);
 *
 * WHY IT EXISTS: a path ward cannot find resolves to no package, spawns no child, and
 * `checkResultBuildTransformer` reads an EMPTY `projectResults` as `pass` rather than `skip` — so a
 * typo'd scope came back green at exit 0, indistinguishable from a scoped run that really passed.
 * That is a different answer from an empty git scope, which legitimately has nothing to check and
 * exits 0: a path the caller typed and disk does not have is the caller being wrong.
 */

export const pathNotFoundStatics = {
  heading: 'ward: NO CHECKS RAN — these paths in the file scope are not on disk:',
  guidance:
    'A scope naming a path disk does not have is a typo, not an empty run. Fix the spelling or drop the path. Paths are repo-relative.',
} as const;

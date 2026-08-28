/**
 * PURPOSE: The lines ward prints when a caller-typed `-- <files>` list is entirely on disk and the
 * run still finished with every file-scoped check reporting zero files.
 *
 * USAGE:
 * import { noFilesProcessedStatics } from '../../statics/no-files-processed/no-files-processed-statics';
 * process.stdout.write(`\n${noFilesProcessedStatics.heading}\n  scripts/x.mjs\n\n${noFilesProcessedStatics.guidance}\n`);
 *
 * REACH FOR THIS ONE, NOT `pathNotFoundStatics`, when the path RESOLVED. The two answer adjacent
 * halves of the same silence: `pathNotFoundStatics` is disk saying the caller typed a name that is
 * not there, this one is every check saying the name is there and none of them owns it. And neither
 * is `fileScopeEmptyStatics`, which speaks for a scope that resolved to no paths at all — a `--staged`
 * with nothing unpushed legitimately has nothing to check and exits 0.
 *
 * WHY IT EXISTS: `npm run ward -- --only lint -- scripts/build-workspaces.mjs` printed
 * `lint: WARN 0 files run` at exit 0 — `scripts/**` is in eslint.config.js `ignores`, the path
 * belongs to no workspace package, so no child ward spawned and `checkResultBuildTransformer` read
 * the empty `projectResults` as `pass`. That output is indistinguishable from a scoped run that
 * really passed, which is the shape an agent reports as green.
 */

export const noFilesProcessedStatics = {
  heading:
    'ward: NO CHECK PROCESSED these paths — they are on disk, and every file-scoped check in this run reported 0 files:',
  guidance:
    'A scope nothing checked is not a green run. Either the path lives outside every workspace package (ward spawns no child for it), or the checks you asked for exclude it — an eslint.config.js `ignores` entry, or a package that owns no test related to it. Fix the scope or the exclusion; do not read this run as a pass. Typecheck is not counted here because it always runs whole-package, regardless of file scope.',
} as const;

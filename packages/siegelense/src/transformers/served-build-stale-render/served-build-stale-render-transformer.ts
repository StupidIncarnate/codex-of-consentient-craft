/**
 * PURPOSE: Renders `start`'s stale-build warning — one `STALE BUILD:` line per served folder that
 * is behind the checkout, naming when it was built, the commit HEAD held then, how many files have
 * changed since and the first few of them, then one `REBUILD:` line naming the repo's own
 * `devServer.buildCommand`. The rebuild line says to run it only while no lane is live in the
 * checkout, because a build empties the served folder under any lane still serving it. An empty
 * list renders as the empty string, so the caller writes nothing for a current build. Written for
 * stderr: `start`'s stdout stays the one document its callers parse.
 *
 * USAGE:
 * servedBuildStaleRenderTransformer({ stale: [ServedBuildStaleStub()], buildCommand: ContentTextStub({ value: 'npm run build' }) });
 * // Returns 'STALE BUILD: this lane serves packages/web/dist, ...\nREBUILD: run `npm run build` ...\n'
 */

import type { ServedBuildStale } from '../../contracts/served-build-stale/served-build-stale-contract';
import { servedBuildStatics } from '../../statics/served-build/served-build-statics';

export const servedBuildStaleRenderTransformer = ({
  stale,
  buildCommand,
}: {
  stale: readonly ServedBuildStale[];
  buildCommand: string;
}): string => {
  if (stale.length === 0) {
    return '';
  }

  const { sampleFiles, shortCommitLength } = servedBuildStatics.render;

  const staleLines = stale.map((entry) => {
    const count = entry.changedFiles.length;
    const sample = entry.changedFiles.slice(0, sampleFiles).join(', ');
    const more = count > sampleFiles ? ` and ${String(count - sampleFiles)} more` : '';
    const noun = count === 1 ? 'file has' : 'files have';
    return `STALE BUILD: this lane serves ${entry.outDir}, last built ${new Date(entry.builtAtMs).toISOString()} at commit ${entry.baseCommit.slice(0, shortCommitLength)}; ${String(count)} ${noun} changed since, and the lane serves none of those changes: ${sample}${more}.`;
  });

  return [
    ...staleLines,
    `REBUILD: run \`${buildCommand}\` while no lane is live in this checkout — a build empties the folder a live lane serves — then start again.`,
    '',
  ].join('\n');
};

/**
 * PURPOSE: Reads source files a bounded number at a time. Reading every file of a large repo at
 * once opens more descriptors than the OS allows, so this takes one chunk, reads it in parallel,
 * then recurses on the rest. A file that vanished between the glob and the read (a dangling
 * symlink, a file deleted mid-run) is skipped, not fatal.
 *
 * USAGE:
 * await censusRepoReadSourcesChunkLayerBroker({ repoRoot, files });
 * // Returns [{ file: 'packages/a/src/x.ts', text: '...' }, ...] in the order given
 */
import { readFileIfExists } from '#gateway/node/fs__promises';
import { relative } from '#gateway/node/path';
import { censusSourceEntryContract } from '../../../contracts/census-source-entry/census-source-entry-contract';
import { censusLayoutStatics } from '../../../statics/census-layout/census-layout-statics';
import type { CensusSourceEntry } from '../../../contracts/census-source-entry/census-source-entry-contract';

export const censusRepoReadSourcesChunkLayerBroker = async ({
  repoRoot,
  files,
}: {
  repoRoot: string;
  files: readonly string[];
}): Promise<CensusSourceEntry[]> => {
  if (files.length === 0) {
    return [];
  }

  const chunk = files.slice(0, censusLayoutStatics.readChunkSize);
  const read = await Promise.all(
    chunk.map(async (absolute) => {
      const text = await readFileIfExists(absolute);
      return text === null
        ? null
        : censusSourceEntryContract.parse({ file: relative(repoRoot, absolute), text });
    }),
  );
  const rest = await censusRepoReadSourcesChunkLayerBroker({
    repoRoot,
    files: files.slice(censusLayoutStatics.readChunkSize),
  });

  return [...read.filter((entry) => entry !== null), ...rest];
};

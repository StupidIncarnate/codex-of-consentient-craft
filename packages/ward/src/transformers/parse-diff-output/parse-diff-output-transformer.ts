/**
 * PURPOSE: Parses git diff --name-only output into an array of GitRelativePath values
 *
 * USAGE:
 * const files = parseDiffOutputTransformer({ output: 'src/file1.ts\nsrc/file2.ts\n' });
 * // Returns [GitRelativePath('src/file1.ts'), GitRelativePath('src/file2.ts')]
 */

import {
  gitRelativePathContract,
  type GitRelativePath,
} from '../../contracts/git-relative-path/git-relative-path-contract';

export const parseDiffOutputTransformer = ({ output }: { output: string }): GitRelativePath[] =>
  output
    .trim()
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => gitRelativePathContract.parse(line));

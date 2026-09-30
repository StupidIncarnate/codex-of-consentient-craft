/**
 * PURPOSE: Parses git diff --name-only output into an array of GitRelativePath values
 *
 * USAGE:
 * const files = parseDiffOutputTransformer({ output: 'src/file1.ts\nsrc/file2.ts\n' });
 * // Returns [GitRelativePath('src/file1.ts'), GitRelativePath('src/file2.ts')]
 */


export const parseDiffOutputTransformer = ({ output }: { output: string }): string[] =>
  output
    .trim()
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => line);

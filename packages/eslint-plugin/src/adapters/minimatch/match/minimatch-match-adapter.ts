/**
 * PURPOSE: Tests whether a file path matches a glob pattern using the minimatch npm package
 *
 * USAGE:
 * import { minimatchMatchAdapter } from './minimatch-match-adapter';
 * const matched = minimatchMatchAdapter({ filePath: 'src/startup/start-install.ts', pattern: '**\/src\/startup\/start-install.ts' });
 * // Returns true if the path matches the glob, false otherwise
 */
import { minimatch } from 'minimatch';

export const minimatchMatchAdapter = ({
  filePath,
  pattern,
}: {
  filePath: string;
  pattern: string;
}): boolean => minimatch(filePath, pattern, { dot: true });

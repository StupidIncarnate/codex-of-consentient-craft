/**
 * PURPOSE: Returns true when a filename in a package's `bin/` directory is a non-test TypeScript source file
 *
 * USAGE:
 * isBinSourceFileNameGuard({ name: 'cli-entry.ts' });
 * // Returns true — eligible bin source
 *
 * isBinSourceFileNameGuard({ name: 'dungeonmaster.e2e.test.ts' });
 * // Returns false — test files are excluded
 */

import { projectMapStatics } from '../../statics/project-map/project-map-statics';

export const isBinSourceFileNameGuard = ({ name }: { name?: string }): boolean => {
  if (name === undefined) return false;
  if (!name.endsWith('.ts')) return false;
  return !projectMapStatics.testFileSuffixes.some((suffix) => name.endsWith(suffix));
};

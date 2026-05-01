/**
 * PURPOSE: Directory names to skip when recursively listing TypeScript source files for
 * architecture analysis. Excludes build artifacts, dependencies, version control, and
 * coverage reports so the edge-graph extractors only walk source code.
 *
 * USAGE:
 * import { listTsFilesSkipDirsStatics } from './list-ts-files-skip-dirs-statics';
 * if (listTsFilesSkipDirsStatics.skipDirNames.includes(entryName)) continue;
 *
 * WHEN-TO-USE: listTsFilesLayerBroker (and any sibling recursive walker) deciding whether
 * to descend into a subdirectory
 */

export const listTsFilesSkipDirsStatics = {
  skipDirNames: ['dist', 'node_modules', '.git', 'coverage', 'build', '.next', '.turbo'],
} as const;

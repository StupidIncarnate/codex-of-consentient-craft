/**
 * PURPOSE: Sorts a repo file by the part it plays for the census. A proxy, test, stub or harness
 * is never a production caller; a `.ts` file directly under a package root is a barrel, which is
 * followed to the files it re-exports and is neither a caller nor a subject.
 *
 * USAGE:
 * censusFileKindTransformer({ file: censusPath });
 * // Returns 'proxy' for packages/a/src/x/x-broker.proxy.ts
 */
import type { CensusFileKind } from '../../contracts/census-file-kind/census-file-kind-contract';

export const censusFileKindTransformer = ({ file }: { file: string }): CensusFileKind => {
  if (/\.stub\.tsx?$/u.test(file)) {
    return 'stub';
  }
  if (/\.proxy\.tsx?$/u.test(file)) {
    return 'proxy';
  }
  if (/\.(?:test|integration\.test|e2e)\.tsx?$/u.test(file)) {
    return 'test';
  }
  if (/\.harness\.tsx?$/u.test(file) || file.includes('/test/harnesses/')) {
    return 'harness';
  }
  if (/^packages\/(?:@[^/]+\/)?[^/]+\/[^/]+\.tsx?$/u.test(file)) {
    return 'barrel';
  }
  if (/\/(?:src|bin)\//u.test(file)) {
    return 'production';
  }
  return 'other';
};

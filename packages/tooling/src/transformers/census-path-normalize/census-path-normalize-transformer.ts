/**
 * PURPOSE: Folds `.` and `..` segments and doubled slashes out of a slash-separated path, so a
 * relative import joined onto its importer's folder lands on the same string the census keys files
 * by. Pure text, never the file system, so it behaves the same on every OS.
 *
 * USAGE:
 * censusPathNormalizeTransformer({ path: 'packages/a/src/x/../y/./z.ts' });
 * // Returns 'packages/a/src/y/z.ts' as a branded CensusPath
 */
import { censusPathContract } from '../../contracts/census-path/census-path-contract';
import type { CensusPath } from '../../contracts/census-path/census-path-contract';

export const censusPathNormalizeTransformer = ({ path }: { path: string }): CensusPath => {
  const parts = path.split('/');
  const kept = parts.slice(0, 0);

  for (const part of parts) {
    if (part === '..') {
      kept.pop();
    } else if (part !== '' && part !== '.') {
      kept.push(part);
    }
  }

  return censusPathContract.parse(kept.join('/'));
};

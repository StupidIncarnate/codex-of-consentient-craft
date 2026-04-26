/**
 * PURPOSE: Recursively probes a list of eslint config filename variants in searchPath, returning
 * the first existing AbsoluteFilePath. Returns null when every variant misses.
 *
 * USAGE:
 * await variantWalkLayerBroker({
 *   searchPath: FilePathStub({ value: '/project' }),
 *   variants: ['eslint.config.ts', 'eslint.config.js'],
 * });
 * // Returns AbsoluteFilePath of first existing variant, or null
 */

import { fsAccessAdapter } from '../../../adapters/fs/access/fs-access-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

const R_OK = 4;

export const variantWalkLayerBroker = async ({
  searchPath,
  variants,
}: {
  searchPath: FilePath;
  variants: readonly string[];
}): Promise<AbsoluteFilePath | null> => {
  const [head, ...rest] = variants;
  if (head === undefined) {
    return null;
  }

  const candidate = pathJoinAdapter({ paths: [searchPath, head] });

  try {
    await fsAccessAdapter({ filePath: candidate, mode: R_OK });
    return absoluteFilePathContract.parse(candidate);
  } catch {
    return variantWalkLayerBroker({ searchPath, variants: rest });
  }
};

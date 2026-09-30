/**
 * PURPOSE: Recursively probes a list of hook config filename variants in searchPath, returning
 * the first existing AbsoluteFilePath. Returns null when every variant misses.
 *
 * USAGE:
 * await variantWalkLayerBroker({
 *   searchPath: FilePathStub({ value: '/project' }),
 *   variants: ['.dungeonmaster-hooks.config.ts', '.dungeonmaster-hooks.config.js'],
 * });
 * // Returns AbsoluteFilePath of first existing variant, or null
 */

import { pathExists } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const variantWalkLayerBroker = async ({
  searchPath,
  variants,
}: {
  searchPath: string;
  variants: readonly string[];
}): Promise<AbsoluteFilePath | null> => {
  const [head, ...rest] = variants;
  if (head === undefined) {
    return null;
  }

  const candidate = join(searchPath, head);

  const exists = await pathExists(candidate);
  if (exists) {
    return absoluteFilePathContract.parse(candidate);
  }

  return variantWalkLayerBroker({ searchPath, variants: rest });
};

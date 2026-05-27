/**
 * PURPOSE: Reads a tsconfig.json file at the given path and parses it as TsconfigJsonWritable, returning undefined on any error
 *
 * USAGE:
 * readTsconfigSafeLayerBroker({ tsconfigPath: filePathContract.parse('/repo/packages/shared/tsconfig.json') });
 * // Returns: TsconfigJsonWritable if readable and valid JSON, undefined if file is missing or unparseable
 */

import { filePathContract, type FilePath } from '@dungeonmaster/shared/contracts';

import {
  tsconfigJsonWritableContract,
  type TsconfigJsonWritable,
} from '../../../contracts/tsconfig-json-writable/tsconfig-json-writable-contract';
import { fsReadJsonSyncAdapter } from '../../../adapters/fs/read-json-sync/fs-read-json-sync-adapter';

export const readTsconfigSafeLayerBroker = ({
  tsconfigPath,
}: {
  tsconfigPath: FilePath;
}): TsconfigJsonWritable | undefined => {
  try {
    const raw = fsReadJsonSyncAdapter({ filePath: filePathContract.parse(String(tsconfigPath)) });
    return tsconfigJsonWritableContract.parse(raw);
  } catch {
    return undefined;
  }
};

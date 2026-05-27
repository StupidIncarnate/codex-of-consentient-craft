/**
 * PURPOSE: Writes an updated tsconfig.json file for a single TsconfigSyncPair with corrected references
 *
 * USAGE:
 * const writtenPath = await tsconfigPairWriteLayerBroker({ pair: TsconfigSyncPairStub() });
 * // Returns the AbsoluteFilePath of the written tsconfig.json
 */

import {
  fileContentsContract,
  filePathContract,
  type AbsoluteFilePath,
} from '@dungeonmaster/shared/contracts';

import type { TsconfigSyncPair } from '../../../contracts/tsconfig-sync-pair/tsconfig-sync-pair-contract';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { tsconfigUpdateReferencesTransformer } from '../../../transformers/tsconfig-update-references/tsconfig-update-references-transformer';
import { tsconfigSerializeStatics } from '../../../statics/tsconfig-serialize/tsconfig-serialize-statics';

export const tsconfigPairWriteLayerBroker = async ({
  pair,
}: {
  pair: TsconfigSyncPair;
}): Promise<AbsoluteFilePath> => {
  const updated = tsconfigUpdateReferencesTransformer({
    tsconfigData: pair.currentData,
    references: pair.expectedRefs,
    ensureComposite: pair.ensureComposite,
  });
  const serialized = fileContentsContract.parse(
    `${JSON.stringify(updated, null, tsconfigSerializeStatics.jsonIndent)}\n`,
  );
  await fsWriteFileAdapter({
    filePath: filePathContract.parse(String(pair.tsconfigPath)),
    contents: serialized,
  });
  return pair.tsconfigPath;
};

/**
 * PURPOSE: Appends ONE validated `DrivingOddity` to the committed driving-oddity file as its own JSON
 * line, via a single `fsAppendFileAdapter` call — so every entry already on disk stays byte-for-byte
 * untouched, the same guarantee `runTranscriptAppendBroker` gives a run's transcript. Refuses a
 * SECOND entry for a `key` the file already carries rather than merging it: merging means rewriting
 * an existing line, and this broker's whole job is to never do that. A round that finds an existing
 * entry WRONG corrects it by editing the file directly, not through this call. Takes the already-
 * resolved `filePath` for the same reason `drivingOddityReadBroker` does — no resolver for the
 * committed oddities file's directory exists yet.
 *
 * USAGE:
 * await drivingOddityAppendBroker({
 *   filePath: AbsoluteFilePathStub({ value: '/repo/.dungeonmaster-assets/driving-oddities.jsonl' }),
 *   entry: DrivingOddityStub({ key: 'GUILD_ADD_MODAL' }),
 * });
 * // Appends one JSON line, then returns { success: true }
 */

import { fileContentsContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, AdapterResult } from '@dungeonmaster/shared/contracts';

import { fsAppendFileAdapter } from '../../../adapters/fs/append-file/fs-append-file-adapter';
import type { DrivingOddity } from '../../../contracts/driving-oddity/driving-oddity-contract';
import { DrivingOddityDuplicateKeyError } from '../../../errors/driving-oddity-duplicate-key/driving-oddity-duplicate-key-error';
import { drivingOddityReadBroker } from '../read/driving-oddity-read-broker';

export const drivingOddityAppendBroker = async ({
  filePath,
  entry,
}: {
  filePath: AbsoluteFilePath;
  entry: DrivingOddity;
}): Promise<AdapterResult> => {
  const existing = await drivingOddityReadBroker({ filePath });

  const duplicate = existing.find((existingEntry) => existingEntry.key === entry.key);
  if (duplicate !== undefined) {
    throw new DrivingOddityDuplicateKeyError({ key: entry.key, filePath });
  }

  return fsAppendFileAdapter({
    filePath,
    contents: fileContentsContract.parse(`${JSON.stringify(entry)}\n`),
  });
};

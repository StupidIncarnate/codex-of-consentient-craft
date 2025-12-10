/**
 * PURPOSE: Loads and parses a single quest JSON file
 *
 * USAGE:
 * await questLoadBroker({questFilePath: FilePathStub({value: '/quests/quest-1.json'})});
 * // Returns parsed Quest object
 */

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { questContract } from '../../../contracts/quest/quest-contract';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import type { Quest } from '../../../contracts/quest/quest-contract';

export const questLoadBroker = async ({
  questFilePath,
}: {
  questFilePath: FilePath;
}): Promise<Quest> => {
  const fileContents = await fsReadFileAdapter({ filePath: questFilePath });

  try {
    const questData: unknown = JSON.parse(fileContents);
    return questContract.parse(questData);
  } catch (error) {
    throw new Error(`Failed to parse quest file at ${questFilePath}`, { cause: error });
  }
};

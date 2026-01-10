/**
 * PURPOSE: Deletes any existing .cli-signal file for a fresh start before spawning agent
 *
 * USAGE:
 * await signalCleanupBroker({ questsFolderPath: FilePathStub({value: '/project/.dungeonmaster-quests'}) });
 * // Deletes .cli-signal if it exists, does nothing if it doesn't
 */

import { fsUnlinkAdapter } from '../../../adapters/fs/unlink/fs-unlink-adapter';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { filePathContract } from '@dungeonmaster/shared/contracts';

const SIGNAL_FILENAME = '.cli-signal';

export const signalCleanupBroker = async ({
  questsFolderPath,
}: {
  questsFolderPath: FilePath;
}): Promise<void> => {
  const signalFilePath = filePathContract.parse(`${questsFolderPath}/${SIGNAL_FILENAME}`);

  try {
    await fsUnlinkAdapter({ filePath: signalFilePath });
  } catch {
    // Ignore errors - file may not exist, which is fine
  }
};

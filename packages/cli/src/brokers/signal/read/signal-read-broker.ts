/**
 * PURPOSE: Reads and parses the .cli-signal file, then deletes it
 *
 * USAGE:
 * const signal = await signalReadBroker({ questsFolderPath: FilePathStub({value: '/project/.dungeonmaster-quests'}) });
 * // Returns parsed SignalContent after reading and deleting the signal file
 */

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsUnlinkAdapter } from '../../../adapters/fs/unlink/fs-unlink-adapter';
import { signalContentContract } from '../../../contracts/signal-content/signal-content-contract';
import type { SignalContent } from '../../../contracts/signal-content/signal-content-contract';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { filePathContract } from '@dungeonmaster/shared/contracts';

const SIGNAL_FILENAME = '.cli-signal';

export const signalReadBroker = async ({
  questsFolderPath,
}: {
  questsFolderPath: FilePath;
}): Promise<SignalContent> => {
  const signalFilePath = filePathContract.parse(`${questsFolderPath}/${SIGNAL_FILENAME}`);

  const contents = await fsReadFileAdapter({ filePath: signalFilePath });
  const signalData: unknown = JSON.parse(contents);
  const signal = signalContentContract.parse(signalData);

  await fsUnlinkAdapter({ filePath: signalFilePath });

  return signal;
};

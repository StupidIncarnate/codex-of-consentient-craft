/**
 * PURPOSE: Signals the CLI to return control by writing a signal file to .dungeonmaster-quests
 *
 * USAGE:
 * await signalCliReturnBroker({ screen: 'list' });
 * // Writes signal file and returns { success: true, signalPath: '...' }
 */

import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { signalCliReturnInputContract } from '../../../contracts/signal-cli-return-input/signal-cli-return-input-contract';
import { signalCliReturnResultContract } from '../../../contracts/signal-cli-return-result/signal-cli-return-result-contract';
import { fileContentsContract } from '../../../contracts/file-contents/file-contents-contract';
import type { SignalCliReturnResult } from '../../../contracts/signal-cli-return-result/signal-cli-return-result-contract';

const QUESTS_FOLDER_NAME = '.dungeonmaster-quests';
const SIGNAL_FILE_NAME = '.cli-signal';

export const signalCliReturnBroker = async ({
  screen,
}: {
  screen?: 'menu' | 'list';
}): Promise<SignalCliReturnResult> => {
  const validatedInput = signalCliReturnInputContract.parse({ screen });

  const questsFolder = pathJoinAdapter({
    paths: [process.cwd(), QUESTS_FOLDER_NAME],
  });

  const signalPath = pathJoinAdapter({
    paths: [questsFolder, SIGNAL_FILE_NAME],
  });

  const signalContent = fileContentsContract.parse(
    JSON.stringify({
      action: 'return',
      screen: validatedInput.screen,
      timestamp: new Date().toISOString(),
    }),
  );

  await fsWriteFileAdapter({
    filepath: signalPath,
    contents: signalContent,
  });

  return signalCliReturnResultContract.parse({
    success: true,
    signalPath,
  });
};

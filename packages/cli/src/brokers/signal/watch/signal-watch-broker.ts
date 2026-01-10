/**
 * PURPOSE: Watches for .cli-signal file to appear and returns its parsed content
 *
 * USAGE:
 * const signal = await signalWatchBroker({ questsFolderPath: FilePathStub({value: '/project/.dungeonmaster-quests'}) });
 * // Returns parsed SignalContent when signal file is detected
 */

import { fsWatchAdapter } from '../../../adapters/fs/watch/fs-watch-adapter';
import { signalReadBroker } from '../read/signal-read-broker';
import type { SignalContent } from '../../../contracts/signal-content/signal-content-contract';
import type { FilePath } from '@dungeonmaster/shared/contracts';

const SIGNAL_FILENAME = '.cli-signal';

export const signalWatchBroker = async ({
  questsFolderPath,
}: {
  questsFolderPath: FilePath;
}): Promise<SignalContent> =>
  new Promise((resolve, reject) => {
    const watcher = fsWatchAdapter({
      dirPath: questsFolderPath,
      onChange: ({ filename }) => {
        if (filename === SIGNAL_FILENAME) {
          watcher.close();
          signalReadBroker({ questsFolderPath }).then(resolve).catch(reject);
        }
      },
    });
  });

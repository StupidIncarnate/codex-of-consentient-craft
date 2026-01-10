/**
 * PURPOSE: Wraps fs.watch() for watching directory changes
 *
 * USAGE:
 * const watcher = fsWatchAdapter({ dirPath: FilePathStub({value: '/quests'}), onChange: ({filename}) => {} });
 * watcher.close(); // Stop watching
 */

import { watch } from 'fs';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export interface FsWatcher {
  close: () => void;
}

export const fsWatchAdapter = ({
  dirPath,
  onChange,
}: {
  dirPath: FilePath;
  onChange: (params: { filename: string }) => void;
}): FsWatcher => {
  const watcher = watch(dirPath, (_eventType, filename) => {
    if (filename) {
      onChange({ filename });
    }
  });

  return {
    close: (): void => {
      watcher.close();
    },
  };
};

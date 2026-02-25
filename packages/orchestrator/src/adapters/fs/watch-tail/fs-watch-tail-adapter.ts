/**
 * PURPOSE: Tails a file by watching for appended lines using fs.watch and fs.createReadStream
 *
 * USAGE:
 * const stop = fsWatchTailAdapter({
 *   filePath: AbsoluteFilePathStub({ value: '/path/to/file.jsonl' }),
 *   onLine: ({ line }) => process.stdout.write(line + '\n'),
 *   onError: ({ error }) => process.stderr.write(String(error) + '\n'),
 * });
 * // later:
 * stop();
 */

import { watch, createReadStream, statSync } from 'fs';
import { createInterface } from 'readline';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export interface FsWatchTailHandle {
  stop: () => void;
}

export const fsWatchTailAdapter = ({
  filePath,
  onLine,
  onError,
}: {
  filePath: AbsoluteFilePath;
  onLine: (params: { line: string }) => void;
  onError: (params: { error: unknown }) => void;
}): FsWatchTailHandle => {
  let position = statSync(filePath).size;
  let reading = false;
  let stopped = false;
  const watcher = watch(filePath, () => {
    if (reading || stopped) {
      return;
    }

    reading = true;

    const stream = createReadStream(filePath, {
      start: position,
      encoding: 'utf8',
    });

    const rl = createInterface({ input: stream });

    rl.on('line', (line) => {
      if (!stopped && line.length > 0) {
        onLine({ line });
      }
    });

    rl.on('close', () => {
      try {
        position = statSync(filePath).size;
      } catch (statError) {
        if (!stopped) {
          onError({ error: statError });
        }
      }
      reading = false;
    });

    stream.on('error', (streamError) => {
      reading = false;
      if (!stopped) {
        onError({ error: streamError });
      }
    });
  });

  watcher.on('error', (watchError) => {
    if (!stopped) {
      onError({ error: watchError });
    }
  });

  return {
    stop: (): void => {
      stopped = true;
      watcher.close();
    },
  };
};

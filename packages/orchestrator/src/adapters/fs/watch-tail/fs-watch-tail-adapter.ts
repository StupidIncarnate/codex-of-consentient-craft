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
  startPosition,
}: {
  filePath: AbsoluteFilePath;
  onLine: (params: { line: string }) => void;
  onError: (params: { error: unknown }) => void;
  startPosition?: 'beginning' | 'end';
}): FsWatchTailHandle => {
  // `beginning` (default) — drain any existing content before watching. Needed for the
  // sub-agent tail: the parent blocks on the Agent tool until the sub-agent completes,
  // Claude CLI writes the full sub-agent JSONL during that block, and only then do we
  // receive the tool_result and start the tail. Reading from 0 ensures the streaming
  // sub-agent chain sees the same entries as replay does.
  //
  // `end` — only emit lines appended AFTER the tail starts. Used by the main-session
  // post-exit fallback: stdout already streamed lines up to this file size, and we want
  // to catch background-agent task-notifications that Claude CLI appends later without
  // re-emitting anything that already went through stdout.
  const initialPosition = startPosition === 'end' ? statSync(filePath).size : 0;
  const state = { position: initialPosition, reading: false, stopped: false };

  const watcher = watch(filePath, () => {
    if (state.reading || state.stopped) {
      return;
    }

    state.reading = true;

    const stream = createReadStream(filePath, {
      start: state.position,
      encoding: 'utf8',
    });

    const rl = createInterface({ input: stream });

    rl.on('line', (line) => {
      if (!state.stopped && line.length > 0) {
        onLine({ line });
      }
    });

    rl.on('error', (rlError) => {
      state.reading = false;
      if (!state.stopped) {
        onError({ error: rlError });
      }
    });

    rl.on('close', () => {
      try {
        state.position = statSync(filePath).size;
      } catch (statError) {
        if (!state.stopped) {
          onError({ error: statError });
        }
      }
      state.reading = false;
    });

    stream.on('error', (streamError) => {
      state.reading = false;
      if (!state.stopped) {
        onError({ error: streamError });
      }
    });
  });

  watcher.on('error', (watchError) => {
    if (!state.stopped) {
      onError({ error: watchError });
    }
  });

  // Trigger an immediate drain of any existing file content. `fs.watch` does not fire
  // until the file changes, so without this we'd miss all lines written before the tail
  // started. We emit a synthetic 'change' event on the watcher to reuse the same drain
  // path rather than duplicating the readline/stream setup.
  watcher.emit('change', 'rename', filePath);

  return {
    stop: (): void => {
      state.stopped = true;
      watcher.close();
    },
  };
};

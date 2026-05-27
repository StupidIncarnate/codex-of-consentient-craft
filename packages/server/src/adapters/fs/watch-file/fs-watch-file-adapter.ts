/**
 * PURPOSE: Watches a single file for changes (creation, modification, removal) by watching its containing directory and filtering events to the target filename. Fires onChange with the current file contents (or null when the file does not exist) every time the file is touched
 *
 * USAGE:
 * const handle = fsWatchFileAdapter({
 *   dirPath: '/home/user/.dungeonmaster',
 *   fileName: 'active-monitor-session.json',
 *   onChange: ({ contents }) => process.stdout.write(String(contents) + '\n'),
 *   onError: ({ error }) => process.stderr.write(String(error) + '\n'),
 * });
 * // handle.stop() — stops the directory watcher
 *
 * WHEN-TO-USE: Watching the active-monitor-session.json file written by the MCP server.
 *   The directory may not exist yet (fresh install); the adapter creates it if missing.
 *   Watching the file directly is impossible when it may not yet exist (fs.watch throws
 *   ENOENT), so we watch the containing directory and filter events to the target name.
 * WHEN-NOT-TO-USE: For appending/tailing newline-delimited content — use a line-tail
 *   adapter for that pattern.
 */

import { watch, readFileSync, existsSync, mkdirSync } from 'fs';

export interface FsWatchFileHandle {
  stop: () => void;
}

export const fsWatchFileAdapter = ({
  dirPath,
  fileName,
  onChange,
  onError,
}: {
  dirPath: string;
  fileName: string;
  onChange: (params: { contents: string | null }) => void;
  onError: (params: { error: unknown }) => void;
}): FsWatchFileHandle => {
  // Ensure the directory exists before fs.watch — fs.watch on a missing directory throws
  // ENOENT synchronously. Use mkdirSync recursive so a fresh install (DUNGEONMASTER_HOME
  // not yet created) doesn't crash the server startup.
  try {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
  } catch (mkdirError) {
    onError({ error: mkdirError });
  }

  const state = { stopped: false };
  const fullPath = `${dirPath}/${fileName}`;

  let watcher: ReturnType<typeof watch> | null = null;

  try {
    watcher = watch(dirPath, (_event, changedFileName): void => {
      if (state.stopped) return;
      // fs.watch's filename may be null on some platforms; conservatively drain in that
      // case. When the filename is present, only react to events matching our target.
      if (changedFileName !== null && changedFileName !== fileName) return;

      try {
        if (!existsSync(fullPath)) {
          onChange({ contents: null });
          return;
        }
        const contents = readFileSync(fullPath, 'utf8');
        onChange({ contents });
      } catch (readError) {
        onError({ error: readError });
      }
    });

    watcher.on('error', (watchError): void => {
      if (state.stopped) return;
      onError({ error: watchError });
    });
  } catch (watchSetupError) {
    onError({ error: watchSetupError });
  }

  // Fire the initial drain so the caller observes the file's current state. fs.watch only
  // fires on subsequent changes, and the active-monitor-session.json may already be on
  // disk from a prior MCP server start.
  if (!state.stopped) {
    try {
      if (existsSync(fullPath)) {
        const contents = readFileSync(fullPath, 'utf8');
        onChange({ contents });
      } else {
        onChange({ contents: null });
      }
    } catch (readError) {
      onError({ error: readError });
    }
  }

  return {
    stop: (): void => {
      state.stopped = true;
      if (watcher !== null) {
        watcher.close();
      }
    },
  };
};

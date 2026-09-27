/**
 * PURPOSE: Tails a file for appended lines using `fs.watch`, a read stream and readline. Moved
 * whole from orchestrator's session-JSONL tail, with no contracts — a gateway wrapper takes and
 * returns plain values only. ENOENT at construction reports through `onError` unless
 * `awaitCreate` is set, in which case the parent directory is watched until the file appears. A
 * file that shrinks resets the read position to 0, since a shorter file is one that was replaced
 * or truncated and every later append lands below the last-read position otherwise.
 *
 * USAGE:
 * const handle = tailFile({
 *   path: '/home/user/.claude/projects/-repo/abc.jsonl',
 *   startPosition: 'end',
 *   onLine: ({ line }) => process.stdout.write(`${line}\n`),
 *   onError: ({ error }) => process.stderr.write(`${String(error)}\n`),
 * });
 * // later:
 * handle.stop();
 */
import { watch, createReadStream, statSync, existsSync } from 'fs';
import { dirname } from 'path';
import { createInterface } from 'readline';
import type { TailFileHandle } from './tail-file-handle';

// Safety bound for `awaitCreate`: if a file never appears, stop watching the parent directory
// after this window and surface ENOENT rather than leaking a directory watcher forever.
const AWAIT_CREATE_TIMEOUT_MS = 120_000;

export const tailFile = ({
  path,
  onLine,
  onError,
  startPosition,
  awaitCreate,
}: {
  path: string;
  onLine: (params: { line: string }) => void;
  onError: (params: { error: unknown }) => void;
  startPosition?: 'beginning' | 'end';
  awaitCreate?: boolean;
}): TailFileHandle => {
  // fs.watch and statSync throw synchronously when the path is missing. Check first via
  // existsSync and surface the error through onError instead of letting fs.watch crash the
  // process. The TOCTOU window between this check and the fs.watch call is real but tiny next to
  // the seconds-to-minutes a genuinely missing file stays missing.
  if (!existsSync(path)) {
    if (awaitCreate !== true) {
      onError({ error: new Error(`ENOENT: file does not exist: ${path}`) });
      return {
        stop: (): void => {
          // No watcher was created; nothing to tear down.
        },
      };
    }

    const awaitState: { stopped: boolean; inner: TailFileHandle | null } = {
      stopped: false,
      inner: null,
    };
    let dirWatcher: ReturnType<typeof watch> | null = null;
    let awaitTimer: ReturnType<typeof setTimeout> | null = null;

    try {
      // The first parent-dir change after the file exists delegates to a normal tail. The
      // callback is idempotent (guards on `inner` + existsSync) so repeated dir events and the
      // synthetic TOCTOU emit below all collapse to a single delegated tail.
      dirWatcher = watch(dirname(path), (): void => {
        if (awaitState.stopped || awaitState.inner !== null || !existsSync(path)) {
          return;
        }
        if (dirWatcher !== null) {
          dirWatcher.close();
          dirWatcher = null;
        }
        if (awaitTimer !== null) {
          clearTimeout(awaitTimer);
          awaitTimer = null;
        }
        awaitState.inner = tailFile({
          path,
          onLine,
          onError,
          ...(startPosition === undefined ? {} : { startPosition }),
        });
      });
    } catch (dirWatchError: unknown) {
      onError({ error: dirWatchError });
      return {
        stop: (): void => {
          // No watcher was created; nothing to tear down.
        },
      };
    }

    dirWatcher.on('error', (dirError: unknown): void => {
      if (!awaitState.stopped) {
        onError({ error: dirError });
      }
    });

    awaitTimer = setTimeout((): void => {
      if (awaitState.stopped || awaitState.inner !== null) {
        return;
      }
      onError({ error: new Error(`ENOENT: file did not appear within timeout: ${path}`) });
      if (dirWatcher !== null) {
        dirWatcher.close();
        dirWatcher = null;
      }
    }, AWAIT_CREATE_TIMEOUT_MS);
    awaitTimer.unref();

    // TOCTOU: the file may have appeared between the existsSync check above and the dir watch
    // being armed — fire the watch callback once so we don't wait on a change that already
    // happened. The callback's existsSync guard makes this a no-op if it hasn't.
    dirWatcher.emit('change', 'rename', path);

    return {
      stop: (): void => {
        awaitState.stopped = true;
        if (dirWatcher !== null) {
          dirWatcher.close();
          dirWatcher = null;
        }
        if (awaitTimer !== null) {
          clearTimeout(awaitTimer);
          awaitTimer = null;
        }
        awaitState.inner?.stop();
      },
    };
  }

  const state = {
    position: startPosition === 'end' ? statSync(path).size : 0,
    reading: false,
    stopped: false,
    // Set when a change event fires while a drain is already in flight, so the currently
    // reading drain's settle handler can re-trigger once it finishes.
    pendingDrain: false,
  };

  const watcher = watch(path, () => {
    if (state.stopped) {
      return;
    }
    if (state.reading) {
      state.pendingDrain = true;
      return;
    }

    state.reading = true;

    // A file SHORTER than where we last read was replaced or emptied. Every later append then
    // lands below `state.position`, so without this reset the tail opens past the end and never
    // delivers another line.
    try {
      if (statSync(path).size < state.position) {
        state.position = 0;
      }
    } catch (sizeError: unknown) {
      onError({ error: sizeError });
    }

    const stream = createReadStream(path, { start: state.position, encoding: 'utf8' });
    const rl = createInterface({ input: stream });

    rl.on('line', (line) => {
      if (!state.stopped && line.length > 0) {
        try {
          onLine({ line });
        } catch (lineError: unknown) {
          // readline invokes this handler outside any caller frame, so an unguarded throw here
          // is an uncaught exception that kills the process. Logged rather than sent to onError:
          // callers routinely no-op that channel for expected tail noise, and a consumer bug
          // must stay visible regardless.
          process.stderr.write(`[tail-file] onLine failed for ${path}: ${String(lineError)}\n`);
        }
      }
    });

    rl.on('error', (rlError) => {
      state.reading = false;
      if (!state.stopped) {
        onError({ error: rlError });
      }
      if (state.pendingDrain && !state.stopped) {
        state.pendingDrain = false;
        watcher.emit('change', 'rename', path);
      }
    });

    rl.on('close', () => {
      try {
        state.position = statSync(path).size;
      } catch (statError) {
        if (!state.stopped) {
          onError({ error: statError });
        }
      }
      state.reading = false;
      if (state.pendingDrain && !state.stopped) {
        state.pendingDrain = false;
        watcher.emit('change', 'rename', path);
      }
    });

    stream.on('error', (streamError) => {
      state.reading = false;
      if (!state.stopped) {
        onError({ error: streamError });
      }
      if (state.pendingDrain && !state.stopped) {
        state.pendingDrain = false;
        watcher.emit('change', 'rename', path);
      }
    });
  });

  watcher.on('error', (watchError) => {
    if (!state.stopped) {
      onError({ error: watchError });
    }
  });

  // Trigger an immediate drain of any existing file content: fs.watch does not fire until the
  // file changes, so without this the tail would miss everything written before it started.
  watcher.emit('change', 'rename', path);

  return {
    stop: (): void => {
      state.stopped = true;
      watcher.close();
    },
  };
};

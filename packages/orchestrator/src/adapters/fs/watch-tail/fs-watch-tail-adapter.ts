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

import { watch, createReadStream, statSync, existsSync } from 'fs';
import { dirname } from 'path';
import { createInterface } from 'readline';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

// Safety bound for `awaitCreate`: if a session file never appears (e.g. the spawned child
// died before Claude CLI wrote its JSONL), stop watching the parent dir after this window
// and surface ENOENT rather than leaking a directory watcher forever. Comfortably longer
// than the observed sub-second gap between the child's stdout init line and the on-disk file.
const AWAIT_CREATE_TIMEOUT_MS = 120_000;

export interface FsWatchTailHandle {
  stop: () => void;
  // Resolves once the synthetic-emit drain triggered at adapter creation has fully
  // delivered every existing line via `onLine` (or there was nothing to drain). Callers
  // that need to KNOW the file's pre-existing content has been consumed before they
  // proceed (e.g. chat-subagent-tail-broker — chat-start-responder.onComplete awaits
  // every sub-agent's initialDrain before emitting chat-complete so the wire never sees
  // chat-complete arrive before pre-existing on-disk lines) MUST await this. Callers
  // that only care about new appends after the watcher started can ignore it. Resolves
  // immediately when `startPosition: 'end'` (nothing to drain). Calling `stop()` also
  // resolves it so awaiters never hang on torn-down adapters.
  initialDrain: Promise<void>;
}

export const fsWatchTailAdapter = ({
  filePath,
  onLine,
  onError,
  startPosition,
  awaitCreate,
}: {
  filePath: AbsoluteFilePath;
  onLine: (params: { line: string }) => void;
  onError: (params: { error: unknown }) => void;
  startPosition?: 'beginning' | 'end';
  // When the file is missing at construction: default (false) surfaces ENOENT immediately —
  // the caller wants to know (orphan sub-agent reference). `true` instead watches the parent
  // directory until the file appears, then tails it from the beginning. Use for a top-level
  // session JSONL the spawned child WILL write imminently: the child's sessionId reaches us
  // via its stdout init line and starts this tail a beat before Claude CLI flushes the file
  // to disk, so a plain existsSync check races the write and would strand a dead tail.
  awaitCreate?: boolean;
}): FsWatchTailHandle => {
  // `beginning` (default) — drain any existing content before watching, then keep
  // watching for appends. Used by the sub-agent tail. There are two cases:
  //   1. Foreground Task — the parent blocks on the Agent tool until the sub-agent
  //      completes; Claude CLI writes the full sub-agent JSONL during that block; we
  //      receive the tool_result and start the tail; the synthetic-emit drain reads
  //      the now-complete file. The watcher then sits idle for the rest of the chat.
  //   2. Background Task (`run_in_background: true`) — the parent gets a synthetic
  //      `async_launched` tool_result almost immediately and then exits its turn while
  //      Claude CLI continues writing the sub-agent JSONL for many more seconds. The
  //      watcher must keep running past parent CLI exit so those late appends still
  //      reach the wire. chat-start-responder accordingly stops sub-agent tails only
  //      on chat-process teardown, not on parent CLI exit.
  // In either case, reading from 0 ensures the streaming sub-agent chain sees the same
  // entries as replay does.
  //
  // `end` — only emit lines appended AFTER the tail starts. Used by the main-session
  // post-exit fallback: stdout already streamed lines up to this file size, and we want
  // to catch background-agent task-notifications that Claude CLI appends later without
  // re-emitting anything that already went through stdout.
  // The synthetic-emit drain is async (createReadStream + readline). We expose its
  // completion as a promise so chat-start-responder.onComplete can await every drain
  // before emitting chat-complete on the wire — without that await, queued readline
  // 'line' events could fire after chat-complete and arrive at the client out of order.
  // `resolveInitialDrainRef` is populated synchronously inside the Promise executor,
  // then captured in event-handler closures; resolving more than once is a no-op
  // (Promise resolve is idempotent).
  const resolveInitialDrainRef: { current: (() => void) | null } = { current: null };
  const initialDrain = new Promise<void>((resolve) => {
    resolveInitialDrainRef.current = resolve;
  });

  // fs.watch + statSync throw synchronously when the path is missing — most commonly an
  // orphan sub-agent reference in the main JSONL (a historical `tool_use_result.agentId`
  // line whose `subagents/agent-<id>.jsonl` was removed off-disk). Check first via
  // existsSync and surface the error through onError instead of letting fs.watch crash
  // the process. There's a tiny TOCTOU window between this check and the fs.watch call,
  // but the live-orphan case we care about has the file missing for seconds-to-minutes,
  // so there's no realistic race.
  if (!existsSync(filePath)) {
    // Default: surface ENOENT so the caller can react (orphan sub-agent reference). With
    // `awaitCreate`, instead watch the parent dir until the file appears, then delegate to a
    // normal tail. Tailing from the beginning means every line written during the create gap
    // is recovered, so no worker transcript is lost even though the tail started early.
    if (awaitCreate !== true) {
      onError({ error: new Error(`ENOENT: file does not exist: ${String(filePath)}`) });
      resolveInitialDrainRef.current?.();
      return {
        stop: (): void => {
          // No watcher was created; nothing to tear down.
        },
        initialDrain,
      };
    }

    const awaitState: { stopped: boolean; inner: FsWatchTailHandle | null } = {
      stopped: false,
      inner: null,
    };
    let dirWatcher: ReturnType<typeof watch> | null = null;
    let awaitTimer: ReturnType<typeof setTimeout> | null = null;

    try {
      // The first parent-dir change after the file exists delegates to a normal tail. The
      // callback is idempotent (guards on `inner` + existsSync) so repeated dir events and
      // the synthetic TOCTOU emit below all collapse to a single delegated tail.
      dirWatcher = watch(dirname(String(filePath)), (): void => {
        if (awaitState.stopped || awaitState.inner !== null || !existsSync(filePath)) {
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
        const inner = fsWatchTailAdapter({
          filePath,
          onLine,
          onError,
          ...(startPosition === undefined ? {} : { startPosition }),
        });
        awaitState.inner = inner;
        // Forward the delegated tail's drain completion to OUR initialDrain. It only ever
        // resolves, but a bubbling catch keeps the promise handled (never silently swallowed).
        inner.initialDrain
          .then((): void => {
            resolveInitialDrainRef.current?.();
          })
          .catch((forwardError: unknown): void => {
            onError({ error: forwardError });
          });
      });
    } catch (dirWatchError: unknown) {
      onError({ error: dirWatchError });
      resolveInitialDrainRef.current?.();
      return {
        stop: (): void => {
          // No watcher was created; nothing to tear down.
        },
        initialDrain,
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
      onError({
        error: new Error(`ENOENT: file did not appear within timeout: ${String(filePath)}`),
      });
      resolveInitialDrainRef.current?.();
      if (dirWatcher !== null) {
        dirWatcher.close();
        dirWatcher = null;
      }
    }, AWAIT_CREATE_TIMEOUT_MS);
    awaitTimer.unref();

    // TOCTOU: the file may have appeared between the existsSync check above and the dir
    // watch being armed — fire the watch callback once so we don't wait on a change that
    // already happened. The callback's existsSync guard makes this a no-op if it hasn't.
    dirWatcher.emit('change', 'rename', String(filePath));

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
        resolveInitialDrainRef.current?.();
      },
      initialDrain,
    };
  }

  const initialPosition = startPosition === 'end' ? statSync(filePath).size : 0;
  const state = {
    position: initialPosition,
    reading: false,
    stopped: false,
    // Set when an inotify `change` event fires while a drain is already in flight. The
    // current drain's settle handler (close/error) re-issues a synthetic change so the
    // newly-appended bytes get read. Without this, late events are silently dropped.
    pendingDrain: false,
  };

  const watcher = watch(filePath, () => {
    if (state.stopped) {
      return;
    }
    if (state.reading) {
      // Drain in progress — record that a fresh change arrived so the current drain's
      // 'close' handler can re-trigger after it finishes. Without this, kernel-fired
      // inotify events that land while `state.reading` is true would be silently
      // dropped, masking real appends as a watcher-not-firing symptom.
      state.pendingDrain = true;
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
      resolveInitialDrainRef.current?.();
      if (state.pendingDrain && !state.stopped) {
        state.pendingDrain = false;
        watcher.emit('change', 'rename', filePath);
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
      resolveInitialDrainRef.current?.();
      if (state.pendingDrain && !state.stopped) {
        state.pendingDrain = false;
        watcher.emit('change', 'rename', filePath);
      }
    });

    stream.on('error', (streamError) => {
      state.reading = false;
      if (!state.stopped) {
        onError({ error: streamError });
      }
      resolveInitialDrainRef.current?.();
      if (state.pendingDrain && !state.stopped) {
        state.pendingDrain = false;
        watcher.emit('change', 'rename', filePath);
      }
    });
  });

  watcher.on('error', (watchError) => {
    if (!state.stopped) {
      onError({ error: watchError });
    }
    resolveInitialDrainRef.current?.();
  });

  // Trigger an immediate drain of any existing file content. `fs.watch` does not fire
  // until the file changes, so without this we'd miss all lines written before the tail
  // started. We emit a synthetic 'change' event on the watcher to reuse the same drain
  // path rather than duplicating the readline/stream setup.
  //
  // For `startPosition: 'end'`, the read stream opens at file size, immediately fires
  // 'close' with nothing to read, and resolveInitialDrain runs. For 'beginning', the
  // readline runs through the file and resolves once 'close' fires.
  watcher.emit('change', 'rename', filePath);

  return {
    stop: (): void => {
      state.stopped = true;
      watcher.close();
      // If stop() is called before the synthetic-emit drain ever finishes (e.g. a torn-
      // down adapter where the readline never closes), the initialDrain promise would
      // otherwise hang forever. Resolve it on stop so any awaiter can proceed.
      resolveInitialDrainRef.current?.();
    },
    initialDrain,
  };
};

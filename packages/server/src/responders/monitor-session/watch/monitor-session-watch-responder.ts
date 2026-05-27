/**
 * PURPOSE: Sets up an fs-watch on `<DUNGEONMASTER_HOME>/active-monitor-session.json` so the HTTP server reacts whenever the MCP server (re-)announces a /dumpster-launch parent session — starts the orchestrator's JSONL watcher on appearance, stops + restarts it on parentSessionId change, and stops it on file removal. Invalid file contents are logged but ignored
 *
 * USAGE:
 * const handle = MonitorSessionWatchResponder();
 * // handle.stop() — tears down the file watcher and the active JSONL watcher
 *
 * WHEN-TO-USE: Wire once from ServerInitResponder during HTTP server boot. The reactor
 *   lives for the lifetime of the server.
 * WHEN-NOT-TO-USE: Anywhere needing one-off file polling — this is a long-lived watcher.
 */

import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import type { ParentSessionId } from '../../../contracts/active-monitor-session/active-monitor-session-contract';

import { fsWatchFileAdapter } from '../../../adapters/fs/watch-file/fs-watch-file-adapter';
import { orchestratorStartMonitorWatcherAdapter } from '../../../adapters/orchestrator/start-monitor-watcher/orchestrator-start-monitor-watcher-adapter';
import { processDevLogAdapter } from '../../../adapters/process/dev-log/process-dev-log-adapter';
import { activeMonitorSessionContract } from '../../../contracts/active-monitor-session/active-monitor-session-contract';

export const MonitorSessionWatchResponder = (): { stop: () => void } => {
  const { homePath } = dungeonmasterHomeFindBroker();

  // Track the active watcher handle plus the parentSessionId it was started for, so
  // change events that don't shift the session can short-circuit and avoid a noisy
  // teardown/start cycle.
  const state: {
    activeStop: (() => void) | null;
    activeParentSessionId: ParentSessionId | null;
  } = { activeStop: null, activeParentSessionId: null };

  const watchHandle = fsWatchFileAdapter({
    dirPath: String(homePath),
    fileName: locationsStatics.dungeonmasterHome.activeMonitorSession,
    onChange: ({ contents }): void => {
      if (contents === null) {
        // File removed (or never existed). Stop any active watcher and clear.
        if (state.activeStop !== null) {
          state.activeStop();
          state.activeStop = null;
          state.activeParentSessionId = null;
          processDevLogAdapter({
            message: 'monitor-session-watch: file removed, watcher stopped',
          });
        }
        return;
      }

      // The writer's open(O_TRUNC) and write() are separate syscalls; inotify fires
      // IN_MODIFY on each. Reading between them yields ''. Wait for the post-write
      // event with real bytes.
      if (contents === '') return;

      const raw = ((): unknown => {
        try {
          return JSON.parse(contents) as unknown;
        } catch (parseError) {
          processDevLogAdapter({
            message: `monitor-session-watch: invalid JSON in active-monitor-session.json: ${String(parseError)}`,
          });
          return undefined;
        }
      })();
      if (raw === undefined) return;

      const parsed = activeMonitorSessionContract.safeParse(raw);
      if (!parsed.success) {
        processDevLogAdapter({
          message: `monitor-session-watch: contract rejected: ${parsed.error.message}`,
        });
        return;
      }

      const incomingParentSessionId = parsed.data.parentSessionId;
      const incomingProjectDir = String(parsed.data.projectDir);

      if (state.activeParentSessionId === incomingParentSessionId) {
        // Same session re-announced (e.g. registeredAt rewritten by an MCP restart with
        // an identical session). No-op to avoid teardown thrash.
        return;
      }

      if (state.activeStop !== null) {
        state.activeStop();
        state.activeStop = null;
        state.activeParentSessionId = null;
      }

      orchestratorStartMonitorWatcherAdapter({
        parentSessionId: String(incomingParentSessionId),
        projectDir: incomingProjectDir,
      })
        .then((handle) => {
          // Race: a new file change may have raced this promise. If the parent session
          // changed again while we awaited, the latest change's teardown already cleared
          // `state.activeStop` — stop the just-started handle so it doesn't leak.
          if (state.activeParentSessionId !== null) {
            handle.stop();
            return;
          }
          state.activeStop = handle.stop;
          state.activeParentSessionId = incomingParentSessionId;
          processDevLogAdapter({
            message: `monitor-session-watch: started watcher for session ${String(incomingParentSessionId)}`,
          });
        })
        .catch((error: unknown) => {
          const reason =
            error instanceof Error
              ? `${error.message}${error.cause ? ` | cause: ${error.cause instanceof Error ? error.cause.message : JSON.stringify(error.cause)}` : ''}`
              : String(error);
          processDevLogAdapter({
            message: `monitor-session-watch: failed to start watcher for session ${String(incomingParentSessionId)}: ${reason}`,
          });
        });
    },
    onError: ({ error }): void => {
      processDevLogAdapter({
        message: `monitor-session-watch: fs.watch error: ${String(error)}`,
      });
    },
  });

  return {
    stop: (): void => {
      watchHandle.stop();
      if (state.activeStop !== null) {
        state.activeStop();
        state.activeStop = null;
        state.activeParentSessionId = null;
      }
    },
  };
};

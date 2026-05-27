/**
 * PURPOSE: Boots the /dumpster-launch monitor-session file watcher at HTTP server startup so the orchestrator's JSONL tail starts automatically whenever the MCP server (re-)announces a parent session. No HTTP routes — this is a side-effect-only flow
 *
 * USAGE:
 * MonitorSessionFlow.bootstrap();
 * // Side effect: starts MonitorSessionWatchResponder for the server's lifetime
 *
 * WHEN-TO-USE: From StartServer once at server boot.
 * WHEN-NOT-TO-USE: From any code path that should not own the file watcher's lifecycle.
 */

import { MonitorSessionWatchResponder } from '../../responders/monitor-session/watch/monitor-session-watch-responder';

const state: { handle: { stop: () => void } | null } = { handle: null };

export const MonitorSessionFlow = {
  bootstrap: (): void => {
    if (state.handle !== null) {
      return;
    }
    state.handle = MonitorSessionWatchResponder();
  },

  teardown: (): void => {
    if (state.handle !== null) {
      state.handle.stop();
      state.handle = null;
    }
  },
};

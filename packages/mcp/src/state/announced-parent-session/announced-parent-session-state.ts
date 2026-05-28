/**
 * PURPOSE: Per-MCP-process latch tracking the parent Claude Code session this MCP child has
 * already announced to `<DUNGEONMASTER_HOME>/active-monitor-session.json`. Once set, the
 * resolve-subagent-identity layer skips re-announcing on every subsequent get-agent-prompt
 * call. Each MCP child is bound to exactly one parent session for its lifetime, so this is
 * intentionally singleton + module-scoped.
 *
 * USAGE:
 * announcedParentSessionState.get();
 * announcedParentSessionState.set({ parentSessionId });
 * announcedParentSessionState.clear();
 */

import type { SessionId } from '@dungeonmaster/shared/contracts';

const state: { parentSessionId: SessionId | null } = {
  parentSessionId: null,
};

export const announcedParentSessionState = {
  get: (): SessionId | null => state.parentSessionId,

  set: ({ parentSessionId }: { parentSessionId: SessionId }): void => {
    state.parentSessionId = parentSessionId;
  },

  clear: (): void => {
    state.parentSessionId = null;
  },
};

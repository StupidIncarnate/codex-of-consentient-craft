/**
 * PURPOSE: Flow that announces the parent Claude Code session at MCP startup by writing `<DUNGEONMASTER_HOME>/active-monitor-session.json`. Reads CLAUDE_CODE_SESSION_ID + cwd from the environment; no-op when CLAUDE_CODE_SESSION_ID is unset (MCP invoked outside Claude Code context)
 *
 * USAGE:
 * await MonitorSessionAnnounceFlow();
 * // Returns: AdapterResult — { success: true } whether the announce was written or skipped
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { MonitorSessionAnnounceResponder } from '../../responders/monitor-session/announce/monitor-session-announce-responder';

export const MonitorSessionAnnounceFlow = async (): Promise<AdapterResult> =>
  MonitorSessionAnnounceResponder();

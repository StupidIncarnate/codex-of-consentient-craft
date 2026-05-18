/**
 * PURPOSE: Responder for the MCP startup monitor-session announce. Reads CLAUDE_CODE_SESSION_ID + processCwdAdapter() (the MCP server's cwd inherited from Claude Code, which is the project directory) and delegates to monitorSessionAnnounceBroker to write `<DUNGEONMASTER_HOME>/active-monitor-session.json`
 *
 * USAGE:
 * await MonitorSessionAnnounceResponder();
 * // Returns: AdapterResult — { success: true } whether written or skipped (env unset)
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { processCwdAdapter } from '@dungeonmaster/shared/adapters';

import { monitorSessionAnnounceBroker } from '../../../brokers/monitor-session/announce/monitor-session-announce-broker';

export const MonitorSessionAnnounceResponder = async (): Promise<AdapterResult> => {
  const { homePath } = dungeonmasterHomeFindBroker();
  const cwd = processCwdAdapter();

  return monitorSessionAnnounceBroker({
    parentSessionId: process.env.CLAUDE_CODE_SESSION_ID,
    projectDir: String(cwd),
    nowIso: new Date().toISOString(),
    homeDir: String(homePath),
  });
};

/**
 * PURPOSE: Initializes the HTTP server by collecting domain route flows and delegating to ServerFlow
 *
 * USAGE:
 * StartServer();
 * // Starts HTTP server with guild, quest, process, session, directory, health endpoints and WebSocket event relay
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { DesignFlow } from '../flows/design/design-flow';
import { GuildFlow } from '../flows/guild/guild-flow';
import { QuestFlow } from '../flows/quest/quest-flow';
import { ProcessFlow } from '../flows/process/process-flow';
import { SessionFlow } from '../flows/session/session-flow';
import { DirectoryFlow } from '../flows/directory/directory-flow';
import { HealthFlow } from '../flows/health/health-flow';
import { MonitorSessionFlow } from '../flows/monitor-session/monitor-session-flow';
import { RateLimitsFlow } from '../flows/rate-limits/rate-limits-flow';
import { ServerFlow } from '../flows/server/server-flow';
import { ToolingFlow } from '../flows/tooling/tooling-flow';

export const StartServer = (): AdapterResult => {
  // Start the /dumpster-launch monitor-session file watcher BEFORE the HTTP server begins
  // listening. The MCP server may have already written `<DUNGEONMASTER_HOME>/active-monitor-session.json`
  // during its own startup; firing this watcher early ensures the JSONL tail is in place
  // before any web client connects looking for streaming chat output.
  MonitorSessionFlow.bootstrap();

  return ServerFlow({
    subApps: [
      GuildFlow(),
      QuestFlow(),
      ProcessFlow(),
      SessionFlow(),
      DirectoryFlow(),
      HealthFlow(),
      DesignFlow(),
      ToolingFlow(),
      RateLimitsFlow(),
    ],
  });
};

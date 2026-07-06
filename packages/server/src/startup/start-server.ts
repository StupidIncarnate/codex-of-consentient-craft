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
import { OrchestrationBootFlow } from '../flows/orchestration-boot/orchestration-boot-flow';
import { OrchestrationFlow } from '../flows/orchestration/orchestration-flow';
import { QuestDrivenWatchersFlow } from '../flows/quest-driven-watchers/quest-driven-watchers-flow';
import { RateLimitsFlow } from '../flows/rate-limits/rate-limits-flow';
import { ServerFlow } from '../flows/server/server-flow';
import { ToolingFlow } from '../flows/tooling/tooling-flow';

export const StartServer = ({
  serveWebBundle = false,
}: {
  serveWebBundle?: boolean;
} = {}): AdapterResult => {
  // Start the quest-driven JSONL watcher reactor BEFORE the HTTP server begins listening.
  // It tails one JSONL per distinct sessionId stamped onto an in-progress workItem across
  // all active quests, reconciling on every quest-modified outbox event. Source of truth
  // is the on-disk quest files — no global "monitor session" file is consulted.
  QuestDrivenWatchersFlow.bootstrap();

  // Normalize the Node-dispatcher state at server boot: a persisted 'node-playing' mode is
  // rewritten to 'paused' so a restarted server never auto-plays. Server-process only — MCP
  // children load StartOrchestrator too and must not run this.
  OrchestrationBootFlow.bootstrap();

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
      OrchestrationFlow(),
    ],
    serveWebBundle,
  });
};

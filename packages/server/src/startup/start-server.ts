/**
 * PURPOSE: Initializes the HTTP server by collecting domain route flows and delegating to ServerFlow
 *
 * USAGE:
 * StartServer();
 * // Starts HTTP server with guild, quest, process, session, directory, health endpoints and WebSocket event relay
 */

import { DesignFlow } from '../flows/design/design-flow';
import { GuildFlow } from '../flows/guild/guild-flow';
import { QuestFlow } from '../flows/quest/quest-flow';
import { ProcessFlow } from '../flows/process/process-flow';
import { SessionFlow } from '../flows/session/session-flow';
import { DirectoryFlow } from '../flows/directory/directory-flow';
import { HealthFlow } from '../flows/health/health-flow';
import { ServerFlow } from '../flows/server/server-flow';

export const StartServer = (): void => {
  ServerFlow({
    subApps: [
      GuildFlow(),
      QuestFlow(),
      ProcessFlow(),
      SessionFlow(),
      DirectoryFlow(),
      HealthFlow(),
      DesignFlow(),
    ],
  });
};

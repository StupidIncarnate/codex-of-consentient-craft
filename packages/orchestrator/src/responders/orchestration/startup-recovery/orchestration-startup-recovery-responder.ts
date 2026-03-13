/**
 * PURPOSE: On server start, scans for active quests and re-invokes the orchestration loop for each
 *
 * USAGE:
 * await OrchestrationStartupRecoveryResponder();
 * // Finds all quests in recoverable statuses and launches orchestration loops for any without running processes
 */

import { guildListBroker } from '../../../brokers/guild/list/guild-list-broker';

import { RecoverGuildLayerResponder } from './recover-guild-layer-responder';

export const OrchestrationStartupRecoveryResponder = async (): Promise<void> => {
  const guilds = await guildListBroker();

  const validGuilds = guilds.filter((guildItem) => guildItem.valid);

  await Promise.all(
    validGuilds.map(async (guildItem) => RecoverGuildLayerResponder({ guildItem })),
  );
};

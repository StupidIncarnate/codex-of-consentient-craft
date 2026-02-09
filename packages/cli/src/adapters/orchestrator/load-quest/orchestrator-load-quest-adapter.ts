/**
 * PURPOSE: Wraps orchestrator's questLoadBroker to provide I/O boundary for quest loading
 *
 * USAGE:
 * const quest = await orchestratorLoadQuestAdapter({questFilePath});
 * // Returns Quest from orchestrator
 */
import { questLoadBroker } from '@dungeonmaster/orchestrator';
import type { FilePath, Quest } from '@dungeonmaster/shared/contracts';

export const orchestratorLoadQuestAdapter = async ({
  questFilePath,
}: {
  questFilePath: FilePath;
}): Promise<Quest> => questLoadBroker({ questFilePath });

/**
 * PURPOSE: Wraps orchestrator's questUpdateStepBroker to provide I/O boundary for quest step updates
 *
 * USAGE:
 * await orchestratorUpdateQuestStepAdapter({questFilePath, stepId, updates});
 * // Updates step in quest file via orchestrator
 */
import { questUpdateStepBroker } from '@dungeonmaster/orchestrator';
import type { DependencyStep, FilePath, StepId } from '@dungeonmaster/shared/contracts';

export const orchestratorUpdateQuestStepAdapter = async ({
  questFilePath,
  stepId,
  updates,
}: {
  questFilePath: FilePath;
  stepId: StepId;
  updates: Partial<Omit<DependencyStep, 'id'>>;
}): Promise<void> => {
  await questUpdateStepBroker({ questFilePath, stepId, updates });
};

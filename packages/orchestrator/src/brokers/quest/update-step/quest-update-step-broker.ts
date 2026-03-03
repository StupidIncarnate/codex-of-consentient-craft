/**
 * PURPOSE: Updates a specific step in a quest file with new field values
 *
 * USAGE:
 * await questUpdateStepBroker({questFilePath, stepId, updates: {status: 'complete', completedAt: '...'}});
 * // Loads quest, updates the step, writes back to file
 */

import type { DependencyStep, FilePath, StepId } from '@dungeonmaster/shared/contracts';
import {
  dependencyStepContract,
  fileContentsContract,
  questContract,
} from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { questStatics } from '../../../statics/quest/quest-statics';
import { questPersistBroker } from '../persist/quest-persist-broker';

export const questUpdateStepBroker = async ({
  questFilePath,
  stepId,
  updates,
}: {
  questFilePath: FilePath;
  stepId: StepId;
  updates: Partial<Omit<DependencyStep, 'id'>>;
}): Promise<void> => {
  const fileContents = await fsReadFileAdapter({ filePath: questFilePath });

  const questData: unknown = JSON.parse(fileContents);
  const quest = questContract.parse(questData);

  const existingStep = quest.steps.find((s) => s.id === stepId);
  if (!existingStep) {
    throw new Error(`Step with id ${stepId} not found in quest ${quest.id}`);
  }

  const stepIndex = quest.steps.findIndex((s) => s.id === stepId);
  quest.steps[stepIndex] = dependencyStepContract.parse({
    ...existingStep,
    ...updates,
    id: existingStep.id,
  });

  const updatedContents = fileContentsContract.parse(
    JSON.stringify(quest, null, questStatics.json.indentSpaces),
  );
  await questPersistBroker({ questFilePath, contents: updatedContents, questId: quest.id });
};

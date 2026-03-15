/**
 * PURPOSE: Drives quest execution by repeatedly calling the phase resolver and dispatching to phase brokers
 *
 * USAGE:
 * await questOrchestrationLoopBroker({processId, questId, questFilePath, startPath});
 * // Loops until resolver returns 'complete', 'blocked', or 'wait-for-user'
 */

import {
  absoluteFilePathContract,
  agentTypeContract,
  executionLogEntryContract,
  type FilePath,
  type ProcessId,
  type QuestId,
} from '@dungeonmaster/shared/contracts';

import type { ChatLineEntry } from '../../../contracts/chat-line-output/chat-line-output-contract';
import { modifyQuestInputContract } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import { getQuestInputContract } from '../../../contracts/get-quest-input/get-quest-input-contract';
import { slotCountContract } from '../../../contracts/slot-count/slot-count-contract';
import type { SlotIndex } from '../../../contracts/slot-index/slot-index-contract';
import { slotCountToSlotOperationsTransformer } from '../../../transformers/slot-count-to-slot-operations/slot-count-to-slot-operations-transformer';
import { questGetBroker } from '../get/quest-get-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';
import { questPhaseResolverBroker } from '../phase-resolver/quest-phase-resolver-broker';
import { runCodeweaverLayerBroker } from './run-codeweaver-layer-broker';
import { runLawbringerLayerBroker } from './run-lawbringer-layer-broker';
import { runPathseekerLayerBroker } from './run-pathseeker-layer-broker';
import { runSiegemasterLayerBroker } from './run-siegemaster-layer-broker';
import { runWardLayerBroker } from './run-ward-layer-broker';
import { writeExecutionLogLayerBroker } from './write-execution-log-layer-broker';

const SLOT_COUNT = 3;

export const questOrchestrationLoopBroker = async ({
  processId,
  questId,
  questFilePath,
  startPath,
  onAgentEntry,
  abortSignal,
}: {
  processId: ProcessId;
  questId: QuestId;
  questFilePath: FilePath;
  startPath: FilePath;
  onAgentEntry?: (params: { slotIndex: SlotIndex; entry: ChatLineEntry['entry'] }) => void;
  abortSignal?: AbortSignal;
}): Promise<void> => {
  const slotCount = slotCountContract.parse(SLOT_COUNT);
  const slotOperations = slotCountToSlotOperationsTransformer({ slotCount });

  if (abortSignal?.aborted) {
    await writeExecutionLogLayerBroker({
      questId,
      agentType: agentTypeContract.parse('orchestration-loop'),
      status: 'fail',
      report: executionLogEntryContract.shape.report.parse('Aborted by signal'),
    });
    return;
  }

  const input = getQuestInputContract.parse({ questId });
  const result = await questGetBroker({ input });

  if (!result.success || !result.quest) {
    throw new Error(`Quest not found: ${questId}`);
  }

  const resolution = questPhaseResolverBroker({ quest: result.quest });

  if (resolution.action === 'wait-for-user') {
    return;
  }

  if (resolution.action === 'complete') {
    const modifyInput = modifyQuestInputContract.parse({ questId, status: 'complete' });
    await questModifyBroker({ input: modifyInput });
    return;
  }

  if (resolution.action === 'blocked') {
    const modifyInput = modifyQuestInputContract.parse({ questId, status: 'blocked' });
    await questModifyBroker({ input: modifyInput });
    return;
  }

  // launch-chat and resume-chat: The orchestration loop does NOT launch interactive chat sessions
  // itself. Chat sessions are long-lived and user-driven (user sends messages, agent responds).
  // The resolver returns these actions to INFORM the caller what should happen. The actual chat
  // launch is handled by the existing chat-start-responder flow. The loop exits so the caller
  // can act on the resolution.
  if (resolution.action === 'launch-chat' || resolution.action === 'resume-chat') {
    return;
  }

  // halt: User requested stop. Write a system-level execution log entry and exit.
  if (resolution.action === 'halt') {
    await writeExecutionLogLayerBroker({
      questId,
      agentType: agentTypeContract.parse('system'),
      status: 'fail',
      report: executionLogEntryContract.shape.report.parse('user-halt'),
    });
    return;
  }

  try {
    if (resolution.action === 'launch-pathseeker' || resolution.action === 'resume-pathseeker') {
      await writeExecutionLogLayerBroker({
        questId,
        agentType: agentTypeContract.parse('pathseeker'),
        status: 'start',
        report: executionLogEntryContract.shape.report.parse('pathseeker-phase'),
      });

      try {
        await runPathseekerLayerBroker({
          questId,
          startPath,
          ...(resolution.resumeSessionId === undefined
            ? {}
            : { resumeSessionId: resolution.resumeSessionId }),
          ...(onAgentEntry === undefined ? {} : { onAgentEntry }),
        });

        await writeExecutionLogLayerBroker({
          questId,
          agentType: agentTypeContract.parse('pathseeker'),
          status: 'pass',
          report: executionLogEntryContract.shape.report.parse('pathseeker-phase'),
        });
      } catch (pathseekerError: unknown) {
        await writeExecutionLogLayerBroker({
          questId,
          agentType: agentTypeContract.parse('pathseeker'),
          status: 'fail',
          report: executionLogEntryContract.shape.report.parse('pathseeker-phase-failed'),
        });
        throw pathseekerError;
      }
    }

    if (resolution.action === 'launch-codeweaver' || resolution.action === 'resume-codeweaver') {
      if (resolution.resetStepIds && resolution.resetStepIds.length > 0) {
        const steps = resolution.resetStepIds.map((stepId) => ({
          id: stepId,
          status: 'pending' as const,
        }));
        const modifyInput = modifyQuestInputContract.parse({ questId, steps });
        await questModifyBroker({ input: modifyInput });
      }

      try {
        await runCodeweaverLayerBroker({
          questId,
          questFilePath,
          startPath,
          slotCount,
          slotOperations,
          ...(onAgentEntry === undefined ? {} : { onAgentEntry }),
        });

        await writeExecutionLogLayerBroker({
          questId,
          agentType: agentTypeContract.parse('codeweaver'),
          status: 'pass',
          report: executionLogEntryContract.shape.report.parse('codeweaver-phase'),
        });
      } catch (codeweaverError: unknown) {
        await writeExecutionLogLayerBroker({
          questId,
          agentType: agentTypeContract.parse('codeweaver'),
          status: 'fail',
          report: executionLogEntryContract.shape.report.parse('codeweaver-phase-failed'),
        });
        throw codeweaverError;
      }
    }

    if (resolution.action === 'launch-ward') {
      try {
        const absoluteStartPath = absoluteFilePathContract.parse(startPath);
        await runWardLayerBroker({
          questFilePath,
          startPath: absoluteStartPath,
          slotCount,
          slotOperations,
        });
        await writeExecutionLogLayerBroker({
          questId,
          agentType: agentTypeContract.parse('ward'),
          status: 'pass',
          report: executionLogEntryContract.shape.report.parse('ward-phase'),
        });
      } catch (wardError: unknown) {
        await writeExecutionLogLayerBroker({
          questId,
          agentType: agentTypeContract.parse('ward'),
          status: 'fail',
          report: executionLogEntryContract.shape.report.parse('ward-phase-failed'),
        });
        throw wardError;
      }
    }

    if (resolution.action === 'launch-siegemaster') {
      try {
        const siegeResult = await runSiegemasterLayerBroker({
          questId,
          questFilePath,
          startPath,
          slotCount,
          slotOperations,
        });
        await writeExecutionLogLayerBroker({
          questId,
          agentType: agentTypeContract.parse('siegemaster'),
          status: siegeResult.failedObservableIds.length === 0 ? 'pass' : 'fail',
          report: executionLogEntryContract.shape.report.parse('siegemaster-phase'),
          ...(siegeResult.failedObservableIds.length === 0
            ? {}
            : { failedObservableIds: siegeResult.failedObservableIds }),
        });
      } catch (siegemasterError: unknown) {
        await writeExecutionLogLayerBroker({
          questId,
          agentType: agentTypeContract.parse('siegemaster'),
          status: 'fail',
          report: executionLogEntryContract.shape.report.parse('siegemaster-phase-failed'),
        });
        throw siegemasterError;
      }
    }

    if (resolution.action === 'launch-lawbringer') {
      try {
        await runLawbringerLayerBroker({ questFilePath, startPath, slotCount, slotOperations });
        await writeExecutionLogLayerBroker({
          questId,
          agentType: agentTypeContract.parse('lawbringer'),
          status: 'pass',
          report: executionLogEntryContract.shape.report.parse('lawbringer-phase'),
        });
      } catch (lawbringerError: unknown) {
        await writeExecutionLogLayerBroker({
          questId,
          agentType: agentTypeContract.parse('lawbringer'),
          status: 'fail',
          report: executionLogEntryContract.shape.report.parse('lawbringer-phase-failed'),
        });
        throw lawbringerError;
      }
    }
  } catch (error: unknown) {
    await writeExecutionLogLayerBroker({
      questId,
      agentType: agentTypeContract.parse('orchestration-loop'),
      status: 'fail',
      report: executionLogEntryContract.shape.report.parse(
        error instanceof Error ? error.message : 'Unknown error',
      ),
    });
    throw error;
  }

  return questOrchestrationLoopBroker({
    processId,
    questId,
    questFilePath,
    startPath,
    ...(onAgentEntry === undefined ? {} : { onAgentEntry }),
    ...(abortSignal === undefined ? {} : { abortSignal }),
  });
};

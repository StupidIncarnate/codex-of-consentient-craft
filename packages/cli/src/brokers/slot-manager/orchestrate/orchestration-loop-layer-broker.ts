/**
 * PURPOSE: Executes a single iteration of the orchestration loop
 *
 * USAGE:
 * const result = await orchestrationLoopLayerBroker({questFilePath, slotCount, timeoutMs, slotOperations, activeAgents});
 * // Returns { done: true, result } when complete, or { done: false, activeAgents } to continue
 */

import type { FilePath } from '@dungeonmaster/shared/contracts';

import type { ActiveAgent } from '../../../contracts/active-agent/active-agent-contract';
import { isoTimestampContract } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import { promptTextContract } from '../../../contracts/prompt-text/prompt-text-contract';
import type { SlotCount } from '../../../contracts/slot-count/slot-count-contract';
import type { SlotManagerResult } from '../../../contracts/slot-manager-result/slot-manager-result-contract';
import type { SlotOperations } from '../../../contracts/slot-operations/slot-operations-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { isStepReadyGuard } from '../../../guards/is-step-ready/is-step-ready-guard';
import { questLoadBroker } from '../../quest/load/quest-load-broker';
import { questUpdateStepBroker } from '../../quest/update-step/quest-update-step-broker';
import { handleSignalLayerBroker } from './handle-signal-layer-broker';
import { spawnAgentLayerBroker } from './spawn-agent-layer-broker';

type LoopResult =
  | { done: true; result: SlotManagerResult }
  | { done: false; activeAgents: ActiveAgent[] };

export const orchestrationLoopLayerBroker = async ({
  questFilePath,
  slotCount,
  timeoutMs,
  slotOperations,
  activeAgents,
}: {
  questFilePath: FilePath;
  slotCount: SlotCount;
  timeoutMs: TimeoutMs;
  slotOperations: SlotOperations;
  activeAgents: ActiveAgent[];
}): Promise<LoopResult> => {
  const quest = await questLoadBroker({ questFilePath });

  const allComplete = quest.steps.every((step) => step.status === 'complete');
  if (allComplete && activeAgents.length === 0) {
    return { done: true, result: { completed: true } };
  }

  const readySteps = quest.steps.filter((step) =>
    isStepReadyGuard({ step, allSteps: quest.steps }),
  );

  const availableSlotIndex = slotOperations.getAvailableSlot({ slotCount });
  if (availableSlotIndex !== undefined && readySteps.length > 0) {
    const [stepToRun] = readySteps;
    if (stepToRun) {
      const now = isoTimestampContract.parse(new Date().toISOString());

      await questUpdateStepBroker({
        questFilePath,
        stepId: stepToRun.id,
        updates: {
          status: 'in_progress',
          startedAt: now,
        },
      });

      const prompt = promptTextContract.parse(
        `Execute step: ${stepToRun.name}\nDescription: ${stepToRun.description}`,
      );

      const agentPromise = spawnAgentLayerBroker({
        prompt,
        stepId: stepToRun.id,
        timeoutMs,
      });

      activeAgents.push({
        slotIndex: availableSlotIndex,
        stepId: stepToRun.id,
        sessionId: null,
        promise: agentPromise,
      });
    }
  }

  if (activeAgents.length === 0) {
    return { done: true, result: { completed: true } };
  }

  const raceResult = await Promise.race(
    activeAgents.map(async (agent) => ({
      agent,
      result: await agent.promise,
    })),
  );

  const { agent: completedAgent, result } = raceResult;

  const agentIndex = activeAgents.findIndex((a) => a.slotIndex === completedAgent.slotIndex);
  activeAgents.splice(agentIndex, 1);

  slotOperations.releaseSlot({ slotIndex: completedAgent.slotIndex });

  if (result.crashed || result.timedOut) {
    const quest2 = await questLoadBroker({ questFilePath });
    const step = quest2.steps.find((s) => s.id === completedAgent.stepId);
    if (step) {
      const prompt = promptTextContract.parse(
        `Execute step: ${step.name}\nDescription: ${step.description}`,
      );

      const newSlotIndex = slotOperations.getAvailableSlot({ slotCount });
      if (newSlotIndex !== undefined) {
        const agentPromise = spawnAgentLayerBroker({
          prompt,
          stepId: completedAgent.stepId,
          timeoutMs,
          ...(result.sessionId === null ? {} : { resumeSessionId: result.sessionId }),
        });

        activeAgents.push({
          slotIndex: newSlotIndex,
          stepId: completedAgent.stepId,
          sessionId: result.sessionId,
          promise: agentPromise,
        });
      }
    }
    return { done: false, activeAgents };
  }

  if (result.signal === null) {
    const now = isoTimestampContract.parse(new Date().toISOString());
    await questUpdateStepBroker({
      questFilePath,
      stepId: completedAgent.stepId,
      updates: {
        status: 'complete',
        completedAt: now,
      },
    });
    return { done: false, activeAgents };
  }

  const signalResult = await handleSignalLayerBroker({
    signal: result.signal,
    stepId: completedAgent.stepId,
    questFilePath,
  });

  switch (signalResult.action) {
    case 'continue': {
      return { done: false, activeAgents };
    }

    case 'return': {
      return { done: true, result: signalResult.result };
    }

    case 'respawn': {
      const quest3 = await questLoadBroker({ questFilePath });
      const step = quest3.steps.find((s) => s.id === completedAgent.stepId);
      if (step) {
        const prompt = promptTextContract.parse(
          `Continue step: ${step.name}\nContinuation point: ${signalResult.continuationPoint ?? 'Resume from last progress'}`,
        );

        const newSlotIndex = slotOperations.getAvailableSlot({ slotCount });
        if (newSlotIndex !== undefined) {
          const agentPromise = spawnAgentLayerBroker({
            prompt,
            stepId: completedAgent.stepId,
            timeoutMs,
            ...(result.sessionId === null ? {} : { resumeSessionId: result.sessionId }),
          });

          activeAgents.push({
            slotIndex: newSlotIndex,
            stepId: completedAgent.stepId,
            sessionId: result.sessionId,
            promise: agentPromise,
          });
        }
      }
      return { done: false, activeAgents };
    }

    case 'spawn_role': {
      const prompt = promptTextContract.parse(
        `Role followup requested by step ${completedAgent.stepId}\nTarget role: ${signalResult.targetRole}\nReason: ${signalResult.reason ?? 'Not specified'}\nContext: ${signalResult.context ?? 'None'}`,
      );

      const newSlotIndex = slotOperations.getAvailableSlot({ slotCount });
      if (newSlotIndex !== undefined) {
        const agentPromise = spawnAgentLayerBroker({
          prompt,
          stepId: completedAgent.stepId,
          timeoutMs,
        });

        activeAgents.push({
          slotIndex: newSlotIndex,
          stepId: completedAgent.stepId,
          sessionId: null,
          promise: agentPromise,
        });
      }
      return { done: false, activeAgents };
    }

    default: {
      const exhaustiveCheck: never = signalResult;
      throw new Error(`Unhandled signal action: ${String(exhaustiveCheck)}`);
    }
  }
};

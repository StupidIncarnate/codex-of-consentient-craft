/**
 * PURPOSE: Manages state for tracking running orchestration processes by processId
 *
 * USAGE:
 * orchestrationProcessesState.register({orchestrationProcess});
 * orchestrationProcessesState.get({processId});
 * // Tracks which orchestration processes are running and their status
 */

import type { ProcessId, OrchestrationStatus } from '@dungeonmaster/shared/contracts';
import {
  orchestrationStatusContract,
  orchestrationSlotContract,
} from '@dungeonmaster/shared/contracts';

import type { CompletedCount } from '../../contracts/completed-count/completed-count-contract';
import type { KillableProcess } from '../../contracts/killable-process/killable-process-contract';
import type { OrchestrationPhase } from '../../contracts/orchestration-phase/orchestration-phase-contract';
import type { OrchestrationProcess } from '../../contracts/orchestration-process/orchestration-process-contract';
import type { OrchestrationSlotData } from '../../contracts/orchestration-slot-data/orchestration-slot-data-contract';
import type { SlotIndex } from '../../contracts/slot-index/slot-index-contract';
import type { StepName } from '../../contracts/step-name/step-name-contract';

const state = {
  processes: new Map<ProcessId, OrchestrationProcess>(),
};

export const orchestrationProcessesState = {
  register: ({ orchestrationProcess }: { orchestrationProcess: OrchestrationProcess }): void => {
    state.processes.set(orchestrationProcess.processId, orchestrationProcess);
  },

  get: ({ processId }: { processId: ProcessId }): OrchestrationProcess | undefined =>
    state.processes.get(processId),

  getProcess: ({ processId }: { processId: ProcessId }): KillableProcess | undefined => {
    const orchestrationProcess = state.processes.get(processId);
    return orchestrationProcess?.process;
  },

  updatePhase: ({
    processId,
    phase,
  }: {
    processId: ProcessId;
    phase: OrchestrationPhase;
  }): void => {
    const orchestrationProcess = state.processes.get(processId);
    if (orchestrationProcess) {
      orchestrationProcess.phase = phase;
    }
  },

  updateProgress: ({
    processId,
    completedSteps,
    currentStep,
  }: {
    processId: ProcessId;
    completedSteps: CompletedCount;
    currentStep?: StepName;
  }): void => {
    const orchestrationProcess = state.processes.get(processId);
    if (orchestrationProcess) {
      orchestrationProcess.completedSteps = completedSteps;
      orchestrationProcess.currentStep = currentStep;
    }
  },

  updateSlot: ({
    processId,
    slotData,
  }: {
    processId: ProcessId;
    slotData: OrchestrationSlotData;
  }): void => {
    const orchestrationProcess = state.processes.get(processId);
    if (orchestrationProcess) {
      const existingIndex = orchestrationProcess.slots.findIndex(
        (s) => s.slotIndex === slotData.slotIndex,
      );
      if (existingIndex >= 0) {
        orchestrationProcess.slots[existingIndex] = slotData;
      } else {
        orchestrationProcess.slots.push(slotData);
      }
    }
  },

  removeSlot: ({ processId, slotIndex }: { processId: ProcessId; slotIndex: SlotIndex }): void => {
    const orchestrationProcess = state.processes.get(processId);
    if (orchestrationProcess) {
      orchestrationProcess.slots = orchestrationProcess.slots.filter(
        (s) => s.slotIndex !== slotIndex,
      );
    }
  },

  getStatus: ({ processId }: { processId: ProcessId }): OrchestrationStatus | undefined => {
    const orchestrationProcess = state.processes.get(processId);
    if (!orchestrationProcess) {
      return undefined;
    }

    const slots = orchestrationProcess.slots.map((slot) =>
      orchestrationSlotContract.parse({
        slotId: slot.slotIndex,
        step: slot.stepName,
        status: slot.status,
      }),
    );

    return orchestrationStatusContract.parse({
      processId: orchestrationProcess.processId,
      questId: orchestrationProcess.questId,
      phase: orchestrationProcess.phase,
      completed: orchestrationProcess.completedSteps,
      total: orchestrationProcess.totalSteps,
      currentStep: orchestrationProcess.currentStep,
      slots,
    });
  },

  remove: ({ processId }: { processId: ProcessId }): boolean => state.processes.delete(processId),

  clear: (): void => {
    state.processes.clear();
  },

  getAll: (): ProcessId[] => Array.from(state.processes.keys()),
} as const;

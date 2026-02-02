/**
 * PURPOSE: Routes agent spawn requests to the correct spawn-streaming broker based on role
 *
 * USAGE:
 * const result = await agentSpawnByRoleBroker({
 *   workUnit: { role: 'codeweaver', step: DependencyStepStub() },
 *   timeoutMs: TimeoutMsStub({ value: 60000 }),
 * });
 * // Returns { sessionId, exitCode, signal, crashed, timedOut }
 */

import type { SessionId } from '@dungeonmaster/shared/contracts';

import { pathseekerSpawnStreamingBroker } from '../../pathseeker/spawn-streaming/pathseeker-spawn-streaming-broker';
import { agentSpawnStreamingBroker } from '../spawn-streaming/agent-spawn-streaming-broker';
import type { AgentSpawnStreamingResult } from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result-contract';
import { promptTextContract } from '../../../contracts/prompt-text/prompt-text-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import type { WorkUnit } from '../../../contracts/work-unit/work-unit-contract';
import {
  codeweaverPromptStatics,
  lawbringerPromptStatics,
  siegemasterPromptStatics,
  spiritmenderPromptStatics,
} from '@dungeonmaster/orchestrator';
import { questStatics } from '../../../statics/quest/quest-statics';

export const agentSpawnByRoleBroker = async ({
  workUnit,
  timeoutMs,
  resumeSessionId,
}: {
  workUnit: WorkUnit;
  timeoutMs: TimeoutMs;
  resumeSessionId?: SessionId;
}): Promise<AgentSpawnStreamingResult> => {
  switch (workUnit.role) {
    case 'pathseeker': {
      const spawnArgs = resumeSessionId
        ? { questId: workUnit.questId, resumeSessionId, timeoutMs }
        : { questId: workUnit.questId, timeoutMs };
      return pathseekerSpawnStreamingBroker(spawnArgs);
    }

    case 'codeweaver': {
      // Format step context as JSON for the prompt
      const stepContext = JSON.stringify(workUnit.step, null, questStatics.json.indentSpaces);
      const promptText = codeweaverPromptStatics.prompt.template.replace(
        codeweaverPromptStatics.prompt.placeholders.arguments,
        stepContext,
      );
      const prompt = promptTextContract.parse(promptText);
      const spawnArgs = resumeSessionId
        ? { prompt, stepId: workUnit.step.id, resumeSessionId, timeoutMs }
        : { prompt, stepId: workUnit.step.id, timeoutMs };
      return agentSpawnStreamingBroker(spawnArgs);
    }

    case 'spiritmender': {
      // Format the work unit as error context
      const errorContext = `File: ${workUnit.file.filePath}\nErrors:\n${workUnit.file.errors.map((e) => `- ${e}`).join('\n')}`;
      const promptText = spiritmenderPromptStatics.prompt.template.replace(
        spiritmenderPromptStatics.prompt.placeholders.arguments,
        errorContext,
      );
      const prompt = promptTextContract.parse(promptText);
      const spawnArgs = resumeSessionId
        ? { prompt, stepId: workUnit.stepId, resumeSessionId, timeoutMs }
        : { prompt, stepId: workUnit.stepId, timeoutMs };
      return agentSpawnStreamingBroker(spawnArgs);
    }

    case 'lawbringer': {
      // Build review context from file pair
      const reviewContext = `Implementation file: ${workUnit.filePair.implPath}\nTest file: ${workUnit.filePair.testPath}`;
      const promptText = lawbringerPromptStatics.prompt.template.replace(
        lawbringerPromptStatics.prompt.placeholders.arguments,
        reviewContext,
      );
      const prompt = promptTextContract.parse(promptText);
      const spawnArgs = resumeSessionId
        ? { prompt, stepId: workUnit.stepId, resumeSessionId, timeoutMs }
        : { prompt, stepId: workUnit.stepId, timeoutMs };
      return agentSpawnStreamingBroker(spawnArgs);
    }

    case 'siegemaster': {
      // Replace placeholder with quest ID
      const promptText = siegemasterPromptStatics.prompt.template.replace(
        siegemasterPromptStatics.prompt.placeholders.arguments,
        `Quest ID: ${workUnit.questId}`,
      );
      const prompt = promptTextContract.parse(promptText);
      const spawnArgs = resumeSessionId
        ? { prompt, stepId: workUnit.stepId, resumeSessionId, timeoutMs }
        : { prompt, stepId: workUnit.stepId, timeoutMs };
      return agentSpawnStreamingBroker(spawnArgs);
    }

    default: {
      // TypeScript exhaustiveness check - this should never be reached
      const exhaustiveCheck: never = workUnit;
      throw new Error(`Unknown role: ${JSON.stringify(exhaustiveCheck)}`);
    }
  }
};

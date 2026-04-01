/**
 * PURPOSE: Adapter for StartOrchestrator.clarifyAnswer that wraps the orchestrator package
 *
 * USAGE:
 * const { chatProcessId } = await orchestratorClarifyAdapter({ guildId, sessionId, questId, answers, questions });
 * // Returns: { chatProcessId: ProcessId } or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { ProcessId } from '@dungeonmaster/shared/contracts';

type ClarifyParams = Parameters<typeof StartOrchestrator.clarifyAnswer>[0];

export const orchestratorClarifyAdapter = async ({
  guildId,
  sessionId,
  questId,
  answers,
  questions,
}: ClarifyParams): Promise<{ chatProcessId: ProcessId }> =>
  StartOrchestrator.clarifyAnswer({ guildId, sessionId, questId, answers, questions });

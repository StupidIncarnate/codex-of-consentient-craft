/**
 * PURPOSE: Adapter for StartOrchestrator.getAgentPrompt that wraps the orchestrator package
 *
 * USAGE:
 * const result = orchestratorGetAgentPromptAdapter({ agent: 'chaoswhisperer-gap-minion' });
 * // Returns: AgentPromptResult { name, model, prompt }
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { AgentPromptResult } from '@dungeonmaster/orchestrator';

export const orchestratorGetAgentPromptAdapter = ({
  agent,
}: {
  agent: string;
}): AgentPromptResult => StartOrchestrator.getAgentPrompt({ agent });

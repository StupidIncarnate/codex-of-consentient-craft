/**
 * PURPOSE: Integration test verifying AgentPromptFlow resolves agent names to prompt data
 *
 * USAGE:
 * npm run ward -- --only integration -- packages/orchestrator/src/flows/agent-prompt/agent-prompt-flow.integration.test.ts
 */

import { gapReviewerAgentPromptStatics } from '../../statics/gap-reviewer-agent-prompt/gap-reviewer-agent-prompt-statics';
import { finalizerQuestAgentPromptStatics } from '../../statics/finalizer-quest-agent-prompt/finalizer-quest-agent-prompt-statics';
import { plannerMinionQuestAgentPromptStatics } from '../../statics/planner-minion-quest-agent-prompt/planner-minion-quest-agent-prompt-statics';

import { AgentPromptFlow } from './agent-prompt-flow';

describe('AgentPromptFlow', () => {
  describe('valid agent names', () => {
    it('VALID: {agent: quest-gap-reviewer} => returns prompt result with name, model, and prompt', () => {
      const result = AgentPromptFlow.get({ agent: 'quest-gap-reviewer' });

      expect(result).toStrictEqual({
        name: 'quest-gap-reviewer',
        model: 'sonnet',
        prompt: gapReviewerAgentPromptStatics.prompt.template,
      });
    });

    it('VALID: {agent: finalizer-quest-agent} => returns prompt result with name, model, and prompt', () => {
      const result = AgentPromptFlow.get({ agent: 'finalizer-quest-agent' });

      expect(result).toStrictEqual({
        name: 'finalizer-quest-agent',
        model: 'sonnet',
        prompt: finalizerQuestAgentPromptStatics.prompt.template,
      });
    });

    it('VALID: {agent: planner-minion-quest-agent} => returns prompt result with name, model, and prompt', () => {
      const result = AgentPromptFlow.get({ agent: 'planner-minion-quest-agent' });

      expect(result).toStrictEqual({
        name: 'planner-minion-quest-agent',
        model: 'sonnet',
        prompt: plannerMinionQuestAgentPromptStatics.prompt.template,
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {agent: invalid name} => throws ZodError for unrecognized agent', () => {
      expect(() => AgentPromptFlow.get({ agent: 'non-existent-agent' })).toThrow(
        /Invalid enum value/u,
      );
    });
  });
});

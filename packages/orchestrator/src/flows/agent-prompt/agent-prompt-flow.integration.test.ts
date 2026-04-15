/**
 * PURPOSE: Integration test verifying AgentPromptFlow resolves agent names to prompt data
 *
 * USAGE:
 * npm run ward -- --only integration -- packages/orchestrator/src/flows/agent-prompt/agent-prompt-flow.integration.test.ts
 */

import { chaoswhispererGapMinionStatics } from '../../statics/chaoswhisperer-gap-minion/chaoswhisperer-gap-minion-statics';
import { pathseekerQuestReviewMinionStatics } from '../../statics/pathseeker-quest-review-minion/pathseeker-quest-review-minion-statics';
import { pathseekerSurfaceScopeMinionStatics } from '../../statics/pathseeker-surface-scope-minion/pathseeker-surface-scope-minion-statics';

import { AgentPromptFlow } from './agent-prompt-flow';

describe('AgentPromptFlow', () => {
  describe('valid agent names', () => {
    it('VALID: {agent: chaoswhisperer-gap-minion} => returns prompt result with name, model, and prompt', () => {
      const result = AgentPromptFlow.get({ agent: 'chaoswhisperer-gap-minion' });

      expect(result).toStrictEqual({
        name: 'chaoswhisperer-gap-minion',
        model: 'sonnet',
        prompt: chaoswhispererGapMinionStatics.prompt.template,
      });
    });

    it('VALID: {agent: pathseeker-quest-review-minion} => returns prompt result with name, model, and prompt', () => {
      const result = AgentPromptFlow.get({ agent: 'pathseeker-quest-review-minion' });

      expect(result).toStrictEqual({
        name: 'pathseeker-quest-review-minion',
        model: 'sonnet',
        prompt: pathseekerQuestReviewMinionStatics.prompt.template,
      });
    });

    it('VALID: {agent: pathseeker-surface-scope-minion} => returns prompt result with name, model, and prompt', () => {
      const result = AgentPromptFlow.get({ agent: 'pathseeker-surface-scope-minion' });

      expect(result).toStrictEqual({
        name: 'pathseeker-surface-scope-minion',
        model: 'sonnet',
        prompt: pathseekerSurfaceScopeMinionStatics.prompt.template,
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

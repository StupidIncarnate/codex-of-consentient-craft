/**
 * PURPOSE: Integration test verifying AgentPromptFlow resolves agent names to prompt data
 *
 * USAGE:
 * npm run ward -- --only integration -- packages/orchestrator/src/flows/agent-prompt/agent-prompt-flow.integration.test.ts
 */

import { chaoswhispererGapMinionStatics } from '../../statics/chaoswhisperer-gap-minion/chaoswhisperer-gap-minion-statics';
import { pathseekerAssertionCorrectnessMinionStatics } from '../../statics/pathseeker-assertion-correctness-minion/pathseeker-assertion-correctness-minion-statics';
import { pathseekerContractDedupMinionStatics } from '../../statics/pathseeker-contract-dedup-minion/pathseeker-contract-dedup-minion-statics';
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

    it('VALID: {agent: pathseeker-surface-scope-minion} => returns prompt result with name, model, and prompt', () => {
      const result = AgentPromptFlow.get({ agent: 'pathseeker-surface-scope-minion' });

      expect(result).toStrictEqual({
        name: 'pathseeker-surface-scope-minion',
        model: 'sonnet',
        prompt: pathseekerSurfaceScopeMinionStatics.prompt.template,
      });
    });

    it('VALID: {agent: pathseeker-contract-dedup-minion} => returns prompt result with name, model, and prompt', () => {
      const result = AgentPromptFlow.get({ agent: 'pathseeker-contract-dedup-minion' });

      expect(result).toStrictEqual({
        name: 'pathseeker-contract-dedup-minion',
        model: 'sonnet',
        prompt: pathseekerContractDedupMinionStatics.prompt.template,
      });
    });

    it('VALID: {agent: pathseeker-assertion-correctness-minion} => returns prompt result with name, model, and prompt', () => {
      const result = AgentPromptFlow.get({ agent: 'pathseeker-assertion-correctness-minion' });

      expect(result).toStrictEqual({
        name: 'pathseeker-assertion-correctness-minion',
        model: 'sonnet',
        prompt: pathseekerAssertionCorrectnessMinionStatics.prompt.template,
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

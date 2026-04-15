import { agentPromptResultContract } from './agent-prompt-result-contract';
import { AgentPromptResultStub } from './agent-prompt-result.stub';

describe('agentPromptResultContract', () => {
  describe('valid results', () => {
    it('VALID: {name, model, prompt} => parses successfully', () => {
      const result = AgentPromptResultStub();

      const parsed = agentPromptResultContract.parse(result);

      expect(parsed).toStrictEqual({
        name: 'chaoswhisperer-gap-minion',
        model: 'sonnet',
        prompt: 'You are a Staff Engineer specializing in quest validation.',
      });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {missing name} => throws validation error', () => {
      expect(() => {
        return agentPromptResultContract.parse({
          model: 'sonnet',
          prompt: 'Some prompt',
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: {empty name} => throws validation error', () => {
      expect(() => {
        return agentPromptResultContract.parse({
          name: '',
          model: 'sonnet',
          prompt: 'Some prompt',
        });
      }).toThrow(/too_small/u);
    });
  });
});

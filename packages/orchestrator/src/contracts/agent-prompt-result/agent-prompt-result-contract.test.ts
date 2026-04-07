import { agentPromptResultContract } from './agent-prompt-result-contract';
import { AgentPromptResultStub } from './agent-prompt-result.stub';

describe('agentPromptResultContract', () => {
  it('VALID: {name, model, prompt} => parses successfully', () => {
    const input = AgentPromptResultStub({
      name: 'quest-gap-reviewer',
      model: 'sonnet',
      prompt: 'You are a reviewer.',
    });

    const result = agentPromptResultContract.parse(input);

    expect(result).toStrictEqual({
      name: 'quest-gap-reviewer',
      model: 'sonnet',
      prompt: 'You are a reviewer.',
    });
  });

  it('VALID: {default stub} => parses with defaults', () => {
    const input = AgentPromptResultStub();

    const result = agentPromptResultContract.parse(input);

    expect(result).toStrictEqual({
      name: 'quest-gap-reviewer',
      model: 'sonnet',
      prompt: 'You are a Staff Engineer specializing in quest validation.',
    });
  });

  it('INVALID: {name: ""} => throws validation error', () => {
    expect(() => {
      agentPromptResultContract.parse({
        name: '',
        model: 'sonnet',
        prompt: 'Some prompt',
      });
    }).toThrow(/too_small/u);
  });

  it('INVALID: {prompt: ""} => throws validation error', () => {
    expect(() => {
      agentPromptResultContract.parse({
        name: 'test',
        model: 'sonnet',
        prompt: '',
      });
    }).toThrow(/too_small/u);
  });

  it('INVALID: {missing name} => throws validation error', () => {
    expect(() => {
      agentPromptResultContract.parse({
        model: 'sonnet',
        prompt: 'Some prompt',
      });
    }).toThrow(/Required/u);
  });
});

import { getAgentPromptInputContract } from './get-agent-prompt-input-contract';
import { GetAgentPromptInputStub } from './get-agent-prompt-input.stub';

describe('getAgentPromptInputContract', () => {
  it('VALID: {agent: "quest-gap-reviewer"} => parses successfully', () => {
    const input = GetAgentPromptInputStub({ agent: 'quest-gap-reviewer' });

    const result = getAgentPromptInputContract.parse(input);

    expect(result).toStrictEqual({ agent: 'quest-gap-reviewer' });
  });

  it('VALID: {agent: "finalizer-quest-agent"} => parses successfully', () => {
    const input = GetAgentPromptInputStub({ agent: 'finalizer-quest-agent' });

    const result = getAgentPromptInputContract.parse(input);

    expect(result).toStrictEqual({ agent: 'finalizer-quest-agent' });
  });

  it('VALID: {default stub} => parses with default', () => {
    const input = GetAgentPromptInputStub();

    const result = getAgentPromptInputContract.parse(input);

    expect(result).toStrictEqual({ agent: 'quest-gap-reviewer' });
  });

  it('INVALID: {agent: ""} => throws validation error', () => {
    expect(() => {
      getAgentPromptInputContract.parse({ agent: '' });
    }).toThrow(/too_small/u);
  });

  it('INVALID: {missing agent} => throws validation error', () => {
    expect(() => {
      getAgentPromptInputContract.parse({});
    }).toThrow(/Required/u);
  });
});

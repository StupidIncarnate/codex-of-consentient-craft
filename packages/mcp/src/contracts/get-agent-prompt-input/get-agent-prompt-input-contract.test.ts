import { getAgentPromptInputContract } from './get-agent-prompt-input-contract';
import { GetAgentPromptInputStub } from './get-agent-prompt-input.stub';

describe('getAgentPromptInputContract', () => {
  it('VALID: {agent: "chaoswhisperer-gap-minion"} => parses successfully', () => {
    const input = GetAgentPromptInputStub({ agent: 'chaoswhisperer-gap-minion' });

    const result = getAgentPromptInputContract.parse(input);

    expect(result).toStrictEqual({ agent: 'chaoswhisperer-gap-minion' });
  });

  it('VALID: {agent: "pathseeker-quest-review-minion"} => parses successfully', () => {
    const input = GetAgentPromptInputStub({ agent: 'pathseeker-quest-review-minion' });

    const result = getAgentPromptInputContract.parse(input);

    expect(result).toStrictEqual({ agent: 'pathseeker-quest-review-minion' });
  });

  it('VALID: {default stub} => parses with default', () => {
    const input = GetAgentPromptInputStub();

    const result = getAgentPromptInputContract.parse(input);

    expect(result).toStrictEqual({ agent: 'chaoswhisperer-gap-minion' });
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

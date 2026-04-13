import { agentPromptNameContract } from './agent-prompt-name-contract';
import { AgentPromptNameStub } from './agent-prompt-name.stub';

describe('agentPromptNameContract', () => {
  it('VALID: {value: "quest-gap-reviewer"} => parses successfully', () => {
    const name = AgentPromptNameStub({ value: 'quest-gap-reviewer' });

    const result = agentPromptNameContract.parse(name);

    expect(result).toBe('quest-gap-reviewer');
  });

  it('VALID: {value: "finalizer-quest-agent"} => parses successfully', () => {
    const name = AgentPromptNameStub({ value: 'finalizer-quest-agent' });

    const result = agentPromptNameContract.parse(name);

    expect(result).toBe('finalizer-quest-agent');
  });

  it('VALID: {value: "planner-minion-quest-agent"} => parses successfully', () => {
    const name = AgentPromptNameStub({ value: 'planner-minion-quest-agent' });

    const result = agentPromptNameContract.parse(name);

    expect(result).toBe('planner-minion-quest-agent');
  });

  it('VALID: {default stub} => parses with default value', () => {
    const name = AgentPromptNameStub();

    const result = agentPromptNameContract.parse(name);

    expect(result).toBe('quest-gap-reviewer');
  });

  it('INVALID: {value: "unknown-agent"} => throws validation error', () => {
    expect(() => {
      agentPromptNameContract.parse('unknown-agent');
    }).toThrow(/Invalid enum value/u);
  });

  it('INVALID: {value: ""} => throws validation error', () => {
    expect(() => {
      agentPromptNameContract.parse('');
    }).toThrow(/Invalid enum value/u);
  });
});

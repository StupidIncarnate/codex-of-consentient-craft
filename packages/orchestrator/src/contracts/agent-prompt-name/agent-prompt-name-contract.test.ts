import { agentPromptNameContract } from './agent-prompt-name-contract';
import { AgentPromptNameStub } from './agent-prompt-name.stub';

describe('agentPromptNameContract', () => {
  it('VALID: {value: "chaoswhisperer-gap-minion"} => parses successfully', () => {
    const name = AgentPromptNameStub({ value: 'chaoswhisperer-gap-minion' });

    const result = agentPromptNameContract.parse(name);

    expect(result).toBe('chaoswhisperer-gap-minion');
  });

  it('VALID: {value: "pathseeker-surface"} => parses successfully', () => {
    const name = AgentPromptNameStub({ value: 'pathseeker-surface' });

    const result = agentPromptNameContract.parse(name);

    expect(result).toBe('pathseeker-surface');
  });

  it('VALID: {value: "pathseeker-dedup"} => parses successfully', () => {
    const name = AgentPromptNameStub({ value: 'pathseeker-dedup' });

    const result = agentPromptNameContract.parse(name);

    expect(result).toBe('pathseeker-dedup');
  });

  it('VALID: {value: "pathseeker-assertion-correctness"} => parses successfully', () => {
    const name = AgentPromptNameStub({ value: 'pathseeker-assertion-correctness' });

    const result = agentPromptNameContract.parse(name);

    expect(result).toBe('pathseeker-assertion-correctness');
  });

  it('VALID: {value: "pathseeker-walk"} => parses successfully', () => {
    const name = AgentPromptNameStub({ value: 'pathseeker-walk' });

    const result = agentPromptNameContract.parse(name);

    expect(result).toBe('pathseeker-walk');
  });

  it('VALID: {value: "blightwarden-security-minion"} => parses successfully', () => {
    const name = AgentPromptNameStub({ value: 'blightwarden-security-minion' });

    const result = agentPromptNameContract.parse(name);

    expect(result).toBe('blightwarden-security-minion');
  });

  it('VALID: {value: "blightwarden-dedup-minion"} => parses successfully', () => {
    const name = AgentPromptNameStub({ value: 'blightwarden-dedup-minion' });

    const result = agentPromptNameContract.parse(name);

    expect(result).toBe('blightwarden-dedup-minion');
  });

  it('VALID: {value: "blightwarden-perf-minion"} => parses successfully', () => {
    const name = AgentPromptNameStub({ value: 'blightwarden-perf-minion' });

    const result = agentPromptNameContract.parse(name);

    expect(result).toBe('blightwarden-perf-minion');
  });

  it('VALID: {value: "blightwarden-integrity-minion"} => parses successfully', () => {
    const name = AgentPromptNameStub({ value: 'blightwarden-integrity-minion' });

    const result = agentPromptNameContract.parse(name);

    expect(result).toBe('blightwarden-integrity-minion');
  });

  it('VALID: {value: "blightwarden-dead-code-minion"} => parses successfully', () => {
    const name = AgentPromptNameStub({ value: 'blightwarden-dead-code-minion' });

    const result = agentPromptNameContract.parse(name);

    expect(result).toBe('blightwarden-dead-code-minion');
  });

  it('VALID: {default stub} => parses with default value', () => {
    const name = AgentPromptNameStub();

    const result = agentPromptNameContract.parse(name);

    expect(result).toBe('chaoswhisperer-gap-minion');
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

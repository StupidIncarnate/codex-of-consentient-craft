import { agentPromptNameContract } from './agent-prompt-name-contract';
import { AgentPromptNameStub } from './agent-prompt-name.stub';

describe('agentPromptNameContract', () => {
  it('VALID: {value: "chaoswhisperer-gap-minion"} => parses successfully', () => {
    const name = AgentPromptNameStub({ value: 'chaoswhisperer-gap-minion' });

    const result = agentPromptNameContract.parse(name);

    expect(result).toBe('chaoswhisperer-gap-minion');
  });

  it('VALID: {value: "codeweaver"} => parses successfully', () => {
    const name = AgentPromptNameStub({ value: 'codeweaver' });

    const result = agentPromptNameContract.parse(name);

    expect(result).toBe('codeweaver');
  });

  it('VALID: {value: "spiritmender"} => parses successfully', () => {
    const name = AgentPromptNameStub({ value: 'spiritmender' });

    const result = agentPromptNameContract.parse(name);

    expect(result).toBe('spiritmender');
  });

  it('VALID: {value: "flowrider"} => parses successfully', () => {
    const name = AgentPromptNameStub({ value: 'flowrider' });

    const result = agentPromptNameContract.parse(name);

    expect(result).toBe('flowrider');
  });

  it('VALID: {value: "siegemaster"} => parses successfully', () => {
    const name = AgentPromptNameStub({ value: 'siegemaster' });

    const result = agentPromptNameContract.parse(name);

    expect(result).toBe('siegemaster');
  });

  it('VALID: {value: "pesteater"} => parses successfully', () => {
    const name = AgentPromptNameStub({ value: 'pesteater' });

    const result = agentPromptNameContract.parse(name);

    expect(result).toBe('pesteater');
  });

  it('VALID: {default stub} => parses with default value', () => {
    const name = AgentPromptNameStub();

    const result = agentPromptNameContract.parse(name);

    expect(result).toBe('chaoswhisperer-gap-minion');
  });

  it('VALID: {value: "planner-minion"} => parses successfully', () => {
    const name = AgentPromptNameStub({ value: 'planner-minion' });

    const result = agentPromptNameContract.parse(name);

    expect(result).toBe('planner-minion');
  });

  it('VALID: {value: "worker-minion"} => parses successfully', () => {
    const name = AgentPromptNameStub({ value: 'worker-minion' });

    const result = agentPromptNameContract.parse(name);

    expect(result).toBe('worker-minion');
  });

  it('VALID: {value: "reviewer-minion"} => parses successfully', () => {
    const name = AgentPromptNameStub({ value: 'reviewer-minion' });

    const result = agentPromptNameContract.parse(name);

    expect(result).toBe('reviewer-minion');
  });

  it('INVALID: {value: "unknown-agent"} => throws validation error', () => {
    expect(() => {
      agentPromptNameContract.parse('unknown-agent');
    }).toThrow(/Invalid enum value/u);
  });

  it('INVALID: {value: "pathseeker-surface"} => throws validation error', () => {
    expect(() => {
      agentPromptNameContract.parse('pathseeker-surface');
    }).toThrow(/Invalid enum value/u);
  });

  it('INVALID: {value: "lawbringer"} => throws validation error (removed role)', () => {
    expect(() => {
      agentPromptNameContract.parse('lawbringer');
    }).toThrow(/Invalid enum value/u);
  });

  it('INVALID: {value: "lawbringer-minion"} => throws validation error (removed role)', () => {
    expect(() => {
      agentPromptNameContract.parse('lawbringer-minion');
    }).toThrow(/Invalid enum value/u);
  });

  it('INVALID: {value: "blightwarden"} => throws validation error (removed role)', () => {
    expect(() => {
      agentPromptNameContract.parse('blightwarden');
    }).toThrow(/Invalid enum value/u);
  });

  it('INVALID: {value: "blightwarden-group-minion"} => throws validation error (removed role)', () => {
    expect(() => {
      agentPromptNameContract.parse('blightwarden-group-minion');
    }).toThrow(/Invalid enum value/u);
  });

  it('INVALID: {value: "blightwarden-crosscut-minion"} => throws validation error (removed role)', () => {
    expect(() => {
      agentPromptNameContract.parse('blightwarden-crosscut-minion');
    }).toThrow(/Invalid enum value/u);
  });

  it('INVALID: {value: "blightwarden-deadcode-minion"} => throws validation error (removed role)', () => {
    expect(() => {
      agentPromptNameContract.parse('blightwarden-deadcode-minion');
    }).toThrow(/Invalid enum value/u);
  });

  // The per-parent minion families and the standards-review role the generic planner/worker/reviewer
  // trio replaced. A stale MCP server serving one of these names is the failure this pins.
  it.each([
    'blightscout',
    'codeweaver-piece-minion',
    'flowrider-authoring-minion',
    'flowrider-coverage-minion',
    'siegemaster-walker-minion',
    'siegemaster-test-audit-minion',
  ])(
    'INVALID: {value: "%s"} => throws validation error (replaced by the generic trio)',
    (value) => {
      expect(() => {
        agentPromptNameContract.parse(value);
      }).toThrow(/Invalid enum value/u);
    },
  );

  it('INVALID: {value: ""} => throws validation error', () => {
    expect(() => {
      agentPromptNameContract.parse('');
    }).toThrow(/Invalid enum value/u);
  });
});

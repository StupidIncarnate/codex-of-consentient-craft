import { agentContract } from './agent-contract';
import { AgentStub } from './agent.stub';

describe('agentContract', () => {
  it('VALID: {default stub} => parses with the default id', () => {
    const value = AgentStub();

    expect(value.id).toBe('agent-abc');
  });

  it('INVALID: {id: ""} => is rejected', () => {
    const result = agentContract.safeParse({ id: '' });

    expect(result.success).toBe(false);
  });
});

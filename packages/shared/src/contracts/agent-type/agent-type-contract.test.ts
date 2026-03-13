import { agentTypeContract } from './agent-type-contract';
import { AgentTypeStub } from './agent-type.stub';

describe('agentTypeContract', () => {
  it('VALID: {value: "ward"} => parses successfully', () => {
    const agentType = AgentTypeStub({ value: 'ward' });

    expect(agentType).toBe('ward');
  });

  it('VALID: {default value} => uses default value', () => {
    const agentType = AgentTypeStub();

    expect(agentType).toBe('ward');
  });

  it('VALID: {value: "codeweaver"} => parses successfully', () => {
    const agentType = AgentTypeStub({ value: 'codeweaver' });

    expect(agentType).toBe('codeweaver');
  });

  it('INVALID_VALUE: {value: ""} => throws validation error', () => {
    expect(() => {
      return agentTypeContract.parse('');
    }).toThrow(/too_small/u);
  });
});

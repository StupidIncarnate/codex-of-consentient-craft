import { agentFamilyNameContract } from './agent-family-name-contract';
import { AgentFamilyNameStub } from './agent-family-name.stub';

describe('agentFamilyNameContract', () => {
  it('VALID: {value: "siegemaster"} => parses successfully', () => {
    const result = agentFamilyNameContract.parse(AgentFamilyNameStub());

    expect(result).toBe('siegemaster');
  });

  it('VALID: {value: "wardFull"} => parses successfully', () => {
    const result = agentFamilyNameContract.parse(AgentFamilyNameStub({ value: 'wardFull' }));

    expect(result).toBe('wardFull');
  });

  it('INVALID: {value: ""} => throws validation error', () => {
    expect(() => agentFamilyNameContract.parse('')).toThrow(/String must contain at least 1/u);
  });
});

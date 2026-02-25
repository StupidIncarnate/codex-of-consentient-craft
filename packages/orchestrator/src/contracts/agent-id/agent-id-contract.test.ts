import { agentIdContract } from './agent-id-contract';
import { AgentIdStub } from './agent-id.stub';

describe('agentIdContract', () => {
  describe('valid agent ids', () => {
    it('VALID: {value: "agent-abc"} => parses successfully', () => {
      const result = AgentIdStub({ value: 'agent-abc' });

      expect(agentIdContract.parse(result)).toBe('agent-abc');
    });
  });

  describe('invalid agent ids', () => {
    it('INVALID_VALUE: {value: ""} => throws validation error', () => {
      expect(() => agentIdContract.parse('')).toThrow(/too_small/u);
    });
  });
});

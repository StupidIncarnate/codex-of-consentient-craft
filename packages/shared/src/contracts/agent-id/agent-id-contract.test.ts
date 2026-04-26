import { agentIdContract } from './agent-id-contract';
import { AgentIdStub } from './agent-id.stub';

describe('agentIdContract', () => {
  describe('valid input', () => {
    it('VALID: {value: "agent-abc"} => returns branded AgentId', () => {
      const result = AgentIdStub({ value: 'agent-abc' });

      expect(result).toBe('agent-abc');
    });
  });

  describe('invalid input', () => {
    it('INVALID: {value: ""} => throws on empty string', () => {
      expect(() => agentIdContract.parse('')).toThrow(/too_small/u);
    });

    it('INVALID: {value: 123} => throws on non-string', () => {
      expect(() => agentIdContract.parse(123 as never)).toThrow(/Expected string/u);
    });
  });
});

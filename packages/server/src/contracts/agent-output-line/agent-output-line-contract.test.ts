import { agentOutputLineContract } from './agent-output-line-contract';
import { AgentOutputLineStub } from './agent-output-line.stub';

describe('agentOutputLineContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "some output"} => parses string', () => {
      const result = agentOutputLineContract.parse('some output');

      expect(result).toBe('some output');
    });

    it('VALID: {value: ""} => parses empty string', () => {
      const result = agentOutputLineContract.parse('');

      expect(result).toBe('');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: 123} => throws for number', () => {
      expect(() => agentOutputLineContract.parse(123)).toThrow(/Expected string/u);
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => agentOutputLineContract.parse(null)).toThrow(/Expected string/u);
    });

    it('EMPTY: {value: undefined} => throws for undefined', () => {
      expect(() => agentOutputLineContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid agent output line', () => {
      const result = AgentOutputLineStub();

      expect(result).toBe('Building auth guard...');
    });

    it('VALID: {value: "custom"} => creates agent output line with custom value', () => {
      const result = AgentOutputLineStub({ value: 'custom' });

      expect(result).toBe('custom');
    });
  });
});

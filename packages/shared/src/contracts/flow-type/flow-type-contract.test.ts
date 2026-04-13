import { flowTypeContract } from './flow-type-contract';
import { FlowTypeStub } from './flow-type.stub';

describe('flowTypeContract', () => {
  describe('valid values', () => {
    it('VALID: {value: "runtime"} => parses successfully', () => {
      const result = flowTypeContract.parse('runtime');

      expect(result).toBe('runtime');
    });

    it('VALID: {value: "operational"} => parses successfully', () => {
      const result = flowTypeContract.parse('operational');

      expect(result).toBe('operational');
    });

    it('VALID: {stub default} => returns runtime', () => {
      const value = FlowTypeStub();

      expect(value).toBe('runtime');
    });

    it('VALID: {stub override operational} => returns operational', () => {
      const value = FlowTypeStub({ value: 'operational' });

      expect(value).toBe('operational');
    });
  });

  describe('invalid values', () => {
    it('INVALID: {value: "user"} => throws validation error', () => {
      expect(() => {
        flowTypeContract.parse('user');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => {
        flowTypeContract.parse('');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {value: null} => throws validation error', () => {
      expect(() => {
        flowTypeContract.parse(null);
      }).toThrow(/Expected/u);
    });
  });
});

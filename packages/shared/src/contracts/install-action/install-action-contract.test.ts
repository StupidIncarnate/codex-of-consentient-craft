import { installActionContract } from './install-action-contract';
import { InstallActionStub as _InstallActionStub } from './install-action.stub';

describe('installActionContract', () => {
  describe('valid actions', () => {
    it('VALID: {action: "created"} => parses successfully', () => {
      const result = installActionContract.parse('created');

      expect(result).toBe('created');
    });

    it('VALID: {action: "merged"} => parses successfully', () => {
      const result = installActionContract.parse('merged');

      expect(result).toBe('merged');
    });

    it('VALID: {action: "skipped"} => parses successfully', () => {
      const result = installActionContract.parse('skipped');

      expect(result).toBe('skipped');
    });

    it('VALID: {action: "failed"} => parses successfully', () => {
      const result = installActionContract.parse('failed');

      expect(result).toBe('failed');
    });
  });

  describe('invalid actions', () => {
    it('INVALID: {action: "unknown"} => throws ZodError', () => {
      expect(() => {
        return installActionContract.parse('unknown');
      }).toThrow('Invalid enum value');
    });

    it('INVALID: {action: "deleted"} => throws ZodError', () => {
      expect(() => {
        return installActionContract.parse('deleted');
      }).toThrow('Invalid enum value');
    });

    it('INVALID: {action: ""} => throws ZodError', () => {
      expect(() => {
        return installActionContract.parse('');
      }).toThrow('Invalid enum value');
    });

    it('INVALID: {action: 123} => throws ZodError', () => {
      expect(() => {
        return installActionContract.parse(123);
      }).toThrow('received number');
    });

    it('INVALID: {action: null} => throws ZodError', () => {
      expect(() => {
        return installActionContract.parse(null);
      }).toThrow('received null');
    });

    it('INVALID: {action: undefined} => throws ZodError', () => {
      expect(() => {
        return installActionContract.parse(undefined);
      }).toThrow('Required');
    });
  });
});

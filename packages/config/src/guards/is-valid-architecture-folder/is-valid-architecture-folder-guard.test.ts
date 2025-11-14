import { isValidArchitectureFolderGuard } from './is-valid-architecture-folder-guard';

describe('isValidArchitectureFolderGuard', () => {
  describe('valid architecture folders', () => {
    it('VALID: {folder: "brokers"} => returns true', () => {
      const result = isValidArchitectureFolderGuard({ folder: 'brokers' });

      expect(result).toBe(true);
    });

    it('VALID: {folder: "contracts"} => returns true', () => {
      const result = isValidArchitectureFolderGuard({ folder: 'contracts' });

      expect(result).toBe(true);
    });

    it('VALID: {folder: "widgets"} => returns true', () => {
      const result = isValidArchitectureFolderGuard({ folder: 'widgets' });

      expect(result).toBe(true);
    });
  });

  describe('invalid architecture folders', () => {
    it('INVALID_VALUE: {folder: "invalid"} => returns false', () => {
      const result = isValidArchitectureFolderGuard({ folder: 'invalid' });

      expect(result).toBe(false);
    });

    it('INVALID_TYPE: {folder: 123} => returns false', () => {
      const result = isValidArchitectureFolderGuard({ folder: 123 });

      expect(result).toBe(false);
    });

    it('INVALID_UNDEFINED: {folder: undefined} => returns false', () => {
      const result = isValidArchitectureFolderGuard({ folder: undefined });

      expect(result).toBe(false);
    });

    it('INVALID_NULL: {folder: null} => returns false', () => {
      const result = isValidArchitectureFolderGuard({ folder: null });

      expect(result).toBe(false);
    });
  });
});

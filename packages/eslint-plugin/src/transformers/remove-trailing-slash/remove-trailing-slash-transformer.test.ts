import { removeTrailingSlashTransformer } from './remove-trailing-slash-transformer';

describe('removeTrailingSlashTransformer', () => {
  describe('removing trailing slash', () => {
    it('VALID: {str: "contracts/"} => returns "contracts"', () => {
      const result = removeTrailingSlashTransformer({ str: 'contracts/' });

      expect(result).toBe('contracts');
    });

    it('VALID: {str: "brokers/"} => returns "brokers"', () => {
      const result = removeTrailingSlashTransformer({ str: 'brokers/' });

      expect(result).toBe('brokers');
    });

    it('VALID: {str: "node_modules/"} => returns "node_modules"', () => {
      const result = removeTrailingSlashTransformer({ str: 'node_modules/' });

      expect(result).toBe('node_modules');
    });
  });

  describe('edge cases', () => {
    it('VALID: {str: "contracts"} => returns "contracts"', () => {
      const result = removeTrailingSlashTransformer({ str: 'contracts' });

      expect(result).toBe('contracts');
    });

    it('VALID: {str: "/"} => returns ""', () => {
      const result = removeTrailingSlashTransformer({ str: '/' });

      expect(result).toBe('');
    });

    it('VALID: {str: "path/to/folder/"} => returns "path/to/folder"', () => {
      const result = removeTrailingSlashTransformer({ str: 'path/to/folder/' });

      expect(result).toBe('path/to/folder');
    });

    it('VALID: {str: ""} => returns ""', () => {
      const result = removeTrailingSlashTransformer({ str: '' });

      expect(result).toBe('');
    });
  });
});

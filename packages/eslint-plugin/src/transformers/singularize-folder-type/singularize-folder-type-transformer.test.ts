import { singularizeFolderTypeTransformer } from './singularize-folder-type-transformer';

describe('singularizeFolderTypeTransformer', () => {
  describe('singularizing folder types', () => {
    it('VALID: {folderType: "brokers"} => returns "broker"', () => {
      const result = singularizeFolderTypeTransformer({ folderType: 'brokers' });

      expect(result).toBe('broker');
    });

    it('VALID: {folderType: "adapters"} => returns "adapter"', () => {
      const result = singularizeFolderTypeTransformer({ folderType: 'adapters' });

      expect(result).toBe('adapter');
    });

    it('VALID: {folderType: "transformers"} => returns "transformer"', () => {
      const result = singularizeFolderTypeTransformer({ folderType: 'transformers' });

      expect(result).toBe('transformer');
    });

    it('VALID: {folderType: "guards"} => returns "guard"', () => {
      const result = singularizeFolderTypeTransformer({ folderType: 'guards' });

      expect(result).toBe('guard');
    });

    it('VALID: {folderType: "contracts"} => returns "contract"', () => {
      const result = singularizeFolderTypeTransformer({ folderType: 'contracts' });

      expect(result).toBe('contract');
    });
  });

  describe('edge cases', () => {
    it('VALID: {folderType: "test"} => returns "test"', () => {
      const result = singularizeFolderTypeTransformer({ folderType: 'test' });

      expect(result).toBe('test');
    });

    it('VALID: {folderType: "s"} => returns ""', () => {
      const result = singularizeFolderTypeTransformer({ folderType: 's' });

      expect(result).toBe('');
    });

    it('VALID: {folderType: "ss"} => returns "s"', () => {
      const result = singularizeFolderTypeTransformer({ folderType: 'ss' });

      expect(result).toBe('s');
    });

    it('VALID: {folderType: ""} => returns ""', () => {
      const result = singularizeFolderTypeTransformer({ folderType: '' });

      expect(result).toBe('');
    });
  });
});

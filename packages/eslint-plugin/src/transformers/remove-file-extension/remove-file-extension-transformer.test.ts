import { removeFileExtensionTransformer } from './remove-file-extension-transformer';

describe('removeFileExtensionTransformer', () => {
  describe('removing .ts extension', () => {
    it('VALID: {filename: "user-broker.ts"} => returns "user-broker"', () => {
      const result = removeFileExtensionTransformer({ filename: 'user-broker.ts' });

      expect(result).toBe('user-broker');
    });

    it('VALID: {filename: "file.stub.ts"} => returns "file.stub"', () => {
      const result = removeFileExtensionTransformer({ filename: 'file.stub.ts' });

      expect(result).toBe('file.stub');
    });
  });

  describe('removing .tsx extension', () => {
    it('VALID: {filename: "user-widget.tsx"} => returns "user-widget"', () => {
      const result = removeFileExtensionTransformer({ filename: 'user-widget.tsx' });

      expect(result).toBe('user-widget');
    });

    it('VALID: {filename: "component.proxy.tsx"} => returns "component.proxy"', () => {
      const result = removeFileExtensionTransformer({ filename: 'component.proxy.tsx' });

      expect(result).toBe('component.proxy');
    });
  });

  describe('edge cases', () => {
    it('VALID: {filename: "file"} => returns "file"', () => {
      const result = removeFileExtensionTransformer({ filename: 'file' });

      expect(result).toBe('file');
    });

    it('VALID: {filename: ".ts"} => returns ".ts"', () => {
      const result = removeFileExtensionTransformer({ filename: '.ts' });

      expect(result).toBe('.ts');
    });

    it('VALID: {filename: "file.js"} => returns "file.js"', () => {
      const result = removeFileExtensionTransformer({ filename: 'file.js' });

      expect(result).toBe('file.js');
    });
  });
});

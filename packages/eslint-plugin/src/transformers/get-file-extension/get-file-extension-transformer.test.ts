import { getFileExtensionTransformer } from './get-file-extension-transformer';

describe('getFileExtensionTransformer', () => {
  describe('with dot', () => {
    it('VALID: {filename: "user.ts", includesDot: true} => returns ".ts"', () => {
      const result = getFileExtensionTransformer({ filename: 'user.ts', includesDot: true });

      expect(result).toBe('.ts');
    });

    it('VALID: {filename: "user.tsx", includesDot: true} => returns ".tsx"', () => {
      const result = getFileExtensionTransformer({ filename: 'user.tsx', includesDot: true });

      expect(result).toBe('.tsx');
    });

    it('VALID: {filename: "/path/to/user-widget.tsx", includesDot: true} => returns ".tsx"', () => {
      const result = getFileExtensionTransformer({
        filename: '/path/to/user-widget.tsx',
        includesDot: true,
      });

      expect(result).toBe('.tsx');
    });
  });

  describe('without dot', () => {
    it('VALID: {filename: "user.ts", includesDot: false} => returns "ts"', () => {
      const result = getFileExtensionTransformer({ filename: 'user.ts', includesDot: false });

      expect(result).toBe('ts');
    });

    it('VALID: {filename: "user.tsx", includesDot: false} => returns "tsx"', () => {
      const result = getFileExtensionTransformer({ filename: 'user.tsx', includesDot: false });

      expect(result).toBe('tsx');
    });

    it('VALID: {filename: "/path/to/user-widget.tsx", includesDot: false} => returns "tsx"', () => {
      const result = getFileExtensionTransformer({
        filename: '/path/to/user-widget.tsx',
        includesDot: false,
      });

      expect(result).toBe('tsx');
    });
  });

  describe('default behavior', () => {
    it('VALID: {filename: "user.ts"} => returns ".ts"', () => {
      const result = getFileExtensionTransformer({ filename: 'user.ts' });

      expect(result).toBe('.ts');
    });

    it('VALID: {filename: "user.tsx"} => returns ".tsx"', () => {
      const result = getFileExtensionTransformer({ filename: 'user.tsx' });

      expect(result).toBe('.tsx');
    });
  });

  describe('edge cases', () => {
    it('VALID: {filename: "user"} => returns ".ts"', () => {
      const result = getFileExtensionTransformer({ filename: 'user' });

      expect(result).toBe('.ts');
    });

    it('VALID: {filename: "user.js"} => returns ".ts"', () => {
      const result = getFileExtensionTransformer({ filename: 'user.js' });

      expect(result).toBe('.ts');
    });
  });
});

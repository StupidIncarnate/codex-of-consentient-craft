import { isSourceFileGuard } from './is-source-file-guard';

describe('isSourceFileGuard', () => {
  describe('TypeScript source files', () => {
    it('VALID: {filePath: .ts file} => returns true', () => {
      const result = isSourceFileGuard({
        filePath: '/src/brokers/user/user-broker.ts',
      });

      expect(result).toBe(true);
    });

    it('VALID: {filePath: .tsx file} => returns true', () => {
      const result = isSourceFileGuard({
        filePath: '/src/widgets/user/user-widget.tsx',
      });

      expect(result).toBe(true);
    });
  });

  describe('JavaScript source files', () => {
    it('VALID: {filePath: .js file} => returns true', () => {
      const result = isSourceFileGuard({
        filePath: '/src/index.js',
      });

      expect(result).toBe(true);
    });

    it('VALID: {filePath: .jsx file} => returns true', () => {
      const result = isSourceFileGuard({
        filePath: '/src/app.jsx',
      });

      expect(result).toBe(true);
    });
  });

  describe('non-source files', () => {
    it('VALID: {filePath: .json file} => returns false', () => {
      const result = isSourceFileGuard({
        filePath: '/src/config.json',
      });

      expect(result).toBe(false);
    });

    it('VALID: {filePath: .md file} => returns false', () => {
      const result = isSourceFileGuard({
        filePath: '/README.md',
      });

      expect(result).toBe(false);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {filePath: undefined} => returns false', () => {
      const result = isSourceFileGuard({});

      expect(result).toBe(false);
    });
  });
});

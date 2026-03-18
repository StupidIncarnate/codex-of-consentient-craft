import { isSourceFileGuard } from './is-source-file-guard';

describe('isSourceFileGuard', () => {
  describe('source files', () => {
    it('VALID: {filePath: "src/index.ts"} => returns true', () => {
      expect(isSourceFileGuard({ filePath: 'src/index.ts' })).toBe(true);
    });

    it('VALID: {filePath: "src/app.tsx"} => returns true', () => {
      expect(isSourceFileGuard({ filePath: 'src/app.tsx' })).toBe(true);
    });

    it('VALID: {filePath: "src/index.js"} => returns true', () => {
      expect(isSourceFileGuard({ filePath: 'src/index.js' })).toBe(true);
    });

    it('VALID: {filePath: "jest.config.cjs"} => returns true', () => {
      expect(isSourceFileGuard({ filePath: 'jest.config.cjs' })).toBe(true);
    });

    it('VALID: {filePath: "vite.config.mts"} => returns true', () => {
      expect(isSourceFileGuard({ filePath: 'vite.config.mts' })).toBe(true);
    });
  });

  describe('non-source files', () => {
    it('VALID: {filePath: "README.md"} => returns false', () => {
      expect(isSourceFileGuard({ filePath: 'README.md' })).toBe(false);
    });

    it('VALID: {filePath: "package.json"} => returns false', () => {
      expect(isSourceFileGuard({ filePath: 'package.json' })).toBe(false);
    });

    it('VALID: {filePath: "MANUAL-TEST-CASES.md"} => returns false', () => {
      expect(isSourceFileGuard({ filePath: 'MANUAL-TEST-CASES.md' })).toBe(false);
    });

    it('VALID: {filePath: not provided} => returns false', () => {
      expect(isSourceFileGuard({})).toBe(false);
    });
  });
});

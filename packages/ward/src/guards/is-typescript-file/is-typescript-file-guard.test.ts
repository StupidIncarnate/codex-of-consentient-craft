import { isTypescriptFileGuard } from './is-typescript-file-guard';

describe('isTypescriptFileGuard', () => {
  describe('typescript files', () => {
    it('VALID: {pattern: "src/index.ts"} => returns true', () => {
      const result = isTypescriptFileGuard({ pattern: 'src/index.ts' });

      expect(result).toBe(true);
    });

    it('VALID: {pattern: "src/app.tsx"} => returns true', () => {
      const result = isTypescriptFileGuard({ pattern: 'src/app.tsx' });

      expect(result).toBe(true);
    });

    it('VALID: {pattern: "types.d.ts"} => returns true', () => {
      const result = isTypescriptFileGuard({ pattern: 'types.d.ts' });

      expect(result).toBe(true);
    });

    it('VALID: {pattern: "*.ts"} => returns true', () => {
      const result = isTypescriptFileGuard({ pattern: '*.ts' });

      expect(result).toBe(true);
    });
  });

  describe('non-typescript patterns', () => {
    it('VALID: {pattern: "src/**/*"} => returns false', () => {
      const result = isTypescriptFileGuard({ pattern: 'src/**/*' });

      expect(result).toBe(false);
    });

    it('VALID: {pattern: "src"} => returns false', () => {
      const result = isTypescriptFileGuard({ pattern: 'src' });

      expect(result).toBe(false);
    });

    it('VALID: {pattern: "vite.config.js"} => returns false', () => {
      const result = isTypescriptFileGuard({ pattern: 'vite.config.js' });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {pattern: undefined} => returns false', () => {
      const result = isTypescriptFileGuard({});

      expect(result).toBe(false);
    });
  });
});

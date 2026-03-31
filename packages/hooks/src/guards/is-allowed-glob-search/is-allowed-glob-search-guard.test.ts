import { isAllowedGlobSearchGuard } from './is-allowed-glob-search-guard';
import { GlobToolInputStub } from '../../contracts/glob-tool-input/glob-tool-input.stub';

describe('isAllowedGlobSearchGuard', () => {
  describe('allowed: non-TS extensions', () => {
    it('VALID: {pattern: "**/*.json"} => returns true', () => {
      const result = isAllowedGlobSearchGuard({
        input: GlobToolInputStub({ pattern: '**/*.json' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {pattern: "**/*.md"} => returns true', () => {
      const result = isAllowedGlobSearchGuard({
        input: GlobToolInputStub({ pattern: '**/*.md' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {pattern: "**/*.css"} => returns true', () => {
      const result = isAllowedGlobSearchGuard({
        input: GlobToolInputStub({ pattern: '**/*.css' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {pattern: "**/*.yaml"} => returns true', () => {
      const result = isAllowedGlobSearchGuard({
        input: GlobToolInputStub({ pattern: '**/*.yaml' }),
      });

      expect(result).toBe(true);
    });
  });

  describe('allowed: outside src paths', () => {
    it('VALID: {pattern: "dist/**/*.js"} => returns true', () => {
      const result = isAllowedGlobSearchGuard({
        input: GlobToolInputStub({ pattern: 'dist/**/*.js' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {pattern: "node_modules/**"} => returns true', () => {
      const result = isAllowedGlobSearchGuard({
        input: GlobToolInputStub({ pattern: 'node_modules/**' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {pattern: "scripts/setup.sh"} => returns true', () => {
      const result = isAllowedGlobSearchGuard({
        input: GlobToolInputStub({ pattern: 'scripts/setup.sh' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {pattern: ".claude/settings.json"} => returns true', () => {
      const result = isAllowedGlobSearchGuard({
        input: GlobToolInputStub({ pattern: '.claude/settings.json' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {pattern: "tests/e2e/**"} => returns true', () => {
      const result = isAllowedGlobSearchGuard({
        input: GlobToolInputStub({ pattern: 'tests/e2e/**' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {pattern: "coverage/lcov.info"} => returns true', () => {
      const result = isAllowedGlobSearchGuard({
        input: GlobToolInputStub({ pattern: 'coverage/lcov.info' }),
      });

      expect(result).toBe(true);
    });
  });

  describe('blocked: exploratory TS/JS searches', () => {
    it('VALID: {pattern: "**/*.ts"} => returns false', () => {
      const result = isAllowedGlobSearchGuard({
        input: GlobToolInputStub({ pattern: '**/*.ts' }),
      });

      expect(result).toBe(false);
    });

    it('VALID: {pattern: "**/*.tsx"} => returns false', () => {
      const result = isAllowedGlobSearchGuard({
        input: GlobToolInputStub({ pattern: '**/*.tsx' }),
      });

      expect(result).toBe(false);
    });

    it('VALID: {pattern: "packages/hooks/src/brokers/**/*.ts"} => returns false', () => {
      const result = isAllowedGlobSearchGuard({
        input: GlobToolInputStub({ pattern: 'packages/hooks/src/brokers/**/*.ts' }),
      });

      expect(result).toBe(false);
    });

    it('VALID: {pattern: "**/user-fetch-broker.ts"} => returns false', () => {
      const result = isAllowedGlobSearchGuard({
        input: GlobToolInputStub({ pattern: '**/user-fetch-broker.ts' }),
      });

      expect(result).toBe(false);
    });

    it('VALID: {pattern: "src/**/*.ts"} => returns false', () => {
      const result = isAllowedGlobSearchGuard({
        input: GlobToolInputStub({ pattern: 'src/**/*.ts' }),
      });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {no input} => returns false', () => {
      const result = isAllowedGlobSearchGuard({});

      expect(result).toBe(false);
    });
  });
});

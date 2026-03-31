import { isAllowedGrepSearchGuard } from './is-allowed-grep-search-guard';
import { GrepToolInputStub } from '../../contracts/grep-tool-input/grep-tool-input.stub';

describe('isAllowedGrepSearchGuard', () => {
  describe('allowed: output_mode', () => {
    it('VALID: {output_mode: "content"} => returns true', () => {
      const result = isAllowedGrepSearchGuard({
        input: GrepToolInputStub({ output_mode: 'content' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {output_mode: "count"} => returns true', () => {
      const result = isAllowedGrepSearchGuard({
        input: GrepToolInputStub({ output_mode: 'count' }),
      });

      expect(result).toBe(true);
    });
  });

  describe('allowed: context flags', () => {
    it('VALID: {-A: 3} => returns true', () => {
      const result = isAllowedGrepSearchGuard({
        input: GrepToolInputStub({ '-A': 3 }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {-B: 2} => returns true', () => {
      const result = isAllowedGrepSearchGuard({
        input: GrepToolInputStub({ '-B': 2 }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {-C: 5} => returns true', () => {
      const result = isAllowedGrepSearchGuard({
        input: GrepToolInputStub({ '-C': 5 }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {context: 3} => returns true', () => {
      const result = isAllowedGrepSearchGuard({
        input: GrepToolInputStub({ context: 3 }),
      });

      expect(result).toBe(true);
    });
  });

  describe('allowed: path ends in file extension', () => {
    it('VALID: {path: "src/brokers/user/user-broker.ts"} => returns true', () => {
      const result = isAllowedGrepSearchGuard({
        input: GrepToolInputStub({ path: 'src/brokers/user/user-broker.ts' }),
      });

      expect(result).toBe(true);
    });
  });

  describe('allowed: non-TS glob filter', () => {
    it('VALID: {glob: "*.json"} => returns true', () => {
      const result = isAllowedGrepSearchGuard({
        input: GrepToolInputStub({ glob: '*.json' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {glob: "*.md"} => returns true', () => {
      const result = isAllowedGrepSearchGuard({
        input: GrepToolInputStub({ glob: '*.md' }),
      });

      expect(result).toBe(true);
    });
  });

  describe('allowed: non-TS type filter', () => {
    it('VALID: {type: "json"} => returns true', () => {
      const result = isAllowedGrepSearchGuard({
        input: GrepToolInputStub({ type: 'json' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {type: "md"} => returns true', () => {
      const result = isAllowedGrepSearchGuard({
        input: GrepToolInputStub({ type: 'md' }),
      });

      expect(result).toBe(true);
    });
  });

  describe('allowed: regex metacharacters in pattern', () => {
    it('VALID: {pattern: "import.*from"} => returns true', () => {
      const result = isAllowedGrepSearchGuard({
        input: GrepToolInputStub({ pattern: 'import.*from' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {pattern: "z\\.object\\("} => returns true', () => {
      const result = isAllowedGrepSearchGuard({
        input: GrepToolInputStub({ pattern: 'z\\.object\\(' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {pattern: "function\\s+\\w+"} => returns true', () => {
      const result = isAllowedGrepSearchGuard({
        input: GrepToolInputStub({ pattern: 'function\\s+\\w+' }),
      });

      expect(result).toBe(true);
    });
  });

  describe('allowed: multiline', () => {
    it('VALID: {multiline: true} => returns true', () => {
      const result = isAllowedGrepSearchGuard({
        input: GrepToolInputStub({ multiline: true }),
      });

      expect(result).toBe(true);
    });
  });

  describe('allowed: TS type filter passes through', () => {
    it('VALID: {type: "ts", pattern with metachar} => returns true (metachar takes precedence)', () => {
      const result = isAllowedGrepSearchGuard({
        input: GrepToolInputStub({ type: 'ts', pattern: 'export.*const' }),
      });

      expect(result).toBe(true);
    });
  });

  describe('blocked: exploratory search', () => {
    it('VALID: {pattern: "permission"} => returns false', () => {
      const result = isAllowedGrepSearchGuard({
        input: GrepToolInputStub({ pattern: 'permission' }),
      });

      expect(result).toBe(false);
    });

    it('VALID: {pattern: "user-fetch-broker"} => returns false', () => {
      const result = isAllowedGrepSearchGuard({
        input: GrepToolInputStub({ pattern: 'user-fetch-broker' }),
      });

      expect(result).toBe(false);
    });

    it('VALID: {pattern: "permission", output_mode: "files_with_matches"} => returns false', () => {
      const result = isAllowedGrepSearchGuard({
        input: GrepToolInputStub({ pattern: 'permission', output_mode: 'files_with_matches' }),
      });

      expect(result).toBe(false);
    });

    it('VALID: {pattern: "guard", type: "ts"} => returns false', () => {
      const result = isAllowedGrepSearchGuard({
        input: GrepToolInputStub({ pattern: 'guard', type: 'ts' }),
      });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {no input} => returns false', () => {
      const result = isAllowedGrepSearchGuard({});

      expect(result).toBe(false);
    });
  });
});

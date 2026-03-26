import { globPatternContract } from './glob-pattern-contract';
import { GlobPatternStub } from './glob-pattern.stub';

type GlobPattern = ReturnType<typeof GlobPatternStub>;

describe('globPatternContract', () => {
  describe('valid patterns', () => {
    it('VALID: {value: "src/**/*.ts"} => parses successfully', () => {
      const result: GlobPattern = globPatternContract.parse('src/**/*.ts');

      expect(String(result)).toBe('src/**/*.ts');
    });

    it('VALID: {stub default} => returns branded glob pattern', () => {
      const result = GlobPatternStub();

      expect(String(result)).toBe('**/*.ts');
    });
  });
});

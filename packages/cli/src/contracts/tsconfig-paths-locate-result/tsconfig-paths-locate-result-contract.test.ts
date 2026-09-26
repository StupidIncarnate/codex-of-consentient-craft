import { tsconfigPathsLocateResultContract } from './tsconfig-paths-locate-result-contract';
import { TsconfigPathsLocateResultStub } from './tsconfig-paths-locate-result.stub';

describe('tsconfigPathsLocateResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {situation: "missingCompilerOptions"} => parses successfully', () => {
      const result = tsconfigPathsLocateResultContract.parse({
        situation: 'missingCompilerOptions',
      });

      expect(result).toStrictEqual({ situation: 'missingCompilerOptions' });
    });

    it('VALID: {situation: "missingPaths"} => parses successfully', () => {
      const result = tsconfigPathsLocateResultContract.parse({
        situation: 'missingPaths',
        insertPos: 24,
        indent: '    ',
        needsLeadingComma: true,
      });

      expect(result).toStrictEqual({
        situation: 'missingPaths',
        insertPos: 24,
        indent: '    ',
        needsLeadingComma: true,
      });
    });

    it('VALID: {situation: "hasPaths"} => parses successfully', () => {
      const result = tsconfigPathsLocateResultContract.parse({
        situation: 'hasPaths',
        insertPos: 100,
        indent: '      ',
        needsLeadingComma: false,
        existingKeys: ['#gateway/npm/*'],
      });

      expect(result).toStrictEqual({
        situation: 'hasPaths',
        insertPos: 100,
        indent: '      ',
        needsLeadingComma: false,
        existingKeys: ['#gateway/npm/*'],
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {situation: "somethingElse"} => throws', () => {
      expect(() => tsconfigPathsLocateResultContract.parse({ situation: 'somethingElse' })).toThrow(
        /invalid/iu,
      );
    });

    it('INVALID: {situation: "missingPaths", insertPos: -1} => throws', () => {
      expect(() =>
        tsconfigPathsLocateResultContract.parse({
          situation: 'missingPaths',
          insertPos: -1,
          indent: '    ',
          needsLeadingComma: true,
        }),
      ).toThrow(/greater than or equal to 0/iu);
    });
  });

  describe('TsconfigPathsLocateResultStub', () => {
    it('VALID: {} => returns the default hasPaths stub', () => {
      const result = TsconfigPathsLocateResultStub();

      expect(result).toStrictEqual({
        situation: 'hasPaths',
        insertPos: 100,
        indent: '      ',
        needsLeadingComma: false,
        existingKeys: [],
      });
    });

    it('VALID: {situation: "missingPaths"} => returns the missingPaths default', () => {
      const result = TsconfigPathsLocateResultStub({ situation: 'missingPaths' });

      expect(result).toStrictEqual({
        situation: 'missingPaths',
        insertPos: 24,
        indent: '    ',
        needsLeadingComma: true,
      });
    });

    it('VALID: {situation: "missingCompilerOptions"} => returns the missingCompilerOptions default', () => {
      const result = TsconfigPathsLocateResultStub({ situation: 'missingCompilerOptions' });

      expect(result).toStrictEqual({ situation: 'missingCompilerOptions' });
    });
  });
});

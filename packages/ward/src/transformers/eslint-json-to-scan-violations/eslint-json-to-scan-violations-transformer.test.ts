
import { eslintJsonToScanViolationsTransformer } from './eslint-json-to-scan-violations-transformer';

const rootPath = '/repo';
const rule = '@dungeonmaster/ban-workspace-export-mocks';

describe('eslintJsonToScanViolationsTransformer', () => {
  describe('valid input', () => {
    it('VALID: {two files, hits of the rule and of another rule} => keeps only the rule, relative, sorted by file then line', () => {
      const jsonOutput = JSON.stringify([
        {
          filePath: '/repo/packages/b/src/z.ts',
          messages: [
            { ruleId: '@dungeonmaster/ban-workspace-export-mocks', line: 9, message: 'Late' },
            { ruleId: 'no-console', line: 1, message: 'Other rule' },
          ],
        },
        {
          filePath: '/repo/packages/a/src/y.ts',
          messages: [
            { ruleId: '@dungeonmaster/ban-workspace-export-mocks', line: 7, message: 'Second' },
            { ruleId: '@dungeonmaster/ban-workspace-export-mocks', line: 2, message: 'First' },
          ],
        },
      ]);

      const result = eslintJsonToScanViolationsTransformer({ jsonOutput, rule, rootPath });

      expect(result).toStrictEqual([
        { file: 'packages/a/src/y.ts', line: 2, message: 'First' },
        { file: 'packages/a/src/y.ts', line: 7, message: 'Second' },
        { file: 'packages/b/src/z.ts', line: 9, message: 'Late' },
      ]);
    });

    it('VALID: {text before the JSON array} => still parses the report', () => {
      const jsonOutput = `warning: something\n${JSON.stringify([
        {
          filePath: '/repo/a.ts',
          messages: [
            { ruleId: '@dungeonmaster/ban-workspace-export-mocks', line: 4, message: 'M' },
          ],
        },
      ])}`;

      const result = eslintJsonToScanViolationsTransformer({ jsonOutput, rule, rootPath });

      expect(result).toStrictEqual([{ file: 'a.ts', line: 4, message: 'M' }]);
    });

    it('EDGE: {path outside the root, null line, no message text} => keeps the absolute path, line 0, empty message', () => {
      const jsonOutput = JSON.stringify([
        {
          filePath: '/elsewhere/a.ts',
          messages: [{ ruleId: '@dungeonmaster/ban-workspace-export-mocks', line: null }],
        },
      ]);

      const result = eslintJsonToScanViolationsTransformer({ jsonOutput, rule, rootPath });

      expect(result).toStrictEqual([{ file: '/elsewhere/a.ts', line: 0, message: '' }]);
    });

    it('EMPTY: {entry without messages} => returns no violations', () => {
      const jsonOutput = JSON.stringify([{ filePath: '/repo/a.ts' }]);

      const result = eslintJsonToScanViolationsTransformer({ jsonOutput, rule, rootPath });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {empty report} => returns no violations', () => {
      const result = eslintJsonToScanViolationsTransformer({ jsonOutput: '[]', rule, rootPath });

      expect(result).toStrictEqual([]);
    });
  });

  describe('invalid input', () => {
    it('ERROR: {output is not JSON} => throws naming the output', () => {
      expect(() =>
        eslintJsonToScanViolationsTransformer({ jsonOutput: 'Oops, config broke', rule, rootPath }),
      ).toThrow(/^ESLint output was not a JSON report: Oops, config broke$/u);
    });
  });
});

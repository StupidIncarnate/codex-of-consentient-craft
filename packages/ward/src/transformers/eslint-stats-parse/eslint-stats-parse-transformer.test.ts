import { FileTimingStub } from '../../contracts/file-timing/file-timing.stub';

import { eslintStatsParseTransformer } from './eslint-stats-parse-transformer';

const buildEslintResult = ({
  filePath,
  stats,
  ...rest
}: {
  filePath?: string;
  stats?: {
    times?: {
      passes?: {
        total: number | string;
        parse?: { total: number };
        rules?: Record<string, { total: number }>;
        fix?: { total: number };
      }[];
    };
  };
  messages?: unknown[];
  errorCount?: number;
  warningCount?: number;
}): unknown => ({
  filePath,
  stats,
  ...rest,
});

describe('eslintStatsParseTransformer', () => {
  describe('valid stats output', () => {
    it('VALID: {single file with stats} => returns one FileTiming entry', () => {
      const entry = buildEslintResult({
        filePath: 'src/index.ts',
        stats: { times: { passes: [{ total: 12.5 }, { total: 1.2 }] } },
      });

      const result = eslintStatsParseTransformer({ eslintResults: [entry] });

      expect(result).toStrictEqual([
        FileTimingStub({
          filePath: 'src/index.ts',
          durationMs: 13.7,
          testMs: 0,
          slowestTestMs: 0,
          testCount: 0,
        }),
      ]);
    });

    it('VALID: {multiple files with stats} => returns FileTiming per file', () => {
      const entryA = buildEslintResult({
        filePath: 'src/a.ts',
        stats: { times: { passes: [{ total: 5.0 }] } },
      });
      const entryB = buildEslintResult({
        filePath: 'src/b.ts',
        stats: { times: { passes: [{ total: 3.0 }, { total: 2.0 }] } },
      });

      const result = eslintStatsParseTransformer({ eslintResults: [entryA, entryB] });

      expect(result).toStrictEqual([
        FileTimingStub({
          filePath: 'src/a.ts',
          durationMs: 5.0,
          testMs: 0,
          slowestTestMs: 0,
          testCount: 0,
        }),
        FileTimingStub({
          filePath: 'src/b.ts',
          durationMs: 5.0,
          testMs: 0,
          slowestTestMs: 0,
          testCount: 0,
        }),
      ]);
    });
  });

  describe('the compile/rules split', () => {
    it('VALID: {a pass carrying parse, rules and fix} => rulesMs is rules plus fix, never parse', () => {
      const entry = buildEslintResult({
        filePath: 'src/index.ts',
        stats: {
          times: {
            passes: [
              {
                total: 8486.8,
                parse: { total: 7947.8 },
                rules: {
                  'prettier/prettier': { total: 300.2 },
                  '@typescript-eslint/no-misused-promises': { total: 181.0 },
                },
                fix: { total: 10.0 },
              },
            ],
          },
        },
      });

      const result = eslintStatsParseTransformer({ eslintResults: [entry] });

      expect(result).toStrictEqual([
        FileTimingStub({
          filePath: 'src/index.ts',
          durationMs: 8486.8,
          testMs: 0,
          slowestTestMs: 0,
          testCount: 0,
          rulesMs: 491.2,
        }),
      ]);
    });

    it('VALID: {the file that paid the program build beside one that did not} => their rule times are comparable', () => {
      const paidTheBuild = buildEslintResult({
        filePath: 'src/ran-first.ts',
        stats: {
          times: {
            passes: [
              {
                total: 3840.3,
                parse: { total: 3573.5 },
                rules: { 'prettier/prettier': { total: 242.5 } },
                fix: { total: 0 },
              },
            ],
          },
        },
      });
      const ranLater = buildEslintResult({
        filePath: 'src/ran-later.test.ts',
        stats: {
          times: {
            passes: [
              {
                total: 358.4,
                parse: { total: 9.3 },
                rules: { 'prettier/prettier': { total: 334.9 } },
                fix: { total: 0 },
              },
            ],
          },
        },
      });

      const result = eslintStatsParseTransformer({ eslintResults: [paidTheBuild, ranLater] });

      expect(result).toStrictEqual([
        FileTimingStub({
          filePath: 'src/ran-first.ts',
          durationMs: 3840.3,
          testMs: 0,
          slowestTestMs: 0,
          testCount: 0,
          rulesMs: 242.5,
        }),
        FileTimingStub({
          filePath: 'src/ran-later.test.ts',
          durationMs: 358.4,
          testMs: 0,
          slowestTestMs: 0,
          testCount: 0,
          rulesMs: 334.9,
        }),
      ]);
    });

    it('VALID: {two passes each with rules} => sums rule time across both', () => {
      const entry = buildEslintResult({
        filePath: 'src/index.ts',
        stats: {
          times: {
            passes: [
              { total: 12.5, parse: { total: 2.5 }, rules: { eqeqeq: { total: 9.0 } } },
              { total: 3.2, parse: { total: 0.2 }, rules: { eqeqeq: { total: 2.5 } } },
            ],
          },
        },
      });

      const result = eslintStatsParseTransformer({ eslintResults: [entry] });

      expect(result).toStrictEqual([
        FileTimingStub({
          filePath: 'src/index.ts',
          durationMs: 15.7,
          testMs: 0,
          slowestTestMs: 0,
          testCount: 0,
          rulesMs: 11.5,
        }),
      ]);
    });
  });

  describe('backward compat', () => {
    it('EDGE: {file without stats field} => skips entry', () => {
      const entry = buildEslintResult({
        filePath: 'src/index.ts',
      });

      const result = eslintStatsParseTransformer({ eslintResults: [entry] });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {mix of files with and without stats} => returns only files with stats', () => {
      const entryWithStats = buildEslintResult({
        filePath: 'src/a.ts',
        stats: { times: { passes: [{ total: 10.0 }] } },
      });
      const entryWithout = buildEslintResult({
        filePath: 'src/b.ts',
      });

      const result = eslintStatsParseTransformer({ eslintResults: [entryWithStats, entryWithout] });

      expect(result).toStrictEqual([
        FileTimingStub({
          filePath: 'src/a.ts',
          durationMs: 10.0,
          testMs: 0,
          slowestTestMs: 0,
          testCount: 0,
        }),
      ]);
    });
  });

  describe('empty input', () => {
    it('EDGE: {empty array} => returns empty array', () => {
      const result = eslintStatsParseTransformer({ eslintResults: [] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('malformed entries', () => {
    it('EDGE: {null entry} => skips entry', () => {
      const result = eslintStatsParseTransformer({ eslintResults: [null] });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {entry missing filePath} => skips entry', () => {
      const entry = buildEslintResult({
        stats: { times: { passes: [{ total: 5.0 }] } },
      });

      const result = eslintStatsParseTransformer({ eslintResults: [entry] });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {stats with missing times} => skips entry', () => {
      const entry = buildEslintResult({
        filePath: 'src/index.ts',
        stats: {},
      });

      const result = eslintStatsParseTransformer({ eslintResults: [entry] });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {passes with non-numeric total} => skips that pass', () => {
      const entry = buildEslintResult({
        filePath: 'src/index.ts',
        stats: {
          times: {
            passes: [{ total: 'not-a-number' }, { total: 5.0 }],
          },
        },
      });

      const result = eslintStatsParseTransformer({ eslintResults: [entry] });

      expect(result).toStrictEqual([
        FileTimingStub({
          filePath: 'src/index.ts',
          durationMs: 5.0,
          testMs: 0,
          slowestTestMs: 0,
          testCount: 0,
        }),
      ]);
    });
  });
});

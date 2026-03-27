import { FileTimingStub } from '../../contracts/file-timing/file-timing.stub';

import { eslintStatsParseTransformer } from './eslint-stats-parse-transformer';

const buildEslintResult = ({
  filePath,
  stats,
  ...rest
}: {
  filePath?: string;
  stats?: { times?: { passes?: { total: number | string }[] } };
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
        FileTimingStub({ filePath: 'src/index.ts', durationMs: 13.7 }),
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
        FileTimingStub({ filePath: 'src/a.ts', durationMs: 5.0 }),
        FileTimingStub({ filePath: 'src/b.ts', durationMs: 5.0 }),
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

      expect(result).toStrictEqual([FileTimingStub({ filePath: 'src/a.ts', durationMs: 10.0 })]);
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

      expect(result).toStrictEqual([FileTimingStub({ filePath: 'src/index.ts', durationMs: 5.0 })]);
    });
  });
});

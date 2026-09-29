import { ErrorMessageStub } from '@dungeonmaster/shared/contracts';

import { eslintStatsStripTransformer } from './eslint-stats-strip-transformer';

describe('eslintStatsStripTransformer', () => {
  describe('entries carrying stats', () => {
    it('VALID: {two entries with stats and usedDeprecatedRules} => keeps every other key, in order', () => {
      const output = ErrorMessageStub({
        value: JSON.stringify([
          {
            filePath: '/p/a.ts',
            messages: [{ ruleId: 'no-console', severity: 2, message: 'No console', line: 3 }],
            errorCount: 1,
            stats: { times: { passes: [{ parse: { total: 2.5 }, rules: {} }] } },
            usedDeprecatedRules: [],
          },
          { filePath: '/p/b.ts', messages: [], errorCount: 0, stats: { times: { passes: [] } } },
        ]),
      });

      const result = eslintStatsStripTransformer({ output });

      expect(result).toBe(
        '[{"filePath":"/p/a.ts","messages":[{"ruleId":"no-console","severity":2,"message":"No console","line":3}],"errorCount":1},{"filePath":"/p/b.ts","messages":[],"errorCount":0}]',
      );
    });

    it('VALID: {text before and after the array} => rewrites only the array', () => {
      const output = ErrorMessageStub({
        value: 'warn: slow\n[{"filePath":"a.ts","messages":[],"stats":{"times":{}}}]\ntrailing',
      });

      const result = eslintStatsStripTransformer({ output });

      expect(result).toBe('warn: slow\n[{"filePath":"a.ts","messages":[]}]\ntrailing');
    });

    it('VALID: {non-object entry beside an object with stats} => keeps the non-object entry', () => {
      const output = ErrorMessageStub({ value: '[7,{"filePath":"a.ts","stats":{}}]' });

      const result = eslintStatsStripTransformer({ output });

      expect(result).toBe('[7,{"filePath":"a.ts"}]');
    });
  });

  describe('output left unchanged', () => {
    it('EMPTY: {empty output} => returns empty output', () => {
      const output = ErrorMessageStub({ value: '' });

      const result = eslintStatsStripTransformer({ output });

      expect(result).toBe('');
    });

    it('VALID: {entries with no stats} => returns the exact original text, whitespace included', () => {
      const output = ErrorMessageStub({ value: '[ {"filePath": "a.ts", "messages": []} ]' });

      const result = eslintStatsStripTransformer({ output });

      expect(result).toBe('[ {"filePath": "a.ts", "messages": []} ]');
    });

    it('EDGE: {non-JSON text} => returns the text unchanged', () => {
      const output = ErrorMessageStub({ value: 'Oops! Something went wrong! See above.' });

      const result = eslintStatsStripTransformer({ output });

      expect(result).toBe('Oops! Something went wrong! See above.');
    });

    it('EDGE: {bracket text that is not JSON} => returns the text unchanged', () => {
      const output = ErrorMessageStub({ value: '[not json] stats' });

      const result = eslintStatsStripTransformer({ output });

      expect(result).toBe('[not json] stats');
    });

    it('EDGE: {truncated array} => returns the text unchanged', () => {
      const output = ErrorMessageStub({ value: '[{"filePath":"a.ts","stats":{}},' });

      const result = eslintStatsStripTransformer({ output });

      expect(result).toBe('[{"filePath":"a.ts","stats":{}},');
    });
  });
});

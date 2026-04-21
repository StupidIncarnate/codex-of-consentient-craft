import { ErrorMessageStub } from '@dungeonmaster/shared/contracts';

import { jestJsonParsePassingTransformer } from './jest-json-parse-passing-transformer';

describe('jestJsonParsePassingTransformer', () => {
  describe('valid inputs', () => {
    it('VALID: {jest output with passed assertion results} => returns PassingTest[] entries with durations', () => {
      const jsonOutput = ErrorMessageStub({
        value: JSON.stringify({
          testResults: [
            {
              name: 'src/a.test.ts',
              assertionResults: [
                { status: 'passed', fullName: 'VALID: {a} => b', duration: 15 },
                { status: 'passed', fullName: 'VALID: {c} => d', duration: 7 },
              ],
            },
          ],
        }),
      });

      const result = jestJsonParsePassingTransformer({ jsonOutput });

      expect(result).toStrictEqual([
        { suitePath: 'src/a.test.ts', testName: 'VALID: {a} => b', durationMs: 15 },
        { suitePath: 'src/a.test.ts', testName: 'VALID: {c} => d', durationMs: 7 },
      ]);
    });

    it('VALID: {mix of passed and failed tests} => only returns passed entries', () => {
      const jsonOutput = ErrorMessageStub({
        value: JSON.stringify({
          testResults: [
            {
              name: 'src/app.test.ts',
              assertionResults: [
                { status: 'passed', fullName: 'VALID: ok', duration: 5 },
                {
                  status: 'failed',
                  fullName: 'INVALID: bad',
                  duration: 12,
                  failureMessages: ['boom'],
                },
              ],
            },
          ],
        }),
      });

      const result = jestJsonParsePassingTransformer({ jsonOutput });

      expect(result).toStrictEqual([
        { suitePath: 'src/app.test.ts', testName: 'VALID: ok', durationMs: 5 },
      ]);
    });

    it('VALID: {passed test without duration} => defaults durationMs to 0', () => {
      const jsonOutput = ErrorMessageStub({
        value: JSON.stringify({
          testResults: [
            {
              name: 'src/app.test.ts',
              assertionResults: [{ status: 'passed', fullName: 'VALID: {x} => y' }],
            },
          ],
        }),
      });

      const result = jestJsonParsePassingTransformer({ jsonOutput });

      expect(result).toStrictEqual([
        { suitePath: 'src/app.test.ts', testName: 'VALID: {x} => y', durationMs: 0 },
      ]);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {no testResults} => returns empty array', () => {
      const jsonOutput = ErrorMessageStub({ value: JSON.stringify({ testResults: [] }) });

      const result = jestJsonParsePassingTransformer({ jsonOutput });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {testResults is not an array} => returns empty array', () => {
      const jsonOutput = ErrorMessageStub({ value: JSON.stringify({ testResults: 'nope' }) });

      const result = jestJsonParsePassingTransformer({ jsonOutput });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {parsed value is not an object} => returns empty array', () => {
      const jsonOutput = ErrorMessageStub({ value: JSON.stringify(null) });

      const result = jestJsonParsePassingTransformer({ jsonOutput });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {suite missing name field} => skips suite', () => {
      const jsonOutput = ErrorMessageStub({
        value: JSON.stringify({
          testResults: [
            {
              assertionResults: [{ status: 'passed', fullName: 'VALID: ok', duration: 5 }],
            },
          ],
        }),
      });

      const result = jestJsonParsePassingTransformer({ jsonOutput });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {assertionResults missing} => skips suite', () => {
      const jsonOutput = ErrorMessageStub({
        value: JSON.stringify({ testResults: [{ name: 'src/a.test.ts' }] }),
      });

      const result = jestJsonParsePassingTransformer({ jsonOutput });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {assertion missing fullName} => skips entry', () => {
      const jsonOutput = ErrorMessageStub({
        value: JSON.stringify({
          testResults: [
            {
              name: 'src/a.test.ts',
              assertionResults: [{ status: 'passed' }],
            },
          ],
        }),
      });

      const result = jestJsonParsePassingTransformer({ jsonOutput });

      expect(result).toStrictEqual([]);
    });
  });
});

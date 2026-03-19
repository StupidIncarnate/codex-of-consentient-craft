import { ErrorMessageStub } from '@dungeonmaster/shared/contracts';

import { PlaywrightLineResultsStub } from '../../contracts/playwright-line-results/playwright-line-results.stub';
import { playwrightLineToResultsTransformer } from './playwright-line-to-results-transformer';

describe('playwrightLineToResultsTransformer', () => {
  describe('passed tests', () => {
    it('VALID: {output with checkmark lines} => extracts passed test titles', () => {
      const output = ErrorMessageStub({
        value: [
          'Running 2 tests using 1 worker',
          '  \u2713 chat-smoke.spec.ts:25:7 \u203A Chat Smoke \u203A sends message (3.2s)',
          '  \u2713 guild-creation.spec.ts:10:7 \u203A Guild Creation \u203A creates guild (1.1s)',
          '  2 passed (4.3s)',
        ].join('\n'),
      });

      const result = playwrightLineToResultsTransformer({ output });

      expect(result).toStrictEqual(
        PlaywrightLineResultsStub({
          passed: [
            'chat-smoke.spec.ts:25:7 \u203A Chat Smoke \u203A sends message (3.2s)',
            'guild-creation.spec.ts:10:7 \u203A Guild Creation \u203A creates guild (1.1s)',
          ],
          failed: [],
          total: 2,
        }),
      );
    });
  });

  describe('failed tests', () => {
    it('VALID: {output with cross mark lines} => extracts failed test titles', () => {
      const output = ErrorMessageStub({
        value: [
          'Running 1 test using 1 worker',
          '  \u00d7 quest-approve.spec.ts:70:7 \u203A Quest Approve \u203A clicks button (30.0s)',
          '  1 failed',
        ].join('\n'),
      });

      const result = playwrightLineToResultsTransformer({ output });

      expect(result).toStrictEqual(
        PlaywrightLineResultsStub({
          passed: [],
          failed: ['quest-approve.spec.ts:70:7 \u203A Quest Approve \u203A clicks button (30.0s)'],
          total: 1,
        }),
      );
    });
  });

  describe('mixed results', () => {
    it('VALID: {output with both passed and failed} => extracts both', () => {
      const output = ErrorMessageStub({
        value: [
          'Running 3 tests using 1 worker',
          '  \u2713 chat-smoke.spec.ts:25:7 \u203A Chat Smoke \u203A sends message (3.2s)',
          '  \u00d7 quest-approve.spec.ts:70:7 \u203A Quest Approve \u203A clicks button (30.0s)',
          '  \u2713 guild-creation.spec.ts:10:7 \u203A Guild Creation \u203A creates guild (1.1s)',
          '  2 passed, 1 failed',
        ].join('\n'),
      });

      const result = playwrightLineToResultsTransformer({ output });

      expect(result).toStrictEqual(
        PlaywrightLineResultsStub({
          passed: [
            'chat-smoke.spec.ts:25:7 \u203A Chat Smoke \u203A sends message (3.2s)',
            'guild-creation.spec.ts:10:7 \u203A Guild Creation \u203A creates guild (1.1s)',
          ],
          failed: ['quest-approve.spec.ts:70:7 \u203A Quest Approve \u203A clicks button (30.0s)'],
          total: 3,
        }),
      );
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {empty output} => returns empty results', () => {
      const output = ErrorMessageStub({ value: '' });

      const result = playwrightLineToResultsTransformer({ output });

      expect(result).toStrictEqual(PlaywrightLineResultsStub());
    });

    it('EDGE: {output with no test result lines} => returns empty results', () => {
      const output = ErrorMessageStub({
        value: [
          'Running 0 tests using 0 workers',
          'Error: http://localhost:5737 is already used',
        ].join('\n'),
      });

      const result = playwrightLineToResultsTransformer({ output });

      expect(result).toStrictEqual(PlaywrightLineResultsStub());
    });

    it('EDGE: {output with numbered pass lines} => extracts titles', () => {
      const output = ErrorMessageStub({
        value: '  1 \u2713 chat-smoke.spec.ts:25:7 \u203A Chat Smoke \u203A test (1.0s)\n',
      });

      const result = playwrightLineToResultsTransformer({ output });

      expect(result).toStrictEqual(
        PlaywrightLineResultsStub({
          passed: ['chat-smoke.spec.ts:25:7 \u203A Chat Smoke \u203A test (1.0s)'],
          total: 1,
        }),
      );
    });
  });
});

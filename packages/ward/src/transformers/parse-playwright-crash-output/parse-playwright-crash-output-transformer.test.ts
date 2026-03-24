import { ErrorMessageStub } from '@dungeonmaster/shared/contracts';

import { TestFailureStub } from '../../contracts/test-failure/test-failure.stub';
import { parsePlaywrightCrashOutputTransformer } from './parse-playwright-crash-output-transformer';

describe('parsePlaywrightCrashOutputTransformer', () => {
  describe('no failures', () => {
    it('EMPTY: {output: only progress lines} => returns empty array', () => {
      const output = ErrorMessageStub({
        value: [
          'Running 5 tests using 1 worker',
          '',
          '[1/5] [chromium] › e2e/web/smoke.spec.ts:20:7 › Smoke › loads page',
          '[2/5] [chromium] › e2e/web/smoke.spec.ts:30:7 › Smoke › clicks button',
        ].join('\n'),
      });

      const result = parsePlaywrightCrashOutputTransformer({ output });

      expect(result).toStrictEqual([]);
    });
  });

  describe('single failure', () => {
    it('VALID: {output: one numbered failure with error and stack} => returns one TestFailure with message and stackTrace', () => {
      const output = ErrorMessageStub({
        value: [
          '[1/3] [chromium] › e2e/web/smoke.spec.ts:20:7 › Smoke › loads page',
          '[2/3] [chromium] › e2e/web/quest.spec.ts:10:7 › Quest › starts quest',
          '[3/3] [chromium] › e2e/web/quest.spec.ts:10:7 › Quest › starts quest (retry #1)',
          '  1) [chromium] › e2e/web/quest.spec.ts:10:7 › Quest › starts quest ',
          '',
          '    Test timeout of 10000ms exceeded.',
          '',
          '    Error: page.waitForResponse: Test timeout of 10000ms exceeded.',
          '',
          '      85 |   sessionId: string;',
          '      86 | }): Promise<void> => {',
          '    > 87 |   const sessionResponsePromise = page.waitForResponse(',
          '         |                                       ^',
          '      88 |     (r) =>',
          '        at navigateToSession (/project/e2e/web/quest.spec.ts:87:39)',
          '        at /project/e2e/web/quest.spec.ts:10:11',
          '',
        ].join('\n'),
      });

      const result = parsePlaywrightCrashOutputTransformer({ output });

      expect(result).toStrictEqual([
        TestFailureStub({
          suitePath: 'e2e/web/quest.spec.ts',
          testName: 'Quest › starts quest',
          message: [
            'Error: page.waitForResponse: ',
            '85 |   sessionId: string;',
            '86 | }): Promise<void> => {',
            '> 87 |   const sessionResponsePromise = page.waitForResponse(',
            '|                                       ^',
            '88 |     (r) =>',
          ].join('\n'),
          stackTrace: [
            'at navigateToSession (/project/e2e/web/quest.spec.ts:87:39)',
            'at /project/e2e/web/quest.spec.ts:10:11',
          ].join('\n'),
        }),
      ]);
    });
  });

  describe('multiple failures', () => {
    it('VALID: {output: two numbered failures} => returns two TestFailure entries', () => {
      const output = ErrorMessageStub({
        value: [
          '  1) [chromium] › e2e/web/alpha.spec.ts:10:7 › Alpha › test one ',
          '',
          '    Expected: true',
          '    Received: false',
          '        at Object.<anonymous> (/project/e2e/web/alpha.spec.ts:15:20)',
          '',
          '  2) [chromium] › e2e/web/beta.spec.ts:20:7 › Beta › test two ',
          '',
          '    Timeout of 5000ms exceeded.',
          '        at /project/e2e/web/beta.spec.ts:25:10',
          '',
        ].join('\n'),
      });

      const result = parsePlaywrightCrashOutputTransformer({ output });

      expect(result).toStrictEqual([
        TestFailureStub({
          suitePath: 'e2e/web/alpha.spec.ts',
          testName: 'Alpha › test one',
          message: 'Expected: true\nReceived: false',
          stackTrace: 'at Object.<anonymous> (/project/e2e/web/alpha.spec.ts:15:20)',
        }),
        TestFailureStub({
          suitePath: 'e2e/web/beta.spec.ts',
          testName: 'Beta › test two',
          message: 'Timeout of 5000ms exceeded.',
          stackTrace: 'at /project/e2e/web/beta.spec.ts:25:10',
        }),
      ]);
    });
  });

  describe('filters noise', () => {
    it('VALID: {output: failure with WebServer lines and attachments} => strips noise from error block', () => {
      const output = ErrorMessageStub({
        value: [
          '  1) [chromium] › e2e/web/quest.spec.ts:10:7 › Quest › fails ',
          '',
          '    Error: element not found',
          '        at /project/e2e/web/quest.spec.ts:15:5',
          '',
          '    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────',
          '    test-results/quest-chromium/test-failed-1.png',
          '    ────────────────────────────────────────────────────────────────────────────────────────────────',
          '',
          '    Error Context: test-results/quest-chromium/error-context.md',
          '',
          '    Retry #1 ───────────────────────────────────────────────────────────────────────────────────',
          '',
          '    Error: element not found (retry)',
          '        at /project/e2e/web/quest.spec.ts:15:5',
          '',
          '[WebServer] some debug output',
          '[WebServer] more debug output',
          '',
        ].join('\n'),
      });

      const result = parsePlaywrightCrashOutputTransformer({ output });

      expect(result).toStrictEqual([
        TestFailureStub({
          suitePath: 'e2e/web/quest.spec.ts',
          testName: 'Quest › fails',
          message: 'Error: element not found',
          stackTrace: 'at /project/e2e/web/quest.spec.ts:15:5',
        }),
      ]);
    });
  });

  describe('ansi codes', () => {
    it('VALID: {output: failure with ANSI escape codes} => strips ANSI before parsing', () => {
      const output = ErrorMessageStub({
        value: [
          '  1) \x1b[31m[chromium]\x1b[0m › e2e/web/smoke.spec.ts:5:7 › Smoke › red test ',
          '',
          '    \x1b[1mAssertion failed\x1b[0m',
          '',
        ].join('\n'),
      });

      const result = parsePlaywrightCrashOutputTransformer({ output });

      expect(result).toStrictEqual([
        TestFailureStub({
          suitePath: 'e2e/web/smoke.spec.ts',
          testName: 'Smoke › red test',
          message: 'Assertion failed',
        }),
      ]);
    });
  });
});

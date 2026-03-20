import { ErrorMessageStub } from '@dungeonmaster/shared/contracts';

import { extractPlaywrightLineFilesTransformer } from './extract-playwright-line-files-transformer';

describe('extractPlaywrightLineFilesTransformer', () => {
  describe('line reporter output', () => {
    it('VALID: {single test line} => returns one file path', () => {
      const output = ErrorMessageStub({
        value: '[1/5] [chromium] › e2e/web/smoke.spec.ts:20:7 › Smoke › test name',
      });

      const result = extractPlaywrightLineFilesTransformer({ output });

      expect(result).toStrictEqual(['e2e/web/smoke.spec.ts']);
    });

    it('VALID: {multiple tests from same file} => returns one unique path', () => {
      const output = ErrorMessageStub({
        value: [
          '[1/5] [chromium] › e2e/web/smoke.spec.ts:20:7 › Smoke › test one',
          '[2/5] [chromium] › e2e/web/smoke.spec.ts:30:7 › Smoke › test two',
        ].join('\n'),
      });

      const result = extractPlaywrightLineFilesTransformer({ output });

      expect(result).toStrictEqual(['e2e/web/smoke.spec.ts']);
    });

    it('VALID: {multiple files} => returns all unique paths', () => {
      const output = ErrorMessageStub({
        value: [
          '[1/3] [chromium] › e2e/web/smoke.spec.ts:20:7 › Smoke › test',
          '[2/3] [chromium] › e2e/web/chat-features.spec.ts:29:7 › Chat › test',
          '[3/3] [chromium] › e2e/web/guild-creation.spec.ts:6:7 › Guild › test',
        ].join('\n'),
      });

      const result = extractPlaywrightLineFilesTransformer({ output });

      expect(result).toStrictEqual([
        'e2e/web/smoke.spec.ts',
        'e2e/web/chat-features.spec.ts',
        'e2e/web/guild-creation.spec.ts',
      ]);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {no test lines} => returns empty array', () => {
      const output = ErrorMessageStub({
        value: 'Running 0 tests using 1 worker',
      });

      const result = extractPlaywrightLineFilesTransformer({ output });

      expect(result).toStrictEqual([]);
    });
  });
});

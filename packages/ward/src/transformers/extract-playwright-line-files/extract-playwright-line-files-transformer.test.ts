import { ErrorMessageStub } from '@dungeonmaster/shared/contracts';

import { extractPlaywrightLineFilesTransformer } from './extract-playwright-line-files-transformer';

describe('extractPlaywrightLineFilesTransformer', () => {
  describe('line reporter output', () => {
    it('VALID: {single test line} => returns one file path', () => {
      const output = ErrorMessageStub({
        value:
          '[1/5] [chromium] › packages/web/src/flows/app/smoke.e2e.ts:20:7 › Smoke › test name',
      });

      const result = extractPlaywrightLineFilesTransformer({ output });

      expect(result).toStrictEqual(['packages/web/src/flows/app/smoke.e2e.ts']);
    });

    it('VALID: {multiple tests from same file} => returns one unique path', () => {
      const output = ErrorMessageStub({
        value: [
          '[1/5] [chromium] › packages/web/src/flows/app/smoke.e2e.ts:20:7 › Smoke › test one',
          '[2/5] [chromium] › packages/web/src/flows/app/smoke.e2e.ts:30:7 › Smoke › test two',
        ].join('\n'),
      });

      const result = extractPlaywrightLineFilesTransformer({ output });

      expect(result).toStrictEqual(['packages/web/src/flows/app/smoke.e2e.ts']);
    });

    it('VALID: {multiple files} => returns all unique paths', () => {
      const output = ErrorMessageStub({
        value: [
          '[1/3] [chromium] › packages/web/src/flows/app/smoke.e2e.ts:20:7 › Smoke › test',
          '[2/3] [chromium] › packages/web/src/flows/quest-chat/chat-features.e2e.ts:29:7 › Chat › test',
          '[3/3] [chromium] › packages/web/src/flows/home/guild-creation.e2e.ts:6:7 › Guild › test',
        ].join('\n'),
      });

      const result = extractPlaywrightLineFilesTransformer({ output });

      expect(result).toStrictEqual([
        'packages/web/src/flows/app/smoke.e2e.ts',
        'packages/web/src/flows/quest-chat/chat-features.e2e.ts',
        'packages/web/src/flows/home/guild-creation.e2e.ts',
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

import { FileContentsStub } from '@dungeonmaster/shared/contracts';

import { parseBatchFileTransformer } from './parse-batch-file-transformer';

describe('parseBatchFileTransformer', () => {
  describe('valid batch file', () => {
    it('VALID: {batch with filePaths and errors} => returns parsed arrays', () => {
      const contents = FileContentsStub({
        value: JSON.stringify({
          filePaths: ['/src/app.ts'],
          errors: ['line 10: Unexpected any'],
        }),
      });

      const result = parseBatchFileTransformer({ contents });

      expect(result).toStrictEqual({
        filePaths: ['/src/app.ts'],
        errors: ['line 10: Unexpected any'],
      });
    });

    it('VALID: {batch with multiple files} => returns all file paths and errors', () => {
      const contents = FileContentsStub({
        value: JSON.stringify({
          filePaths: ['/src/a.ts', '/src/b.ts'],
          errors: ['error a', 'error b'],
        }),
      });

      const result = parseBatchFileTransformer({ contents });

      expect(result).toStrictEqual({
        filePaths: ['/src/a.ts', '/src/b.ts'],
        errors: ['error a', 'error b'],
      });
    });
  });

  describe('empty batch file', () => {
    it('VALID: {batch with empty arrays} => returns empty arrays', () => {
      const contents = FileContentsStub({
        value: JSON.stringify({ filePaths: [], errors: [] }),
      });

      const result = parseBatchFileTransformer({ contents });

      expect(result).toStrictEqual({ filePaths: [], errors: [] });
    });
  });

  describe('invalid content', () => {
    it('EDGE: {non-object JSON} => returns empty arrays', () => {
      const contents = FileContentsStub({ value: '"just a string"' });

      const result = parseBatchFileTransformer({ contents });

      expect(result).toStrictEqual({ filePaths: [], errors: [] });
    });
  });
});

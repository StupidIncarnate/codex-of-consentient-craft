import { AbsoluteFilePathStub, ErrorMessageStub } from '@dungeonmaster/shared/contracts';

import { filePathsToSpiritmenderWorkUnitsTransformer } from './file-paths-to-spiritmender-work-units-transformer';

describe('filePathsToSpiritmenderWorkUnitsTransformer', () => {
  describe('single file path', () => {
    it('VALID: {one file path, no errors} => returns one work unit with empty errors', () => {
      const filePaths = [AbsoluteFilePathStub({ value: '/src/file.ts' })];

      const result = filePathsToSpiritmenderWorkUnitsTransformer({
        filePaths,
        errors: [],
      });

      expect(result).toStrictEqual([
        {
          role: 'spiritmender',
          filePaths: ['/src/file.ts'],
          errors: [],
        },
      ]);
    });

    it('VALID: {one file path, with errors} => returns one work unit with error messages', () => {
      const filePaths = [AbsoluteFilePathStub({ value: '/src/file.ts' })];
      const errors = [ErrorMessageStub({ value: 'Lint error: missing return type' })];

      const result = filePathsToSpiritmenderWorkUnitsTransformer({
        filePaths,
        errors,
      });

      expect(result).toStrictEqual([
        {
          role: 'spiritmender',
          filePaths: ['/src/file.ts'],
          errors: ['Lint error: missing return type'],
        },
      ]);
    });
  });

  describe('multiple file paths', () => {
    it('VALID: {multiple file paths} => returns one work unit per file', () => {
      const filePaths = [
        AbsoluteFilePathStub({ value: '/src/broker.ts' }),
        AbsoluteFilePathStub({ value: '/src/contract.ts' }),
      ];

      const result = filePathsToSpiritmenderWorkUnitsTransformer({
        filePaths,
        errors: [],
      });

      expect(result).toStrictEqual([
        {
          role: 'spiritmender',
          filePaths: ['/src/broker.ts'],
          errors: [],
        },
        {
          role: 'spiritmender',
          filePaths: ['/src/contract.ts'],
          errors: [],
        },
      ]);
    });
  });

  describe('multiple errors', () => {
    it('VALID: {one file path, multiple errors} => joins errors with newline into single ErrorMessage', () => {
      const filePaths = [AbsoluteFilePathStub({ value: '/src/broken.ts' })];
      const errors = [
        ErrorMessageStub({ value: 'Missing return type on line 5' }),
        ErrorMessageStub({ value: 'Unused variable on line 12' }),
      ];

      const result = filePathsToSpiritmenderWorkUnitsTransformer({
        filePaths,
        errors,
      });

      expect(result).toStrictEqual([
        {
          role: 'spiritmender',
          filePaths: ['/src/broken.ts'],
          errors: ['Missing return type on line 5\nUnused variable on line 12'],
        },
      ]);
    });

    it('VALID: {multiple files, multiple errors} => each work unit gets the same joined error string', () => {
      const filePaths = [
        AbsoluteFilePathStub({ value: '/src/broker.ts' }),
        AbsoluteFilePathStub({ value: '/src/guard.ts' }),
      ];
      const errors = [
        ErrorMessageStub({ value: 'Type error in broker' }),
        ErrorMessageStub({ value: 'Missing export in guard' }),
      ];

      const result = filePathsToSpiritmenderWorkUnitsTransformer({
        filePaths,
        errors,
      });

      expect(result).toStrictEqual([
        {
          role: 'spiritmender',
          filePaths: ['/src/broker.ts'],
          errors: ['Type error in broker\nMissing export in guard'],
        },
        {
          role: 'spiritmender',
          filePaths: ['/src/guard.ts'],
          errors: ['Type error in broker\nMissing export in guard'],
        },
      ]);
    });
  });

  describe('empty file paths', () => {
    it('EMPTY: {no file paths} => returns empty array', () => {
      const result = filePathsToSpiritmenderWorkUnitsTransformer({
        filePaths: [],
        errors: [],
      });

      expect(result).toStrictEqual([]);
    });
  });
});

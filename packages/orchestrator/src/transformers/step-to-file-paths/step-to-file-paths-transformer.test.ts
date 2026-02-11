import { DependencyStepStub } from '@dungeonmaster/shared/contracts';

import { stepToFilePathsTransformer } from './step-to-file-paths-transformer';

describe('stepToFilePathsTransformer', () => {
  describe('basic combination', () => {
    it('VALID: {step with filesToCreate and filesToModify} => returns combined array', () => {
      const step = DependencyStepStub({
        filesToCreate: ['src/new-file.ts', 'src/new-file.test.ts'],
        filesToModify: ['src/existing.ts'],
      });

      const result = stepToFilePathsTransformer({ step });

      expect(result).toStrictEqual(['src/new-file.ts', 'src/new-file.test.ts', 'src/existing.ts']);
    });
  });

  describe('deduplication', () => {
    it('VALID: {step with overlapping paths} => returns deduplicated array preserving order', () => {
      const step = DependencyStepStub({
        filesToCreate: ['src/file-a.ts', 'src/file-b.ts'],
        filesToModify: ['src/file-b.ts', 'src/file-c.ts'],
      });

      const result = stepToFilePathsTransformer({ step });

      expect(result).toStrictEqual(['src/file-a.ts', 'src/file-b.ts', 'src/file-c.ts']);
    });
  });

  describe('empty arrays', () => {
    it('EMPTY: {step with no files} => returns empty array', () => {
      const step = DependencyStepStub({
        filesToCreate: [],
        filesToModify: [],
      });

      const result = stepToFilePathsTransformer({ step });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {step with only filesToCreate} => returns filesToCreate only', () => {
      const step = DependencyStepStub({
        filesToCreate: ['src/new.ts'],
        filesToModify: [],
      });

      const result = stepToFilePathsTransformer({ step });

      expect(result).toStrictEqual(['src/new.ts']);
    });

    it('VALID: {step with only filesToModify} => returns filesToModify only', () => {
      const step = DependencyStepStub({
        filesToCreate: [],
        filesToModify: ['src/existing.ts'],
      });

      const result = stepToFilePathsTransformer({ step });

      expect(result).toStrictEqual(['src/existing.ts']);
    });
  });
});

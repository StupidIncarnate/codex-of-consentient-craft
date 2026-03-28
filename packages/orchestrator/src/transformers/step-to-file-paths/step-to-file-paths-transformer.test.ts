import { DependencyStepStub } from '@dungeonmaster/shared/contracts';

import { stepToFilePathsTransformer } from './step-to-file-paths-transformer';

describe('stepToFilePathsTransformer', () => {
  describe('basic combination', () => {
    it('VALID: {step with focusFile and accompanyingFiles} => returns combined array', () => {
      const step = DependencyStepStub({
        focusFile: { path: 'src/new-file.ts' },
        accompanyingFiles: [{ path: 'src/new-file.test.ts' }, { path: 'src/existing.ts' }],
      });

      const result = stepToFilePathsTransformer({ step });

      expect(result).toStrictEqual(['src/new-file.ts', 'src/new-file.test.ts', 'src/existing.ts']);
    });
  });

  describe('deduplication', () => {
    it('VALID: {step with overlapping paths in accompanyingFiles} => returns deduplicated array preserving order', () => {
      const step = DependencyStepStub({
        focusFile: { path: 'src/file-a.ts' },
        accompanyingFiles: [{ path: 'src/file-b.ts' }, { path: 'src/file-a.ts' }],
      });

      const result = stepToFilePathsTransformer({ step });

      expect(result).toStrictEqual(['src/file-a.ts', 'src/file-b.ts']);
    });
  });

  describe('no accompanying files', () => {
    it('VALID: {step with focusFile only} => returns focusFile path only', () => {
      const step = DependencyStepStub({
        focusFile: { path: 'src/new.ts' },
        accompanyingFiles: [],
      });

      const result = stepToFilePathsTransformer({ step });

      expect(result).toStrictEqual(['src/new.ts']);
    });
  });
});

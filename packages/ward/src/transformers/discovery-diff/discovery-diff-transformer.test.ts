import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { GitRelativePathStub } from '../../contracts/git-relative-path/git-relative-path.stub';

import { discoveryDiffTransformer } from './discovery-diff-transformer';

describe('discoveryDiffTransformer', () => {
  describe('no diff', () => {
    it('VALID: {same files in both lists} => returns empty arrays', () => {
      const result = discoveryDiffTransformer({
        discoveredFiles: [
          GitRelativePathStub({ value: 'src/a.ts' }),
          GitRelativePathStub({ value: 'src/b.ts' }),
        ],
        processedFiles: [
          GitRelativePathStub({ value: 'src/a.ts' }),
          GitRelativePathStub({ value: 'src/b.ts' }),
        ],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        onlyDiscovered: [],
        onlyProcessed: [],
      });
    });
  });

  describe('only discovered', () => {
    it('VALID: {discovered has extra file} => returns it in onlyDiscovered', () => {
      const result = discoveryDiffTransformer({
        discoveredFiles: [
          GitRelativePathStub({ value: 'src/a.ts' }),
          GitRelativePathStub({ value: 'src/b.ts' }),
          GitRelativePathStub({ value: 'src/c.ts' }),
        ],
        processedFiles: [
          GitRelativePathStub({ value: 'src/a.ts' }),
          GitRelativePathStub({ value: 'src/b.ts' }),
        ],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        onlyDiscovered: ['src/c.ts'],
        onlyProcessed: [],
      });
    });
  });

  describe('only processed', () => {
    it('VALID: {processed has extra file} => returns it in onlyProcessed', () => {
      const result = discoveryDiffTransformer({
        discoveredFiles: [GitRelativePathStub({ value: 'src/a.ts' })],
        processedFiles: [
          GitRelativePathStub({ value: 'src/a.ts' }),
          GitRelativePathStub({ value: '@types/error-cause.d.ts' }),
        ],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        onlyDiscovered: [],
        onlyProcessed: ['@types/error-cause.d.ts'],
      });
    });
  });

  describe('absolute path normalization', () => {
    it('VALID: {processed files have absolute paths} => normalizes to relative before comparing', () => {
      const result = discoveryDiffTransformer({
        discoveredFiles: [
          GitRelativePathStub({ value: 'src/a.ts' }),
          GitRelativePathStub({ value: 'src/b.ts' }),
        ],
        processedFiles: [
          GitRelativePathStub({ value: '/project/src/a.ts' }),
          GitRelativePathStub({ value: '/project/src/b.ts' }),
        ],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        onlyDiscovered: [],
        onlyProcessed: [],
      });
    });
  });

  describe('both directions', () => {
    it('VALID: {both have unique files} => returns diffs in both arrays', () => {
      const result = discoveryDiffTransformer({
        discoveredFiles: [
          GitRelativePathStub({ value: 'src/a.ts' }),
          GitRelativePathStub({ value: 'src/only-discovered.ts' }),
        ],
        processedFiles: [
          GitRelativePathStub({ value: 'src/a.ts' }),
          GitRelativePathStub({ value: 'src/only-processed.ts' }),
        ],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        onlyDiscovered: ['src/only-discovered.ts'],
        onlyProcessed: ['src/only-processed.ts'],
      });
    });
  });

  describe('empty lists', () => {
    it('VALID: {both lists empty} => returns empty arrays', () => {
      const result = discoveryDiffTransformer({
        discoveredFiles: [],
        processedFiles: [],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        onlyDiscovered: [],
        onlyProcessed: [],
      });
    });
  });
});

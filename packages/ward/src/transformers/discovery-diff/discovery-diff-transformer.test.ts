

import { discoveryDiffTransformer } from './discovery-diff-transformer';

describe('discoveryDiffTransformer', () => {
  describe('no diff', () => {
    it('VALID: {same files in both lists} => returns empty arrays', () => {
      const result = discoveryDiffTransformer({
        discoveredFiles: [
          'src/a.ts',
          'src/b.ts',
        ],
        processedFiles: [
          'src/a.ts',
          'src/b.ts',
        ],
        cwd: '/project',
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
          'src/a.ts',
          'src/b.ts',
          'src/c.ts',
        ],
        processedFiles: [
          'src/a.ts',
          'src/b.ts',
        ],
        cwd: '/project',
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
        discoveredFiles: ['src/a.ts'],
        processedFiles: [
          'src/a.ts',
          '@types/error-cause.d.ts',
        ],
        cwd: '/project',
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
          'src/a.ts',
          'src/b.ts',
        ],
        processedFiles: [
          '/project/src/a.ts',
          '/project/src/b.ts',
        ],
        cwd: '/project',
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
          'src/a.ts',
          'src/only-discovered.ts',
        ],
        processedFiles: [
          'src/a.ts',
          'src/only-processed.ts',
        ],
        cwd: '/project',
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
        cwd: '/project',
      });

      expect(result).toStrictEqual({
        onlyDiscovered: [],
        onlyProcessed: [],
      });
    });
  });
});

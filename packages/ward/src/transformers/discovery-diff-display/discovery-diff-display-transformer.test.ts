import { GitRelativePathStub } from '../../contracts/git-relative-path/git-relative-path.stub';

import { discoveryDiffDisplayTransformer } from './discovery-diff-display-transformer';

describe('discoveryDiffDisplayTransformer', () => {
  describe('no mismatch', () => {
    it('VALID: {hasMismatch: false} => returns empty string', () => {
      const result = discoveryDiffDisplayTransformer({
        hasMismatch: false,
        onlyProcessed: [GitRelativePathStub({ value: 'a.ts' })],
        onlyDiscovered: [],
        maxDisplay: 10,
      });

      expect(result).toBe('');
    });
  });

  describe('only processed', () => {
    it('VALID: {onlyProcessed has files} => shows only processed section', () => {
      const result = discoveryDiffDisplayTransformer({
        hasMismatch: true,
        onlyProcessed: [GitRelativePathStub({ value: '@types/error-cause.d.ts' })],
        onlyDiscovered: [],
        maxDisplay: 10,
      });

      expect(result).toBe('\n  only processed: @types/error-cause.d.ts');
    });
  });

  describe('only discovered', () => {
    it('VALID: {onlyDiscovered has files} => shows only discovered section', () => {
      const result = discoveryDiffDisplayTransformer({
        hasMismatch: true,
        onlyProcessed: [],
        onlyDiscovered: [GitRelativePathStub({ value: 'src/orphan.ts' })],
        maxDisplay: 10,
      });

      expect(result).toBe('\n  only discovered: src/orphan.ts');
    });
  });

  describe('both categories', () => {
    it('VALID: {both lists have files} => shows both sections', () => {
      const result = discoveryDiffDisplayTransformer({
        hasMismatch: true,
        onlyProcessed: [GitRelativePathStub({ value: 'extra.ts' })],
        onlyDiscovered: [GitRelativePathStub({ value: 'missing.ts' })],
        maxDisplay: 10,
      });

      expect(result).toBe('\n  only processed: extra.ts\n  only discovered: missing.ts');
    });
  });

  describe('truncation', () => {
    it('VALID: {more files than maxDisplay} => truncates with count', () => {
      const files = Array.from({ length: 5 }, (_, i) =>
        GitRelativePathStub({ value: `file-${String(i)}.ts` }),
      );

      const result = discoveryDiffDisplayTransformer({
        hasMismatch: true,
        onlyProcessed: files,
        onlyDiscovered: [],
        maxDisplay: 3,
      });

      expect(result).toBe('\n  only processed: file-0.ts, file-1.ts, file-2.ts, ... and 2 more');
    });
  });

  describe('empty diff with mismatch', () => {
    it('EDGE: {hasMismatch true but both lists empty} => returns empty string', () => {
      const result = discoveryDiffDisplayTransformer({
        hasMismatch: true,
        onlyProcessed: [],
        onlyDiscovered: [],
        maxDisplay: 10,
      });

      expect(result).toBe('');
    });
  });
});

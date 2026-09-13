import { RunFiltersStub } from '../../contracts/run-filters/run-filters.stub';

import { isCallerFileScopeGuard } from './is-caller-file-scope-guard';

describe('isCallerFileScopeGuard', () => {
  describe('a caller-typed list of files', () => {
    it('VALID: {passthrough: one test file} => returns true', () => {
      const filters = RunFiltersStub({
        passthrough: ['packages/ward/src/transformers/a/a-transformer.test.ts'],
      });

      const result = isCallerFileScopeGuard({ filters });

      expect(result).toBe(true);
    });

    it('VALID: {passthrough: three files, mixed extensions} => returns true', () => {
      const filters = RunFiltersStub({
        passthrough: [
          'packages/web/src/widgets/a-widget.tsx',
          'packages/web/src/widgets/a-widget.test.tsx',
          'packages/ward/src/b.ts',
        ],
      });

      const result = isCallerFileScopeGuard({ filters });

      expect(result).toBe(true);
    });

    it('VALID: {passthrough: a file, only filter set} => returns true', () => {
      const filters = RunFiltersStub({
        only: ['unit'],
        passthrough: ['packages/ward/src/a.test.ts'],
      });

      const result = isCallerFileScopeGuard({ filters });

      expect(result).toBe(true);
    });
  });

  describe('a scope that named something wider than files', () => {
    // A DIRECTORY SCOPE ASKED FOR THE PACKAGE. Its failure count is bounded by nothing, and a file
    // it discovered and did not run is the answer rather than noise.
    it('INVALID: {passthrough: a package directory} => returns false', () => {
      const filters = RunFiltersStub({ passthrough: ['packages/ward'] });

      const result = isCallerFileScopeGuard({ filters });

      expect(result).toBe(false);
    });

    it('INVALID: {passthrough: one file and one directory} => returns false', () => {
      const filters = RunFiltersStub({
        passthrough: ['packages/ward/src/a.test.ts', 'packages/ward'],
      });

      const result = isCallerFileScopeGuard({ filters });

      expect(result).toBe(false);
    });
  });

  describe('a git-derived scope', () => {
    // `gitScopeLayerBroker` WRITES ITS DIFF INTO `passthrough`, so the field alone cannot say who
    // named the paths. A diff is unbounded, which is exactly what both callers must not assume away.
    it('INVALID: {uncommitted: true, passthrough: files} => returns false', () => {
      const filters = RunFiltersStub({
        uncommitted: true,
        passthrough: ['packages/ward/src/a.test.ts'],
      });

      const result = isCallerFileScopeGuard({ filters });

      expect(result).toBe(false);
    });

    it('INVALID: {committed: true, passthrough: files} => returns false', () => {
      const filters = RunFiltersStub({
        committed: true,
        passthrough: ['packages/ward/src/a.test.ts'],
      });

      const result = isCallerFileScopeGuard({ filters });

      expect(result).toBe(false);
    });
  });

  describe('no file scope at all', () => {
    it('EMPTY: {passthrough: []} => returns false', () => {
      const filters = RunFiltersStub({ passthrough: [] });

      const result = isCallerFileScopeGuard({ filters });

      expect(result).toBe(false);
    });

    it('EMPTY: {no passthrough field} => returns false', () => {
      const filters = RunFiltersStub({});

      const result = isCallerFileScopeGuard({ filters });

      expect(result).toBe(false);
    });

    it('EMPTY: {filters: undefined} => returns false', () => {
      const result = isCallerFileScopeGuard({});

      expect(result).toBe(false);
    });
  });
});

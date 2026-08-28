import { WardConfigStub } from '../../contracts/ward-config/ward-config.stub';
import { isExplicitPathScopeGuard } from './is-explicit-path-scope-guard';

describe('isExplicitPathScopeGuard', () => {
  describe('paths the caller typed', () => {
    it('VALID: {passthrough: ["scripts/build-workspaces.mjs"]} => returns true', () => {
      const config = WardConfigStub({ passthrough: ['scripts/build-workspaces.mjs'] });

      expect(isExplicitPathScopeGuard({ config })).toBe(true);
    });

    it('VALID: {only, passthrough together} => returns true', () => {
      const config = WardConfigStub({ only: ['lint'], passthrough: ['packages/ward/src/a.ts'] });

      expect(isExplicitPathScopeGuard({ config })).toBe(true);
    });
  });

  // THE WHOLE REASON THIS GUARD EXISTS. `commandRunLayerGitScopeBroker` writes the diff into the
  // same `passthrough` field, so a caller reading that field alone cannot tell a typed path from a
  // git-produced one — and a diff holding only `eslint.config.js` is an ordinary run, not a fault.
  describe('paths git produced', () => {
    it('VALID: {staged: true, passthrough written by the git scope layer} => returns false', () => {
      const config = WardConfigStub({ staged: true, passthrough: ['eslint.config.js'] });

      expect(isExplicitPathScopeGuard({ config })).toBe(false);
    });

    it('VALID: {changed: true, passthrough written by the git scope layer} => returns false', () => {
      const config = WardConfigStub({ changed: true, passthrough: ['README.md'] });

      expect(isExplicitPathScopeGuard({ config })).toBe(false);
    });

    it('VALID: {staged: true, diff resolved to nothing} => returns false', () => {
      const config = WardConfigStub({ staged: true });

      expect(isExplicitPathScopeGuard({ config })).toBe(false);
    });
  });

  // An empty list carries no path to report, and the empty-scope short-circuit stops that run before
  // any check reports anything — so this question, unlike `isFileScopeRequestedGuard`, says no.
  describe('a caller list that resolved to nothing', () => {
    it('EMPTY: {passthrough: []} => returns false', () => {
      const config = WardConfigStub({ passthrough: [] });

      expect(isExplicitPathScopeGuard({ config })).toBe(false);
    });
  });

  describe('no path scope at all', () => {
    it('VALID: {only: ["lint"]} => returns false', () => {
      const config = WardConfigStub({ only: ['lint'] });

      expect(isExplicitPathScopeGuard({ config })).toBe(false);
    });

    it('VALID: {onlyTests: "my specific test"} => returns false', () => {
      const config = WardConfigStub({ onlyTests: 'my specific test' });

      expect(isExplicitPathScopeGuard({ config })).toBe(false);
    });

    it('EDGE: {changed: false, staged: false} => returns false', () => {
      const config = WardConfigStub({ changed: false, staged: false });

      expect(isExplicitPathScopeGuard({ config })).toBe(false);
    });

    it('EMPTY: {} => returns false', () => {
      const config = WardConfigStub();

      expect(isExplicitPathScopeGuard({ config })).toBe(false);
    });

    it('EMPTY: {config omitted} => returns false', () => {
      expect(isExplicitPathScopeGuard({})).toBe(false);
    });
  });
});

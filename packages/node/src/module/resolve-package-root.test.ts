import { resolvePackageRoot } from './resolve-package-root';

describe('resolvePackageRoot', () => {
  it('VALID: {specifier: an installed workspace package subpath} => returns its real package root', () => {
    const result = resolvePackageRoot({ specifier: '@dungeonmaster/shared/contracts' });

    expect(result).toBe(
      '/home/brutus-home/projects/codex-of-consentient-craft/worktrees/gateway-pivot/packages/shared',
    );
  });

  it('EMPTY: {specifier: a package that is not installed} => returns null', () => {
    const result = resolvePackageRoot({ specifier: 'totally-not-a-real-package-xyz123' });

    expect(result).toBe(null);
  });
});

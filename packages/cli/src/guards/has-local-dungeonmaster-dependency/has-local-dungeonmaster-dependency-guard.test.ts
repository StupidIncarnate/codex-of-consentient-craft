import { hasLocalDungeonmasterDependencyGuard } from './has-local-dungeonmaster-dependency-guard';

describe('hasLocalDungeonmasterDependencyGuard', () => {
  it('VALID: {a @dungeonmaster/* entry with a file: specifier} => returns true', () => {
    expect(
      hasLocalDungeonmasterDependencyGuard({
        dependencies: {
          '@dungeonmaster/cli': 'file:../codex-of-consentient-craft/packages/cli',
          typescript: '^5.8.3',
        },
      }),
    ).toBe(true);
  });

  it('INVALID: {@dungeonmaster/* entries with registry ranges} => returns false', () => {
    expect(
      hasLocalDungeonmasterDependencyGuard({
        dependencies: { '@dungeonmaster/cli': '*', '@dungeonmaster/hooks': '^1.0.0' },
      }),
    ).toBe(false);
  });

  it('INVALID: {a file: specifier on a non-dungeonmaster package} => returns false', () => {
    expect(
      hasLocalDungeonmasterDependencyGuard({
        dependencies: { 'my-lib': 'file:../my-lib', '@dungeonmaster/cli': '*' },
      }),
    ).toBe(false);
  });

  it('EMPTY: {dependencies: {}} => returns false', () => {
    expect(hasLocalDungeonmasterDependencyGuard({ dependencies: {} })).toBe(false);
  });

  it('EMPTY: {dependencies: undefined} => returns false', () => {
    expect(hasLocalDungeonmasterDependencyGuard({})).toBe(false);
  });
});

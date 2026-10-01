import { devDependencySpecifierTransformer } from './dev-dependency-specifier-transformer';

describe('devDependencySpecifierTransformer', () => {
  it('VALID: {@dungeonmaster/* beside file: siblings} => file: path to the package dir, relative to the target root', () => {
    expect(
      devDependencySpecifierTransformer({
        packageName: '@dungeonmaster/siegelense',
        range: '*',
        existingDevDeps: {
          '@dungeonmaster/cli': 'file:../codex-of-consentient-craft/packages/cli',
          typescript: '^5.8.3',
        },
        targetProjectRoot: '/home/u/projects/assayer',
        packageDir: '/home/u/projects/codex-of-consentient-craft/packages/siegelense',
      }),
    ).toBe('file:../codex-of-consentient-craft/packages/siegelense');
  });

  it('VALID: {nested package dir under a @group folder} => file: path keeps the nesting', () => {
    expect(
      devDependencySpecifierTransformer({
        packageName: '@dungeonmaster/npm',
        range: '*',
        existingDevDeps: { '@dungeonmaster/cli': 'file:../dm/packages/cli' },
        targetProjectRoot: '/home/u/app',
        packageDir: '/home/u/dm/packages/@gateway/npm',
      }),
    ).toBe('file:../dm/packages/@gateway/npm');
  });

  it('VALID: {@dungeonmaster/* beside registry-range siblings} => keeps the range', () => {
    expect(
      devDependencySpecifierTransformer({
        packageName: '@dungeonmaster/siegelense',
        range: '*',
        existingDevDeps: { '@dungeonmaster/cli': '*', '@dungeonmaster/hooks': '^1.2.0' },
        targetProjectRoot: '/home/u/app',
        packageDir: '/home/u/dm/packages/siegelense',
      }),
    ).toBe('*');
  });

  it('EMPTY: {no existing devDependencies} => keeps the range', () => {
    expect(
      devDependencySpecifierTransformer({
        packageName: '@dungeonmaster/siegelense',
        range: '*',
        existingDevDeps: {},
        targetProjectRoot: '/home/u/app',
        packageDir: '/home/u/dm/packages/siegelense',
      }),
    ).toBe('*');
  });

  it('VALID: {non-dungeonmaster package beside file: siblings} => keeps the range', () => {
    expect(
      devDependencySpecifierTransformer({
        packageName: 'typescript',
        range: '^5.8.3',
        existingDevDeps: { '@dungeonmaster/cli': 'file:../dm/packages/cli' },
        targetProjectRoot: '/home/u/app',
        packageDir: '/home/u/dm/packages/typescript',
      }),
    ).toBe('^5.8.3');
  });

  it('EMPTY: {file: siblings, but discovery found no dir for the package} => keeps the range', () => {
    expect(
      devDependencySpecifierTransformer({
        packageName: '@dungeonmaster/siegelense',
        range: '*',
        existingDevDeps: { '@dungeonmaster/cli': 'file:../dm/packages/cli' },
        targetProjectRoot: '/home/u/app',
      }),
    ).toBe('*');
  });

  it("EDGE: {file: siblings, package dir is the target's own node_modules copy} => keeps the range", () => {
    expect(
      devDependencySpecifierTransformer({
        packageName: '@dungeonmaster/siegelense',
        range: '*',
        existingDevDeps: { '@dungeonmaster/cli': 'file:../dm/packages/cli' },
        targetProjectRoot: '/home/u/app',
        packageDir: '/home/u/app/node_modules/@dungeonmaster/siegelense',
      }),
    ).toBe('*');
  });
});

import { PackageJsonStub } from '@dungeonmaster/shared/contracts';
import { hasPackageJsonDependencyGuard } from './has-package-json-dependency-guard';

describe('hasPackageJsonDependencyGuard', () => {
  it('VALID: {dependencies holding the name} => returns true', () => {
    const packageJson = PackageJsonStub({
      dependencies: { '@dungeonmaster/hydration-recipes': '*' },
    });

    const result = hasPackageJsonDependencyGuard({
      packageJson,
      dependencyName: '@dungeonmaster/hydration-recipes',
    });

    expect(result).toBe(true);
  });

  it('INVALID: {dependencies missing the name} => returns false', () => {
    const packageJson = PackageJsonStub({ dependencies: { zod: '*' } });

    const result = hasPackageJsonDependencyGuard({
      packageJson,
      dependencyName: '@dungeonmaster/hydration-recipes',
    });

    expect(result).toBe(false);
  });

  it('EMPTY: {package.json has no dependencies field at all} => returns false', () => {
    const packageJson = PackageJsonStub();

    const result = hasPackageJsonDependencyGuard({
      packageJson,
      dependencyName: '@dungeonmaster/hydration-recipes',
    });

    expect(result).toBe(false);
  });

  it('EMPTY: {packageJson: undefined} => returns false', () => {
    const result = hasPackageJsonDependencyGuard({
      dependencyName: '@dungeonmaster/hydration-recipes',
    });

    expect(result).toBe(false);
  });

  it('EMPTY: {dependencyName: undefined} => returns false', () => {
    const packageJson = PackageJsonStub({ dependencies: { zod: '*' } });

    const result = hasPackageJsonDependencyGuard({ packageJson });

    expect(result).toBe(false);
  });
});

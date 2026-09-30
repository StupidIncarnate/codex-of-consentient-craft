import { workspaceScopeFromRootNameTransformer } from './workspace-scope-from-root-name-transformer';
import { PackageJsonStub } from '../../contracts/package-json/package-json.stub';

describe('workspaceScopeFromRootNameTransformer', () => {
  it('VALID: {rootPackageJsonName: "@acme/app", fallbackName: "app"} => returns "@acme"', () => {
    const result = workspaceScopeFromRootNameTransformer({
      rootPackageJsonName: PackageJsonStub({ name: '@acme/app' }).name,
      fallbackName: 'app',
    });

    expect(result).toBe('@acme');
  });

  it('VALID: {rootPackageJsonName: "acme-app", fallbackName: "acme-app"} => returns "@acme-app"', () => {
    const result = workspaceScopeFromRootNameTransformer({
      rootPackageJsonName: PackageJsonStub({ name: 'acme-app' }).name,
      fallbackName: 'acme-app',
    });

    expect(result).toBe('@acme-app');
  });

  it('VALID: {rootPackageJsonName: "dungeonmaster", fallbackName: "dungeonmaster"} => returns "@dungeonmaster"', () => {
    const result = workspaceScopeFromRootNameTransformer({
      rootPackageJsonName: PackageJsonStub({ name: 'dungeonmaster' }).name,
      fallbackName: 'dungeonmaster',
    });

    expect(result).toBe('@dungeonmaster');
  });

  it('VALID: {rootPackageJsonName: this repo\'s own scoped root name, no fallback} => returns "@dungeonmaster"', () => {
    const result = workspaceScopeFromRootNameTransformer({
      rootPackageJsonName: PackageJsonStub({ name: '@dungeonmaster/dungeonmaster' }).name,
    });

    expect(result).toBe('@dungeonmaster');
  });

  it('VALID: {rootPackageJsonName: an unscoped root name, no fallback} => prepends "@" rather than leaving it bare', () => {
    const result = workspaceScopeFromRootNameTransformer({
      rootPackageJsonName: PackageJsonStub({ name: 'dungeonmaster' }).name,
    });

    expect(result).toBe('@dungeonmaster');
  });

  it('VALID: {rootPackageJsonName: a consumer\'s own scoped root name, no fallback} => returns that consumer\'s scope, not "@dungeonmaster"', () => {
    const result = workspaceScopeFromRootNameTransformer({
      rootPackageJsonName: PackageJsonStub({ name: '@acme/repo' }).name,
    });

    expect(result).toBe('@acme');
  });

  it('VALID: {rootPackageJsonName: an unscoped root name with no "/", no fallback} => becomes its own scope, never truncated to a shorter prefix', () => {
    const result = workspaceScopeFromRootNameTransformer({
      rootPackageJsonName: PackageJsonStub({ name: 'acme-app' }).name,
    });

    expect(result).toBe('@acme-app');
  });

  it('EMPTY: {rootPackageJsonName: undefined, fallbackName: "my-repo"} => builds the scope from fallbackName', () => {
    const result = workspaceScopeFromRootNameTransformer({
      rootPackageJsonName: undefined,
      fallbackName: 'my-repo',
    });

    expect(result).toBe('@my-repo');
  });

  it('EMPTY: {rootPackageJsonName: "", fallbackName: "my-repo"} => builds the scope from fallbackName', () => {
    const result = workspaceScopeFromRootNameTransformer({
      rootPackageJsonName: PackageJsonStub({ name: '' }).name,
      fallbackName: 'my-repo',
    });

    expect(result).toBe('@my-repo');
  });

  it('EMPTY: {rootPackageJsonName: undefined, no fallback} => returns undefined', () => {
    const result = workspaceScopeFromRootNameTransformer({ rootPackageJsonName: undefined });

    expect(result).toBe(undefined);
  });
});

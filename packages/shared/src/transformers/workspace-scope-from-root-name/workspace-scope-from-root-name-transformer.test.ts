import { PackageNameStub } from '../../contracts/package-name/package-name.stub';
import { PathSegmentStub } from '../../contracts/path-segment/path-segment.stub';
import { workspaceScopeFromRootNameTransformer } from './workspace-scope-from-root-name-transformer';

describe('workspaceScopeFromRootNameTransformer', () => {
  it('VALID: {rootPackageJsonName: "@acme/app", fallbackName: "app"} => returns "@acme"', () => {
    const result = workspaceScopeFromRootNameTransformer({
      rootPackageJsonName: PackageNameStub({ value: '@acme/app' }),
      fallbackName: PathSegmentStub({ value: 'app' }),
    });

    expect(result).toBe('@acme');
  });

  it('VALID: {rootPackageJsonName: "acme-app", fallbackName: "acme-app"} => returns "@acme-app"', () => {
    const result = workspaceScopeFromRootNameTransformer({
      rootPackageJsonName: PackageNameStub({ value: 'acme-app' }),
      fallbackName: PathSegmentStub({ value: 'acme-app' }),
    });

    expect(result).toBe('@acme-app');
  });

  it('VALID: {rootPackageJsonName: "dungeonmaster", fallbackName: "dungeonmaster"} => returns "@dungeonmaster"', () => {
    const result = workspaceScopeFromRootNameTransformer({
      rootPackageJsonName: PackageNameStub({ value: 'dungeonmaster' }),
      fallbackName: PathSegmentStub({ value: 'dungeonmaster' }),
    });

    expect(result).toBe('@dungeonmaster');
  });

  it('VALID: {rootPackageJsonName: this repo\'s own scoped root name, no fallback} => returns "@dungeonmaster"', () => {
    const result = workspaceScopeFromRootNameTransformer({
      rootPackageJsonName: PackageNameStub({ value: '@dungeonmaster/dungeonmaster' }),
    });

    expect(result).toBe('@dungeonmaster');
  });

  it('VALID: {rootPackageJsonName: an unscoped root name, no fallback} => prepends "@" rather than leaving it bare', () => {
    const result = workspaceScopeFromRootNameTransformer({
      rootPackageJsonName: PackageNameStub({ value: 'dungeonmaster' }),
    });

    expect(result).toBe('@dungeonmaster');
  });

  it('VALID: {rootPackageJsonName: a consumer\'s own scoped root name, no fallback} => returns that consumer\'s scope, not "@dungeonmaster"', () => {
    const result = workspaceScopeFromRootNameTransformer({
      rootPackageJsonName: PackageNameStub({ value: '@acme/repo' }),
    });

    expect(result).toBe('@acme');
  });

  it('VALID: {rootPackageJsonName: an unscoped root name with no "/", no fallback} => becomes its own scope, never truncated to a shorter prefix', () => {
    const result = workspaceScopeFromRootNameTransformer({
      rootPackageJsonName: PackageNameStub({ value: 'acme-app' }),
    });

    expect(result).toBe('@acme-app');
  });

  it('EMPTY: {rootPackageJsonName: undefined, fallbackName: "my-repo"} => builds the scope from fallbackName', () => {
    const result = workspaceScopeFromRootNameTransformer({
      rootPackageJsonName: undefined,
      fallbackName: PathSegmentStub({ value: 'my-repo' }),
    });

    expect(result).toBe('@my-repo');
  });

  it('EMPTY: {rootPackageJsonName: "", fallbackName: "my-repo"} => builds the scope from fallbackName', () => {
    const result = workspaceScopeFromRootNameTransformer({
      rootPackageJsonName: '',
      fallbackName: PathSegmentStub({ value: 'my-repo' }),
    });

    expect(result).toBe('@my-repo');
  });

  it('EMPTY: {rootPackageJsonName: undefined, no fallback} => returns undefined', () => {
    const result = workspaceScopeFromRootNameTransformer({ rootPackageJsonName: undefined });

    expect(result).toBe(undefined);
  });
});

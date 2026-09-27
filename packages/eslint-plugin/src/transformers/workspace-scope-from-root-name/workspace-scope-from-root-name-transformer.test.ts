import { PackageNameStub, PathSegmentStub } from '@dungeonmaster/shared/contracts';
import { workspaceScopeFromRootNameTransformer } from './workspace-scope-from-root-name-transformer';

describe('workspaceScopeFromRootNameTransformer', () => {
  it('VALID: {rootPackageJsonName: this repo\'s own scoped root name} => returns "@dungeonmaster"', () => {
    const result = workspaceScopeFromRootNameTransformer({
      rootPackageJsonName: PackageNameStub({ value: '@dungeonmaster/dungeonmaster' }),
    });

    expect(result).toStrictEqual(PathSegmentStub({ value: '@dungeonmaster' }));
  });

  it('VALID: {rootPackageJsonName: an unscoped root name} => prepends "@" rather than leaving it bare', () => {
    const result = workspaceScopeFromRootNameTransformer({
      rootPackageJsonName: PackageNameStub({ value: 'dungeonmaster' }),
    });

    expect(result).toStrictEqual(PathSegmentStub({ value: '@dungeonmaster' }));
  });

  it('VALID: {rootPackageJsonName: a consumer\'s own scoped root name} => returns that consumer\'s scope, not "@dungeonmaster"', () => {
    const result = workspaceScopeFromRootNameTransformer({
      rootPackageJsonName: PackageNameStub({ value: '@acme/repo' }),
    });

    expect(result).toStrictEqual(PathSegmentStub({ value: '@acme' }));
  });

  // F13: a consumer's root package.json is frequently unscoped even when its own workspace
  // packages use a scope ('acme-app' at the root, '@acme/orders' as a workspace package) — this
  // transformer never sees that mismatch, because it only ever reads the root name, never a
  // dependency list. The mismatch is `cli`'s `gatewayScopeDetectTransformer`'s own concern (it NAMES
  // the scope a fresh consumer's gateway packages get), not this rule's.
  it('VALID: {rootPackageJsonName: an unscoped root name with no "/"} => becomes its own scope, never truncated to a shorter prefix', () => {
    const result = workspaceScopeFromRootNameTransformer({
      rootPackageJsonName: PackageNameStub({ value: 'acme-app' }),
    });

    expect(result).toStrictEqual(PathSegmentStub({ value: '@acme-app' }));
  });

  it('EMPTY: {rootPackageJsonName: undefined} => returns undefined', () => {
    const result = workspaceScopeFromRootNameTransformer({ rootPackageJsonName: undefined });

    expect(result).toBe(undefined);
  });
});

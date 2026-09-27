import { PackageNameStub, PathSegmentStub } from '@dungeonmaster/shared/contracts';
import { workspaceScopeFromPackageNamesTransformer } from './workspace-scope-from-package-names-transformer';

describe('workspaceScopeFromPackageNamesTransformer', () => {
  it('VALID: {packageNames: this repo\'s own scope} => returns "@dungeonmaster"', () => {
    const result = workspaceScopeFromPackageNamesTransformer({
      packageNames: [
        PackageNameStub({ value: '@dungeonmaster/hooks' }),
        PackageNameStub({ value: '@dungeonmaster/orchestrator' }),
      ],
    });

    expect(result).toStrictEqual(PathSegmentStub({ value: '@dungeonmaster' }));
  });

  it('VALID: {packageNames: a consumer repo\'s own scope} => returns that consumer\'s scope, not "@dungeonmaster"', () => {
    const result = workspaceScopeFromPackageNamesTransformer({
      packageNames: [PackageNameStub({ value: '@acme/orders' })],
    });

    expect(result).toStrictEqual(PathSegmentStub({ value: '@acme' }));
  });

  it('EDGE: {packageNames: an unscoped name before a scoped one} => skips the unscoped name and returns the scoped one', () => {
    const result = workspaceScopeFromPackageNamesTransformer({
      packageNames: [
        PackageNameStub({ value: 'eslint' }),
        PackageNameStub({ value: '@acme/orders' }),
      ],
    });

    expect(result).toStrictEqual(PathSegmentStub({ value: '@acme' }));
  });

  it('EMPTY: {packageNames: no scoped name at all} => returns undefined', () => {
    const result = workspaceScopeFromPackageNamesTransformer({
      packageNames: [PackageNameStub({ value: 'eslint' })],
    });

    expect(result).toBe(undefined);
  });

  it('EMPTY: {packageNames: an empty list} => returns undefined', () => {
    const result = workspaceScopeFromPackageNamesTransformer({ packageNames: [] });

    expect(result).toBe(undefined);
  });
});

import { PathSegmentStub } from '@dungeonmaster/shared/contracts';
import { gatewayScopeDetectTransformer } from './gateway-scope-detect-transformer';

describe('gatewayScopeDetectTransformer', () => {
  it('VALID: {rootPackageJsonName: "@acme/app"} => returns "@acme"', () => {
    const result = gatewayScopeDetectTransformer({
      rootPackageJsonName: '@acme/app',
      fallbackName: PathSegmentStub({ value: 'app' }),
    });

    expect(result).toBe('@acme');
  });

  it('VALID: {rootPackageJsonName: "acme-app"} => returns "@acme-app"', () => {
    const result = gatewayScopeDetectTransformer({
      rootPackageJsonName: 'acme-app',
      fallbackName: PathSegmentStub({ value: 'acme-app' }),
    });

    expect(result).toBe('@acme-app');
  });

  it('EMPTY: {rootPackageJsonName: undefined} => builds the scope from fallbackName', () => {
    const result = gatewayScopeDetectTransformer({
      rootPackageJsonName: undefined,
      fallbackName: PathSegmentStub({ value: 'my-repo' }),
    });

    expect(result).toBe('@my-repo');
  });

  it('EMPTY: {rootPackageJsonName: ""} => builds the scope from fallbackName', () => {
    const result = gatewayScopeDetectTransformer({
      rootPackageJsonName: '',
      fallbackName: PathSegmentStub({ value: 'my-repo' }),
    });

    expect(result).toBe('@my-repo');
  });

  it('VALID: {rootPackageJsonName: "dungeonmaster"} => returns "@dungeonmaster"', () => {
    const result = gatewayScopeDetectTransformer({
      rootPackageJsonName: 'dungeonmaster',
      fallbackName: PathSegmentStub({ value: 'dungeonmaster' }),
    });

    expect(result).toBe('@dungeonmaster');
  });
});

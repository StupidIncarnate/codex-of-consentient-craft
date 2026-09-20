import { isBanDirectIoScopeFileGuard } from './is-ban-direct-io-scope-file-guard';

describe('isBanDirectIoScopeFileGuard', () => {
  it('VALID: {filename: a spec file} => returns true', () => {
    expect(
      isBanDirectIoScopeFileGuard({
        filename: '/repo/packages/web/test/foo.spec.ts',
      }),
    ).toBe(true);
  });

  it('VALID: {filename: an e2e file} => returns true', () => {
    expect(
      isBanDirectIoScopeFileGuard({
        filename: '/repo/packages/web/test/foo.e2e.ts',
      }),
    ).toBe(true);
  });

  it('VALID: {filename: an integration.test file} => returns true', () => {
    expect(
      isBanDirectIoScopeFileGuard({
        filename: '/repo/packages/web/test/foo.integration.test.ts',
      }),
    ).toBe(true);
  });

  it('VALID: {filename: a standard test file} => returns false', () => {
    expect(
      isBanDirectIoScopeFileGuard({
        filename: '/repo/packages/web/test/foo.test.ts',
      }),
    ).toBe(false);
  });

  it('EMPTY: {} => returns false', () => {
    expect(isBanDirectIoScopeFileGuard({})).toBe(false);
  });

  it('EMPTY: {filename: ""} => returns false', () => {
    expect(isBanDirectIoScopeFileGuard({ filename: '' })).toBe(false);
  });
});

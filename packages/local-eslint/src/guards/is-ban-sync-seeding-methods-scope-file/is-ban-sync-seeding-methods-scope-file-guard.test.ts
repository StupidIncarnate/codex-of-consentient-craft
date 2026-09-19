import { isBanSyncSeedingMethodsScopeFileGuard } from './is-ban-sync-seeding-methods-scope-file-guard';

describe('isBanSyncSeedingMethodsScopeFileGuard', () => {
  it('VALID: {filename: a harness file} => returns true', () => {
    expect(
      isBanSyncSeedingMethodsScopeFileGuard({
        filename: '/repo/packages/web/test/harness/user.harness.ts',
      }),
    ).toBe(true);
  });

  it('VALID: {filename: a non-harness file} => returns false', () => {
    expect(
      isBanSyncSeedingMethodsScopeFileGuard({
        filename: '/repo/packages/web/test/harness/user.ts',
      }),
    ).toBe(false);
  });

  it('EMPTY: {} => returns false', () => {
    expect(isBanSyncSeedingMethodsScopeFileGuard({})).toBe(false);
  });

  it('EMPTY: {filename: ""} => returns false', () => {
    expect(isBanSyncSeedingMethodsScopeFileGuard({ filename: '' })).toBe(false);
  });
});

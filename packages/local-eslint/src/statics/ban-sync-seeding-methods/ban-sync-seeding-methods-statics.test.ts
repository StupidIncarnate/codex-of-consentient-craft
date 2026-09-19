import { banSyncSeedingMethodsStatics } from './ban-sync-seeding-methods-statics';

describe('banSyncSeedingMethodsStatics', () => {
  it('VALID: {} => exposes correct seedingPrefixes array', () => {
    expect(banSyncSeedingMethodsStatics.seedingPrefixes).toStrictEqual([
      'seed',
      'create',
      'write',
      'patch',
      'stamp',
    ]);
  });
});

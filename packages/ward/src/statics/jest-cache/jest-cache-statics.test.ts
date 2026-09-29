import { jestCacheStatics } from './jest-cache-statics';

describe('jestCacheStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(jestCacheStatics).toStrictEqual({
      prune: { maxAgeMs: 604800000 },
    });
  });
});

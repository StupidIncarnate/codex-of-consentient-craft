import { ttlStatics } from './ttl-statics';

describe('ttlStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(ttlStatics).toStrictEqual({
      runResultTtl: 3600000,
    });
  });
});

import { e2eShardStatics } from './e2e-shard-statics';

describe('e2eShardStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(e2eShardStatics).toStrictEqual({
      defaultCount: 3,
    });
  });
});

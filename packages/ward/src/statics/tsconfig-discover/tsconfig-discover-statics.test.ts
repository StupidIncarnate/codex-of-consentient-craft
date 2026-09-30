import { tsconfigDiscoverStatics } from './tsconfig-discover-statics';

describe('tsconfigDiscoverStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(tsconfigDiscoverStatics).toStrictEqual({
      defaultExclude: ['node_modules', 'dist'],
    });
  });
});

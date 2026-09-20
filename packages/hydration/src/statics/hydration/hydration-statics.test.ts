import { hydrationStatics } from './hydration-statics';

describe('hydrationStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(hydrationStatics).toStrictEqual({
      packageName: 'hydration',
    });
  });
});

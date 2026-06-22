import { elkLayoutStatics } from './elk-layout-statics';

describe('elkLayoutStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(elkLayoutStatics).toStrictEqual({
      node: {
        width: 200,
        height: 140,
      },
    });
  });
});

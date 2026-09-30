import { networkPortStatics } from './network-port-statics';

describe('networkPortStatics', () => {
  it('VALID: {default values} => match exported shape', () => {
    expect(networkPortStatics).toStrictEqual({
      min: 1,
      max: 65_535,
    });
  });
});

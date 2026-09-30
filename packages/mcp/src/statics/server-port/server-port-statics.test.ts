import { serverPortStatics } from './server-port-statics';

describe('serverPortStatics', () => {
  it('VALID: exported statics => matches exact expected shape', () => {
    expect(serverPortStatics).toStrictEqual({
      min: 1,
      max: 65_535,
    });
  });
});

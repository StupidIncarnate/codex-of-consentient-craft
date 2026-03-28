import { msPerSecondStatics } from './ms-per-second-statics';

describe('msPerSecondStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(msPerSecondStatics).toStrictEqual({
      value: 1000,
    });
  });
});

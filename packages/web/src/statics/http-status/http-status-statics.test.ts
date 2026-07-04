import { httpStatusStatics } from './http-status-statics';

describe('httpStatusStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(httpStatusStatics).toStrictEqual({
      conflict: 409,
      range: {
        min: 100,
        max: 599,
      },
    });
  });
});

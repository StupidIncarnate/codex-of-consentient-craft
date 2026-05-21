import { httpStatusStatics } from './http-status-statics';

describe('httpStatusStatics', () => {
  it('VALID: {full static export} => matches the documented HTTP status constants', () => {
    expect(httpStatusStatics).toStrictEqual({
      notFound: 404,
      range: {
        min: 100,
        max: 599,
      },
      successRange: {
        minInclusive: 200,
        maxExclusive: 300,
      },
    });
  });
});

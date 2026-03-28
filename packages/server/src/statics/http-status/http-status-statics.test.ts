import { httpStatusStatics } from './http-status-statics';

describe('httpStatusStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(httpStatusStatics).toStrictEqual({
      success: {
        ok: 200,
        created: 201,
      },
      clientError: {
        badRequest: 400,
        notFound: 404,
      },
      serverError: {
        internal: 500,
        notImplemented: 501,
      },
    });
  });
});

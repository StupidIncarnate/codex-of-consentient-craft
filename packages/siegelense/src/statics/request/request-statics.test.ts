import { requestStatics } from './request-statics';

describe('requestStatics', () => {
  it('VALID: exported value => matches expected shape and grouped values', () => {
    expect(requestStatics).toStrictEqual({
      defaults: {
        method: 'GET',
        timeoutMs: 10000,
        status: 200,
        statusText: 'OK',
      },
      reading: {
        delimiter: ' — ',
      },
      status: {
        ok: 200,
        clientErrorThreshold: 400,
      },
    });
  });
});

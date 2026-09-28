import { HttpEnvelopeFailureError } from '@dungeonmaster/hydration/errors';
import { dmHttpResponseUnwrapTransformer } from './dm-http-response-unwrap-transformer';
import { DmHttpResponseStub } from '../../contracts/dm-http-response/dm-http-response.stub';

const URL = 'http://app.in-process/api/guilds';

describe('dmHttpResponseUnwrapTransformer', () => {
  describe('a success status', () => {
    it('VALID: {status: 201, body: a record} => returns the body', () => {
      const response = DmHttpResponseStub({
        status: 201,
        body: { id: 'g1', title: 'Siege' },
      });

      const result = dmHttpResponseUnwrapTransformer({ response, url: URL });

      expect(result).toStrictEqual({ id: 'g1', title: 'Siege' });
    });
  });

  describe('a non-success status', () => {
    it('ERROR: {status: 500, body: an error} => throws naming the url and the status', () => {
      const response = DmHttpResponseStub({ status: 500, body: { error: 'database unavailable' } });

      expect(() => dmHttpResponseUnwrapTransformer({ response, url: URL })).toThrow(
        `${URL} answered 500`,
      );
    });

    it('ERROR: {status: 500, body: an error} => the thrown value is HttpEnvelopeFailureError carrying url, status and body', async () => {
      const response = DmHttpResponseStub({ status: 500, body: { error: 'database unavailable' } });

      const thrown: unknown = await Promise.resolve()
        .then(() => dmHttpResponseUnwrapTransformer({ response, url: URL }))
        .catch((error: unknown) => error);

      expect(thrown).toStrictEqual(
        new HttpEnvelopeFailureError({
          url: URL,
          status: 500,
          body: '{"error":"database unavailable"}',
        }),
      );
    });
  });
});

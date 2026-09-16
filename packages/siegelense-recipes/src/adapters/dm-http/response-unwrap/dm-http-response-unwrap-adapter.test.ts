import { dmHttpResponseUnwrapAdapter } from './dm-http-response-unwrap-adapter';
import { dmHttpResponseUnwrapAdapterProxy } from './dm-http-response-unwrap-adapter.proxy';
import { DmHttpResponseStub } from '../../../contracts/dm-http-response/dm-http-response.stub';

const URL = 'http://app.in-process/api/guilds';

describe('dmHttpResponseUnwrapAdapter', () => {
  describe('a success status', () => {
    it('VALID: {status: 201, body: a record} => returns the body', () => {
      dmHttpResponseUnwrapAdapterProxy();
      const response = DmHttpResponseStub({
        status: 201,
        body: { id: 'g1', title: 'Siege' },
      });

      const result = dmHttpResponseUnwrapAdapter({ response, url: URL });

      expect(result).toStrictEqual({ id: 'g1', title: 'Siege' });
    });
  });

  describe('a non-success status', () => {
    it('ERROR: {status: 500, body: an error} => throws naming the url and the status', () => {
      dmHttpResponseUnwrapAdapterProxy();
      const response = DmHttpResponseStub({ status: 500, body: { error: 'database unavailable' } });

      expect(() => dmHttpResponseUnwrapAdapter({ response, url: URL })).toThrow(
        `${URL} answered 500`,
      );
    });

    it('ERROR: {status: 500, body: an error} => the thrown value carries url, status and the body as a string', async () => {
      dmHttpResponseUnwrapAdapterProxy();
      const response = DmHttpResponseStub({ status: 500, body: { error: 'database unavailable' } });

      const thrown: unknown = await Promise.resolve()
        .then(() => dmHttpResponseUnwrapAdapter({ response, url: URL }))
        .catch((error: unknown) => error);

      expect(thrown).toStrictEqual(
        Object.assign(new Error(`${URL} answered 500`), {
          url: URL,
          status: 500,
          body: '{"error":"database unavailable"}',
        }),
      );
    });
  });
});

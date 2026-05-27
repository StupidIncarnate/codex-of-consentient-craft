import { FetchGetWithStatusResultStub } from './fetch-get-with-status-result.stub';
import { fetchGetWithStatusResultContract } from './fetch-get-with-status-result-contract';

describe('fetchGetWithStatusResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {default stub} => parses to branded result with defaults', () => {
      const result = FetchGetWithStatusResultStub();

      expect(result).toStrictEqual({
        status: 200,
        ok: true,
        body: null,
      });
    });

    it('VALID: {404, ok: false, error body} => parses to branded result', () => {
      const result = FetchGetWithStatusResultStub({
        status: 404,
        ok: false,
        body: { error: 'Not found' },
      });

      expect(result).toStrictEqual({
        status: 404,
        ok: false,
        body: { error: 'Not found' },
      });
    });

    it('VALID: {500, ok: false, JSON object body} => parses to branded result', () => {
      const result = FetchGetWithStatusResultStub({
        status: 500,
        ok: false,
        body: { error: 'Boom' },
      });

      expect(result).toStrictEqual({
        status: 500,
        ok: false,
        body: { error: 'Boom' },
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {status: 99} => throws (below minimum)', () => {
      expect(() => FetchGetWithStatusResultStub({ status: 99 })).toThrow(
        /greater than or equal to 100/u,
      );
    });

    it('INVALID: {status: 600} => throws (above maximum)', () => {
      expect(() => FetchGetWithStatusResultStub({ status: 600 })).toThrow(
        /less than or equal to 599/u,
      );
    });

    it('INVALID: {ok: "true" string} => throws (not boolean)', () => {
      expect(() =>
        fetchGetWithStatusResultContract.parse({ status: 200, ok: 'true' as never, body: null }),
      ).toThrow(/Expected boolean/u);
    });
  });
});

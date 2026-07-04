import { fetchPostWithStatusResultContract } from './fetch-post-with-status-result-contract';
import { FetchPostWithStatusResultStub } from './fetch-post-with-status-result.stub';

describe('fetchPostWithStatusResultContract', () => {
  describe('valid results', () => {
    it('VALID: {status: 200, ok: true, body: {}} => parses successfully', () => {
      const result = FetchPostWithStatusResultStub();

      expect(result).toStrictEqual({
        status: 200,
        ok: true,
        body: {},
      });
    });

    it('VALID: {status: 409, ok: false, body: {allowed: false}} => parses successfully', () => {
      const result = FetchPostWithStatusResultStub({
        status: 409,
        ok: false,
        body: { allowed: false },
      });

      expect(result).toStrictEqual({
        status: 409,
        ok: false,
        body: { allowed: false },
      });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {status: 99} => throws below-range validation error', () => {
      expect(() => FetchPostWithStatusResultStub({ status: 99 })).toThrow(/too_small/u);
    });

    it('INVALID: {status: 600} => throws above-range validation error', () => {
      expect(() => FetchPostWithStatusResultStub({ status: 600 })).toThrow(/too_big/u);
    });

    it('INVALID: {ok: "true"} => throws type validation error', () => {
      expect(() =>
        fetchPostWithStatusResultContract.parse({ status: 200, ok: 'true' as never, body: null }),
      ).toThrow(/invalid_type/u);
    });
  });
});

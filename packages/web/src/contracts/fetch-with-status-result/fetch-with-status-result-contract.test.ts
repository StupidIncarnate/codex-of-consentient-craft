import { fetchWithStatusResultContract } from './fetch-with-status-result-contract';
import { FetchWithStatusResultStub } from './fetch-with-status-result.stub';

describe('fetchWithStatusResultContract', () => {
  describe('valid results', () => {
    it('VALID: {status: 200, ok: true, body: {}} => parses successfully', () => {
      const result = FetchWithStatusResultStub();

      expect(result).toStrictEqual({
        status: 200,
        ok: true,
        body: {},
      });
    });

    it('VALID: {status: 409, ok: false, body: {allowed: false}} => parses successfully', () => {
      const result = FetchWithStatusResultStub({
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
      expect(() => FetchWithStatusResultStub({ status: 99 })).toThrow(/too_small/u);
    });

    it('INVALID: {status: 600} => throws above-range validation error', () => {
      expect(() => FetchWithStatusResultStub({ status: 600 })).toThrow(/too_big/u);
    });

    it('INVALID: {ok: "true"} => throws type validation error', () => {
      expect(() =>
        fetchWithStatusResultContract.parse({ status: 200, ok: 'true' as never, body: null }),
      ).toThrow(/invalid_type/u);
    });
  });
});

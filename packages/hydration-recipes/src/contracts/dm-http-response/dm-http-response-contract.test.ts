import { dmHttpResponseContract } from './dm-http-response-contract';
import { DmHttpResponseStub } from './dm-http-response.stub';

describe('dmHttpResponseContract', () => {
  describe('valid responses', () => {
    it('VALID: {status: 201, body: {id: "f47ac10b"}} => parses to exactly those two fields', () => {
      const result = dmHttpResponseContract.parse({ status: 201, body: { id: 'f47ac10b' } });

      expect(result).toStrictEqual({ status: 201, body: { id: 'f47ac10b' } });
    });

    it('VALID: {stub with status override} => parses with the overridden status', () => {
      const response = DmHttpResponseStub({ status: 404 });

      expect(response).toStrictEqual({ status: 404, body: {} });
    });
  });

  describe('invalid responses', () => {
    it('INVALID: {status: "201"} => throws "Expected number"', () => {
      expect(() => dmHttpResponseContract.parse({ status: '201', body: {} })).toThrow(
        /Expected number/u,
      );
    });
  });

  describe('empty responses', () => {
    it('EMPTY: {} => throws "Required" for status', () => {
      expect(() => dmHttpResponseContract.parse({})).toThrow(/Required/u);
    });
  });
});

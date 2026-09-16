import { httpMethodContract } from './http-method-contract';
import { HttpMethodStub } from './http-method.stub';

describe('httpMethodContract', () => {
  describe('valid members', () => {
    it.each(httpMethodContract.unwrap().options)(
      'VALID: {value: %s} => parses to itself',
      (value) => {
        const httpMethod = HttpMethodStub({ value });

        const result = httpMethodContract.parse(httpMethod);

        expect(result).toBe(value);
      },
    );
  });

  describe('invalid members', () => {
    it('INVALID: {value: "TRACE"} => an unlisted method throws validation error', () => {
      expect(() => {
        HttpMethodStub({ value: 'TRACE' as never });
      }).toThrow(/Invalid enum value/u);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {value: "get"} => a lowercase variant of a valid member throws validation error', () => {
      expect(() => {
        httpMethodContract.parse('get');
      }).toThrow(/Invalid enum value/u);
    });
  });
});

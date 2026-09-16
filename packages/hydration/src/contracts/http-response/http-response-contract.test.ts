import { httpResponseContract } from './http-response-contract';
import { HttpResponseStub } from './http-response.stub';

describe('httpResponseContract', () => {
  describe('valid responses', () => {
    it('VALID: {url, status: 200, body: \'{"id":"g1"}\'} => returns all three', () => {
      const result = HttpResponseStub({
        url: 'http://localhost:3737/api/guilds',
        status: 200,
        body: '{"id":"g1"}',
      });

      expect(result).toStrictEqual({
        url: 'http://localhost:3737/api/guilds',
        status: 200,
        body: '{"id":"g1"}',
      });
    });
  });

  describe('invalid responses', () => {
    it('INVALID: {status: 99} => throws', () => {
      expect(() =>
        httpResponseContract.parse({
          url: 'http://localhost:3737/api/guilds',
          status: 99,
          body: '{}',
        }),
      ).toThrow(/Number must be greater than or equal to 100/u);
    });
  });
});

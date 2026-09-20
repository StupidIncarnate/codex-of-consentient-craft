import { routeFailureContract } from './route-failure-contract';
import { RouteFailureStub } from './route-failure.stub';

describe('routeFailureContract', () => {
  describe('a route that answered', () => {
    it("VALID: {url, status: 500, responseBody: '{}'} => returns all three", () => {
      const result = RouteFailureStub({
        url: 'http://localhost:3737/api/guilds',
        status: 500,
        responseBody: '{}',
      });

      expect(result).toStrictEqual({
        url: 'http://localhost:3737/api/guilds',
        status: 500,
        responseBody: '{}',
      });
    });
  });

  describe('a refused connection', () => {
    it('VALID: {url: null, status: null, responseBody: null} => returns all three null', () => {
      const result = RouteFailureStub({ url: null, status: null, responseBody: null });

      expect(result).toStrictEqual({ url: null, status: null, responseBody: null });
    });
  });

  describe('an out-of-range status', () => {
    it('INVALID: {status: 99} => throws', () => {
      expect(() =>
        routeFailureContract.parse({ url: null, status: 99, responseBody: null }),
      ).toThrow(/Number must be greater than or equal to 100/u);
    });
  });
});

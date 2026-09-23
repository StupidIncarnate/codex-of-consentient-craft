import { hydrationRouteContract } from './hydration-route-contract';
import { HydrationRouteStub } from './hydration-route.stub';

describe('hydrationRouteContract', () => {
  describe('valid routes', () => {
    it('VALID: {options} => exposes exactly api, write', () => {
      expect(hydrationRouteContract.options).toStrictEqual(['api', 'write']);
    });

    it.each(hydrationRouteContract.options)('VALID: {value: %s} => parses to itself', (route) => {
      expect(HydrationRouteStub({ value: route })).toBe(route);
    });
  });

  describe('invalid routes', () => {
    it('INVALID: {value: "socket"} => throws naming the valid routes', () => {
      expect(() => hydrationRouteContract.parse('socket')).toThrow(
        /Invalid enum value\. Expected 'api' \| 'write', received 'socket'/u,
      );
    });

    it('INVALID: {value: "recording"} => throws naming the valid routes', () => {
      expect(() => hydrationRouteContract.parse('recording')).toThrow(
        /Invalid enum value\. Expected 'api' \| 'write', received 'recording'/u,
      );
    });
  });
});

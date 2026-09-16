import { hydrationTargetContract } from './hydration-target-contract';
import { HydrationTargetStub } from './hydration-target.stub';

describe('hydrationTargetContract', () => {
  describe('valid targets', () => {
    it('VALID: {} => returns an empty target', () => {
      expect(HydrationTargetStub({})).toStrictEqual({});
    });

    it('VALID: {baseUrl: "http://localhost:3737"} => returns the url', () => {
      expect(HydrationTargetStub({ baseUrl: 'http://localhost:3737' })).toStrictEqual({
        baseUrl: 'http://localhost:3737',
      });
    });
  });

  describe('invalid targets', () => {
    it('INVALID: {baseUrl: "not-a-url"} => throws "Invalid url"', () => {
      expect(() => hydrationTargetContract.parse({ baseUrl: 'not-a-url' })).toThrow(/Invalid url/u);
    });
  });
});

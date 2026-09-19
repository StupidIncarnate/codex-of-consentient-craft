import { refResolutionContract } from './ref-resolution-contract';
import { RefResolutionStub } from './ref-resolution.stub';

describe('refResolutionContract', () => {
  describe('valid resolutions', () => {
    it('VALID: {live} => parses with no boundary, because nothing was crossed', () => {
      const resolution = RefResolutionStub({ state: 'live', boundary: null, highestMinted: 41 });

      const result = refResolutionContract.parse(resolution);

      expect(result).toStrictEqual({ state: 'live', boundary: null, highestMinted: 41 });
    });

    it('VALID: {stale after a detach} => parses naming the detached boundary', () => {
      const resolution = RefResolutionStub({
        state: 'stale',
        boundary: 'detached',
        highestMinted: 41,
      });

      const result = refResolutionContract.parse(resolution);

      expect(result).toStrictEqual({ state: 'stale', boundary: 'detached', highestMinted: 41 });
    });

    it('VALID: {stale after a navigation} => parses naming the navigation boundary', () => {
      const resolution = RefResolutionStub({
        state: 'stale',
        boundary: 'navigation',
        highestMinted: 41,
      });

      const result = refResolutionContract.parse(resolution);

      expect(result).toStrictEqual({ state: 'stale', boundary: 'navigation', highestMinted: 41 });
    });

    it('VALID: {unknown} => parses with no boundary, because a ref from elsewhere crossed none of ours', () => {
      const resolution = RefResolutionStub({ state: 'unknown', boundary: null, highestMinted: 41 });

      const result = refResolutionContract.parse(resolution);

      expect(result).toStrictEqual({ state: 'unknown', boundary: null, highestMinted: 41 });
    });
  });

  describe('invalid resolutions', () => {
    it('INVALID: {state: "missing"} => throws, because a ref has exactly three fates', () => {
      expect(() =>
        refResolutionContract.parse({ state: 'missing', boundary: null, highestMinted: 0 }),
      ).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {highestMinted: -1} => throws', () => {
      expect(() =>
        refResolutionContract.parse({ state: 'live', boundary: null, highestMinted: -1 }),
      ).toThrow(/Number must be greater than or equal to 0/u);
    });
  });
});

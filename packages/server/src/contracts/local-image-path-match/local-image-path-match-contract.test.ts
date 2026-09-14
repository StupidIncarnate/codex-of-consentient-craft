import { localImagePathMatchContract } from './local-image-path-match-contract';
import { LocalImagePathMatchStub } from './local-image-path-match.stub';

describe('localImagePathMatchContract', () => {
  describe('valid matches', () => {
    it('VALID: {default stub} => parses a path and its ordinal', () => {
      const result = LocalImagePathMatchStub();

      expect(result).toStrictEqual({
        path: '/home/user/pasted.png',
        ordinal: 1,
      });
    });

    it('VALID: {ordinal: 3} => parses a later ordinal', () => {
      const result = LocalImagePathMatchStub({ ordinal: 3 });

      expect(result).toStrictEqual({
        path: '/home/user/pasted.png',
        ordinal: 3,
      });
    });
  });

  describe('invalid matches', () => {
    it('INVALID: {path: "shot.png"} => throws for a relative path', () => {
      expect(() => {
        localImagePathMatchContract.parse({ path: 'shot.png', ordinal: 1 });
      }).toThrow(/Path must be absolute/u);
    });

    it('INVALID: {ordinal: 0} => throws for a non-positive ordinal', () => {
      expect(() => {
        localImagePathMatchContract.parse({ path: '/home/user/pasted.png', ordinal: 0 });
      }).toThrow(/greater than 0/u);
    });

    it('INVALID: {missing ordinal} => throws validation error', () => {
      expect(() => {
        localImagePathMatchContract.parse({ path: '/home/user/pasted.png' });
      }).toThrow(/Required/u);
    });
  });
});

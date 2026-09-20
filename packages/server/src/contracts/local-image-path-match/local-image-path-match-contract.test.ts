import { localImagePathMatchContract } from './local-image-path-match-contract';
import { LocalImagePathMatchStub } from './local-image-path-match.stub';

describe('localImagePathMatchContract', () => {
  describe('valid matches', () => {
    it('VALID: {default stub} => parses a path, the text that named it, and its ordinal', () => {
      const result = LocalImagePathMatchStub();

      expect(result).toStrictEqual({
        path: '/home/user/pasted.png',
        matchedText: '/home/user/pasted.png',
        ordinal: 1,
      });
    });

    it('VALID: {ordinal: 3} => parses a later ordinal', () => {
      const result = LocalImagePathMatchStub({ ordinal: 3 });

      expect(result).toStrictEqual({
        path: '/home/user/pasted.png',
        matchedText: '/home/user/pasted.png',
        ordinal: 3,
      });
    });

    // The two fields hold DIFFERENT values whenever the writer quoted the path. Nothing else in
    // this suite would notice a contract that quietly collapsed them into one.
    it('VALID: {a quoted path} => keeps the quotes on matchedText and off path', () => {
      const result = LocalImagePathMatchStub({
        path: '/home/user/Screen Shot.png',
        matchedText: '"/home/user/Screen Shot.png"',
      });

      expect(result).toStrictEqual({
        path: '/home/user/Screen Shot.png',
        matchedText: '"/home/user/Screen Shot.png"',
        ordinal: 1,
      });
    });
  });

  describe('invalid matches', () => {
    it('INVALID: {path: "shot.png"} => throws for a relative path', () => {
      expect(() => {
        localImagePathMatchContract.parse({
          path: 'shot.png',
          matchedText: 'shot.png',
          ordinal: 1,
        });
      }).toThrow(/Path must be absolute/u);
    });

    it('INVALID: {ordinal: 0} => throws for a non-positive ordinal', () => {
      expect(() => {
        localImagePathMatchContract.parse({
          path: '/home/user/pasted.png',
          matchedText: '/home/user/pasted.png',
          ordinal: 0,
        });
      }).toThrow(/greater than 0/u);
    });

    it('INVALID: {missing ordinal} => throws validation error', () => {
      expect(() => {
        localImagePathMatchContract.parse({
          path: '/home/user/pasted.png',
          matchedText: '/home/user/pasted.png',
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: {missing matchedText} => throws validation error', () => {
      expect(() => {
        localImagePathMatchContract.parse({ path: '/home/user/pasted.png', ordinal: 1 });
      }).toThrow(/Required/u);
    });

    it('INVALID: {matchedText: ""} => throws for an empty span', () => {
      expect(() => {
        localImagePathMatchContract.parse({
          path: '/home/user/pasted.png',
          matchedText: '',
          ordinal: 1,
        });
      }).toThrow(/at least 1/u);
    });
  });
});

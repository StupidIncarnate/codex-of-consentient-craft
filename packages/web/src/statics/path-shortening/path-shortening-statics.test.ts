import { pathShorteningStatics } from './path-shortening-statics';

describe('pathShorteningStatics', () => {
  describe('shape', () => {
    it('VALID: {statics} => exposes the monorepo anchor, the join separator, and the elision budget', () => {
      expect(pathShorteningStatics).toStrictEqual({
        packagesSegment: 'packages',
        separator: '/',
        ellipsis: '…',
        minSegments: 4,
      });
    });
  });
});

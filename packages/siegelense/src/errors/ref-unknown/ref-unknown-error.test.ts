import { RefUnknownError } from './ref-unknown-error';

describe('RefUnknownError', () => {
  describe('constructor()', () => {
    it('VALID: {ref, highestMinted} => renders the whole message, naming the highest minted ref and all four boundaries', () => {
      const error = new RefUnknownError({ ref: 99, highestMinted: 41 });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RefUnknownError',
        message:
          'UNKNOWN REF: ref 99 was never minted by this instance, whose highest minted ref is 41. A ref is scoped to ONE instance and one page state, and cannot cross any of four boundaries: a minion to its parent, a parent to a fixer, a walk to its re-walk, or a happy phase to an adversarial one. Run `look` on THIS instance, or target by testId with a `within` scope, which means the same element in any instance.',
      });
    });

    it('EDGE: {highestMinted: 0} => an instance that has never run a look still answers with a number rather than a blank', () => {
      const error = new RefUnknownError({ ref: 5, highestMinted: 0 });

      expect(error.message).toBe(
        'UNKNOWN REF: ref 5 was never minted by this instance, whose highest minted ref is 0. A ref is scoped to ONE instance and one page state, and cannot cross any of four boundaries: a minion to its parent, a parent to a fixer, a walk to its re-walk, or a happy phase to an adversarial one. Run `look` on THIS instance, or target by testId with a `within` scope, which means the same element in any instance.',
      );
    });

    it('VALID: {ref, highestMinted} => carries both, so a caller can act without parsing the message', () => {
      const error = new RefUnknownError({ ref: 99, highestMinted: 41 });

      expect({ ref: error.ref, highestMinted: error.highestMinted }).toStrictEqual({
        ref: 99,
        highestMinted: 41,
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof RefUnknownError => returns true', () => {
      const error = new RefUnknownError({ ref: 99, highestMinted: 41 });

      expect(error instanceof RefUnknownError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new RefUnknownError({ ref: 99, highestMinted: 41 });

      expect(error instanceof Error).toBe(true);
    });
  });
});

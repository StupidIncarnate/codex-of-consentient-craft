import { RefStaleError } from './ref-stale-error';

describe('RefStaleError', () => {
  describe('constructor()', () => {
    it('VALID: {ref, boundary: navigation} => renders the whole message, naming the boundary and the recovery', () => {
      const error = new RefStaleError({ ref: 23, boundary: 'navigation' });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RefStaleError',
        message:
          'STALE REF: ref 23 no longer reaches an element — boundary crossed: navigation. A ref binds to an ELEMENT and never to a row number, so this is never a different element. Run `look` again for the current key.',
      });
    });

    it('VALID: {ref, boundary: detached} => renders the detached boundary', () => {
      const error = new RefStaleError({ ref: 7, boundary: 'detached' });

      expect(error.message).toBe(
        'STALE REF: ref 7 no longer reaches an element — boundary crossed: detached. A ref binds to an ELEMENT and never to a row number, so this is never a different element. Run `look` again for the current key.',
      );
    });

    it('VALID: {ref, boundary} => carries both, so a caller can act without parsing the message', () => {
      const error = new RefStaleError({ ref: 23, boundary: 'navigation' });

      expect({ ref: error.ref, boundary: error.boundary }).toStrictEqual({
        ref: 23,
        boundary: 'navigation',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof RefStaleError => returns true', () => {
      const error = new RefStaleError({ ref: 1, boundary: 'detached' });

      expect(error instanceof RefStaleError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new RefStaleError({ ref: 1, boundary: 'detached' });

      expect(error instanceof Error).toBe(true);
    });
  });
});

import { dmResponseBodyContract } from './dm-response-body-contract';
import { DmResponseBodyStub } from './dm-response-body.stub';

describe('dmResponseBodyContract', () => {
  describe('valid inputs', () => {
    it('VALID: {default stub} => returns the object', () => {
      expect(DmResponseBodyStub()).toStrictEqual({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
    });

    it('VALID: {nested arrays and objects} => returns them whole', () => {
      const result = dmResponseBodyContract.parse({ items: [1, 'a', null, { ok: true }] });

      expect(result).toStrictEqual({ items: [1, 'a', null, { ok: true }] });
    });

    it('EMPTY: {null} => returns null', () => {
      expect(dmResponseBodyContract.parse(null)).toBe(null);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {undefined} => safeParse fails', () => {
      expect(dmResponseBodyContract.safeParse(undefined).success).toBe(false);
    });

    it('INVALID: {function} => safeParse fails', () => {
      expect(dmResponseBodyContract.safeParse(() => 1).success).toBe(false);
    });
  });
});

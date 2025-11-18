import { isKeyOfGuard } from './is-key-of-guard';

const TestObjectStub = () => ({ foo: 1, bar: 2 }) as const;

describe('isKeyOfGuard', () => {
  describe('valid keys', () => {
    it('VALID: returns true for existing key', () => {
      const obj = TestObjectStub();

      const result = isKeyOfGuard('foo', obj);

      expect(result).toBe(true);
    });

    it('VALID: returns true for another existing key', () => {
      const obj = TestObjectStub();

      const result = isKeyOfGuard('bar', obj);

      expect(result).toBe(true);
    });
  });

  describe('invalid keys', () => {
    it('INVALID: returns false for non-existing key', () => {
      const obj = TestObjectStub();

      const result = isKeyOfGuard('baz', obj);

      expect(result).toBe(false);
    });

    it('INVALID: returns false for empty string', () => {
      const obj = TestObjectStub();

      const result = isKeyOfGuard('', obj);

      expect(result).toBe(false);
    });
  });
});

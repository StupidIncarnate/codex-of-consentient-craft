import { uuidContract } from './uuid-contract';
import { UuidStub } from './uuid.stub';

describe('uuidContract', () => {
  describe('valid UUIDs', () => {
    it('VALID: {standard UUID v4} => parses successfully', () => {
      const result = uuidContract.parse('f47ac10b-58cc-4372-a567-0e02b2c3d479');

      expect(result).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('VALID: {different UUID} => parses successfully', () => {
      const result = uuidContract.parse('e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b');

      expect(result).toBe('e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b');
    });

    it('VALID: {lowercase UUID} => parses successfully', () => {
      const result = uuidContract.parse('550e8400-e29b-41d4-a716-446655440000');

      expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('invalid UUIDs', () => {
    it('INVALID_UUID: {empty string} => throws validation error', () => {
      expect(() => uuidContract.parse('')).toThrow(/invalid uuid/iu);
    });

    it('INVALID_UUID: {non-UUID string} => throws validation error', () => {
      expect(() => uuidContract.parse('not-a-uuid')).toThrow(/invalid uuid/iu);
    });

    it('INVALID_UUID: {UUID without hyphens} => throws validation error', () => {
      expect(() => uuidContract.parse('f47ac10b58cc4372a5670e02b2c3d479')).toThrow(
        /invalid uuid/iu,
      );
    });

    it('INVALID_UUID: {partial UUID} => throws validation error', () => {
      expect(() => uuidContract.parse('f47ac10b-58cc-4372')).toThrow(/invalid uuid/iu);
    });
  });
});

describe('UuidStub', () => {
  it('VALID: {default} => returns valid UUID', () => {
    const result = UuidStub();

    expect(result).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  });

  it('VALID: {custom value} => returns custom UUID', () => {
    const result = UuidStub({ value: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b' });

    expect(result).toBe('e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b');
  });
});

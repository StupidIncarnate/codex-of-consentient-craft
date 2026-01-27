import { cryptoRandomUuidAdapter } from './crypto-random-uuid-adapter';
import { cryptoRandomUuidAdapterProxy } from './crypto-random-uuid-adapter.proxy';
import { UuidStub } from '../../../contracts/uuid/uuid.stub';

describe('cryptoRandomUuidAdapter', () => {
  describe('UUID generation', () => {
    it('VALID: {default} => returns a valid UUID', () => {
      const proxy = cryptoRandomUuidAdapterProxy();
      const expectedUuid = UuidStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.setupReturns({ uuid: expectedUuid });

      const result = cryptoRandomUuidAdapter();

      expect(result).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('VALID: {different UUID} => returns the generated UUID', () => {
      const proxy = cryptoRandomUuidAdapterProxy();
      const expectedUuid = UuidStub({ value: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b' });

      proxy.setupReturns({ uuid: expectedUuid });

      const result = cryptoRandomUuidAdapter();

      expect(result).toBe('e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b');
    });

    it('VALID: {another UUID} => returns correct branded type', () => {
      const proxy = cryptoRandomUuidAdapterProxy();
      const expectedUuid = UuidStub({ value: '550e8400-e29b-41d4-a716-446655440000' });

      proxy.setupReturns({ uuid: expectedUuid });

      const result = cryptoRandomUuidAdapter();

      expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });
});

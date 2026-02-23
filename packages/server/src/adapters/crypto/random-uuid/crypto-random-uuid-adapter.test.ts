import { ProcessIdStub } from '../../../contracts/process-id/process-id.stub';
import { cryptoRandomUuidAdapterProxy } from './crypto-random-uuid-adapter.proxy';
import { cryptoRandomUuidAdapter } from './crypto-random-uuid-adapter';

describe('cryptoRandomUuidAdapter', () => {
  describe('uuid generation', () => {
    it('VALID: {} => returns branded ProcessId', () => {
      const proxy = cryptoRandomUuidAdapterProxy();
      const expected = ProcessIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      proxy.returns({ uuid: expected });

      const result = cryptoRandomUuidAdapter();

      expect(result).toBe(expected);
    });
  });
});

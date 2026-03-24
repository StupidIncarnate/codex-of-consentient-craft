import { mswRequestIdContract } from './msw-request-id-contract';
import { MswRequestIdStub } from './msw-request-id.stub';

describe('mswRequestIdContract', () => {
  describe('valid values', () => {
    it('VALID: {value: "msw-req-001"} => parses successfully', () => {
      const id = MswRequestIdStub({ value: 'msw-req-001' });

      const parsed = mswRequestIdContract.parse(id);

      expect(parsed).toBe('msw-req-001');
    });

    it('VALID: {default value} => parses default stub', () => {
      const id = MswRequestIdStub();

      const parsed = mswRequestIdContract.parse(id);

      expect(parsed).toBe('msw-req-001');
    });
  });

  describe('invalid values', () => {
    it('INVALID_TYPE: {value: number} => throws validation error', () => {
      expect(() => {
        return mswRequestIdContract.parse(123 as never);
      }).toThrow(/Expected string/u);
    });
  });
});

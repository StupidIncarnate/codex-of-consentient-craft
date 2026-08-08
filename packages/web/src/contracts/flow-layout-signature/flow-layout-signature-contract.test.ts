import { flowLayoutSignatureContract } from './flow-layout-signature-contract';
import { FlowLayoutSignatureStub } from './flow-layout-signature.stub';

describe('flowLayoutSignatureContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value omitted} => returns the stub default signature', () => {
      const result = FlowLayoutSignatureStub();

      expect(result).toBe('{"id":"login-flow","nodes":[]}');
    });

    it('VALID: {value: serialized flow} => returns that string unchanged', () => {
      const result = FlowLayoutSignatureStub({
        value: '{"id":"checkout-flow","nodes":[{"id":"a"}]}',
      });

      expect(result).toBe('{"id":"checkout-flow","nodes":[{"id":"a"}]}');
    });

    it('VALID: {value: "x"} => returns a valid FlowLayoutSignature branded string', () => {
      const result = flowLayoutSignatureContract.parse('x');

      expect(result).toBe('x');
    });
  });

  describe('invalid inputs', () => {
    it('EMPTY: {value: ""} => throws for an empty signature', () => {
      expect(() => FlowLayoutSignatureStub({ value: '' })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('INVALID: {value: 5} => throws for non-string', () => {
      expect(() => FlowLayoutSignatureStub({ value: 5 as never })).toThrow(
        /Expected string, received number/u,
      );
    });
  });
});

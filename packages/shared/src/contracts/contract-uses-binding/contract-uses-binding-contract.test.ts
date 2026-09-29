import { ContractUsesBindingStub } from './contract-uses-binding.stub';
import { contractUsesBindingContract } from './contract-uses-binding-contract';

describe('contractUsesBindingContract', () => {
  describe('valid input', () => {
    it('VALID: {defaults} => returns a value import of one contract', () => {
      const result = ContractUsesBindingStub();

      expect(result).toStrictEqual({
        localName: 'thingContract',
        targetFile: '/repo/packages/example/src/contracts/thing/thing-contract.ts',
        isTypeOnly: false,
      });
    });

    it('VALID: {isTypeOnly: true} => keeps the type-only flag', () => {
      const result = ContractUsesBindingStub({ isTypeOnly: true });

      expect(result.isTypeOnly).toBe(true);
    });
  });

  describe('invalid input', () => {
    it('INVALID: {targetFile: relative} => throws ZodError', () => {
      expect(() =>
        contractUsesBindingContract.parse({
          ...ContractUsesBindingStub(),
          targetFile: 'a-contract.ts',
        }),
      ).toThrow(/Path must be absolute/u);
    });
  });
});

import { InstanceStateResolveResultStub } from './instance-state-resolve-result.stub';
import { instanceStateResolveResultContract } from './instance-state-resolve-result-contract';

describe('instanceStateResolveResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = InstanceStateResolveResultStub();

      expect(instanceStateResolveResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {state: wrong type} => throws', () => {
      expect(() =>
        instanceStateResolveResultContract.parse({
          ...InstanceStateResolveResultStub(),
          state: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});

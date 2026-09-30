import { ArchitectureResponderAnnotationsResultStub } from './architecture-responder-annotations-result.stub';
import { architectureResponderAnnotationsResultContract } from './architecture-responder-annotations-result-contract';

describe('architectureResponderAnnotationsResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = ArchitectureResponderAnnotationsResultStub();

      expect(architectureResponderAnnotationsResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {responderAnnotations: wrong type} => throws', () => {
      expect(() =>
        architectureResponderAnnotationsResultContract.parse({
          ...ArchitectureResponderAnnotationsResultStub(),
          responderAnnotations: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});

import { typescriptNodeFactoryContract } from './typescript-node-factory-contract';
import { TypescriptNodeFactoryStub } from './typescript-node-factory.stub';

describe('typescriptNodeFactoryContract', () => {
  describe('valid factories', () => {
    it('VALID: {any value} => returns TypescriptNodeFactory', () => {
      const result = typescriptNodeFactoryContract.parse(undefined);

      expect(result).toBe(undefined);
    });
  });

  describe('TypescriptNodeFactoryStub', () => {
    it('VALID: {value: undefined} => returns TypescriptNodeFactory', () => {
      const result = TypescriptNodeFactoryStub({ value: undefined });

      expect(result).toBe(undefined);
    });
  });
});

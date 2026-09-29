import { ContractIndexEntryStub } from './contract-index-entry.stub';
import { contractIndexEntryContract } from './contract-index-entry-contract';

describe('contractIndexEntryContract', () => {
  describe('valid input', () => {
    it('VALID: {defaults} => returns an unparsed entry with one inferred type', () => {
      const result = ContractIndexEntryStub();

      expect(result).toStrictEqual({
        filePath: '/repo/packages/example/src/contracts/thing/thing-contract.ts',
        packageName: '@repo/example',
        isLayer: false,
        exportedContractNames: ['thingContract'],
        typeExports: [{ typeName: 'Thing', isSchemaInferred: true, isExempt: false }],
        parseSites: [],
        nestedInFiles: [],
        isParsed: false,
      });
    });

    it('VALID: {one parse site} => keeps the file and line', () => {
      const result = contractIndexEntryContract.parse({
        ...ContractIndexEntryStub(),
        parseSites: [{ filePath: '/repo/a.ts', line: 7 }],
        isParsed: true,
      });

      expect(result.parseSites).toStrictEqual([{ filePath: '/repo/a.ts', line: 7 }]);
    });
  });

  describe('invalid input', () => {
    it('INVALID: {filePath: relative} => throws ZodError', () => {
      expect(() =>
        contractIndexEntryContract.parse({
          ...ContractIndexEntryStub(),
          filePath: 'a/b-contract.ts',
        }),
      ).toThrow(/Path must be absolute/u);
    });
  });
});

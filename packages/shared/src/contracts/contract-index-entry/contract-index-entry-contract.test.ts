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
        wholeParseSites: [],
        nestedInFiles: [],
        isParsed: false,
        isWholeParsed: false,
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

  describe('whole parse', () => {
    it('VALID: {one whole parse site} => keeps the site and the whole-parsed flag', () => {
      const result = contractIndexEntryContract.parse({
        ...ContractIndexEntryStub(),
        parseSites: [{ filePath: '/repo/a.ts', line: 7 }],
        wholeParseSites: [{ filePath: '/repo/a.ts', line: 7 }],
        isParsed: true,
        isWholeParsed: true,
      });

      expect({ sites: result.wholeParseSites, whole: result.isWholeParsed }).toStrictEqual({
        sites: [{ filePath: '/repo/a.ts', line: 7 }],
        whole: true,
      });
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

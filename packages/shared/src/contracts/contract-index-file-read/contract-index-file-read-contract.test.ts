import { ContractIndexFileReadStub } from './contract-index-file-read.stub';
import { contractIndexFileReadContract } from './contract-index-file-read-contract';

describe('contractIndexFileReadContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses to an empty read', () => {
      expect(contractIndexFileReadContract.parse(ContractIndexFileReadStub())).toStrictEqual({
        imports: [],
        reExports: [],
        exports: null,
        parseCalls: [],
        valueNames: [],
      });
    });

    it('VALID: {a contract file that parses an imported name} => keeps every part', () => {
      const read = ContractIndexFileReadStub({
        imports: [
          {
            localName: 'aContract',
            importedName: 'aContract',
            specifier: '../a/a-contract',
            isTypeOnly: false,
          },
        ],
        exports: { exportedContractNames: ['bContract'], typeExports: [] },
        parseCalls: [{ line: 3, parsedNames: ['aContract'], wholeNames: ['aContract'] }],
        valueNames: ['aContract'],
      });

      expect(contractIndexFileReadContract.parse(read)).toStrictEqual({
        imports: [
          {
            localName: 'aContract',
            importedName: 'aContract',
            specifier: '../a/a-contract',
            isTypeOnly: false,
          },
        ],
        reExports: [],
        exports: { exportedContractNames: ['bContract'], typeExports: [] },
        parseCalls: [{ line: 3, parsedNames: ['aContract'], wholeNames: ['aContract'] }],
        valueNames: ['aContract'],
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {parseCalls line 0} => throws', () => {
      expect(() =>
        contractIndexFileReadContract.parse({
          ...ContractIndexFileReadStub(),
          parseCalls: [{ line: 0, parsedNames: [], wholeNames: [] }],
        }),
      ).toThrow(/>=1/u);
    });

    it('INVALID: {reExports kind "default"} => throws', () => {
      expect(() =>
        contractIndexFileReadContract.parse({
          ...ContractIndexFileReadStub(),
          reExports: [{ kind: 'default', exportedName: 'a', sourceName: 'a', specifier: './a' }],
        }),
      ).toThrow(/Invalid option/u);
    });
  });
});

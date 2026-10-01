import { ContractIndexFileReadStub } from '../../contracts/contract-index-file-read/contract-index-file-read.stub';
import { ContractIndexPackageStub } from '../../contracts/contract-index-package/contract-index-package.stub';
import { contractIndexFromReadsTransformer } from './contract-index-from-reads-transformer';

const rootDir = '/repo';
const alpha = ContractIndexPackageStub({ name: '@repo/alpha', dir: '/repo/packages/alpha' });
const thingFile = '/repo/packages/alpha/src/contracts/thing/thing-contract.ts';
const brokerFile = '/repo/packages/alpha/src/brokers/use/use-broker.ts';
const readmeFile = '/repo/packages/alpha/src/statics/x/x-statics.ts';

describe('contractIndexFromReadsTransformer', () => {
  it('VALID: {a broker parses a contract by relative import} => the contract is parsed and whole parsed at that line', () => {
    const result = contractIndexFromReadsTransformer({
      rootDir,
      packages: [alpha],
      files: [
        {
          filePath: thingFile,
          read: ContractIndexFileReadStub({
            exports: { exportedContractNames: ['thingContract'], typeExports: [] },
          }),
        },
        {
          filePath: brokerFile,
          read: ContractIndexFileReadStub({
            imports: [
              {
                localName: 'thingContract',
                importedName: 'thingContract',
                specifier: '../../contracts/thing/thing-contract',
                isTypeOnly: false,
              },
            ],
            parseCalls: [
              { line: 2, parsedNames: ['thingContract'], wholeNames: ['thingContract'] },
            ],
            valueNames: ['thingContract'],
          }),
        },
        { filePath: readmeFile, read: null },
      ],
    });

    expect(result).toStrictEqual([
      {
        filePath: thingFile,
        packageName: '@repo/alpha',
        isLayer: false,
        exportedContractNames: ['thingContract'],
        typeExports: [],
        parseSites: [{ filePath: brokerFile, line: 2 }],
        wholeParseSites: [{ filePath: brokerFile, line: 2 }],
        nestedInFiles: [],
        isParsed: true,
        isWholeParsed: true,
      },
    ]);
  });

  it('EMPTY: {no files} => returns no entries', () => {
    expect(
      contractIndexFromReadsTransformer({ rootDir, packages: [alpha], files: [] }),
    ).toStrictEqual([]);
  });
});

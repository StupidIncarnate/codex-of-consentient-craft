import { ContractIndexFileReadStub } from '../../contracts/contract-index-file-read/contract-index-file-read.stub';
import { contractUsesResolveLayerTransformer } from './contract-uses-resolve-layer-transformer';

const filePath = '/repo/packages/a/src/brokers/x/x-broker.ts';
const thingFile = '/repo/packages/a/src/contracts/thing/thing-contract.ts';

describe('contractUsesResolveLayerTransformer', () => {
  it('VALID: {two names landing on one contract in one call} => one parse site for that contract', () => {
    const read = ContractIndexFileReadStub({
      parseCalls: [
        { line: 4, parsedNames: ['thingContract', 'aliasContract'], wholeNames: ['aliasContract'] },
      ],
      valueNames: ['thingContract', 'aliasContract'],
    });

    const result = contractUsesResolveLayerTransformer({
      filePath,
      read,
      targetByLocalName: new Map([
        ['thingContract', thingFile],
        ['aliasContract', thingFile],
      ]),
    });

    expect(result).toStrictEqual({
      parseSites: [{ targetFile: thingFile, site: { filePath, line: 4 } }],
      wholeParseSites: [{ targetFile: thingFile, site: { filePath, line: 4 } }],
      valueTargets: [thingFile],
    });
  });

  it('EMPTY: {names that land on no contract} => drops them', () => {
    const read = ContractIndexFileReadStub({
      parseCalls: [{ line: 1, parsedNames: ['z'], wholeNames: ['z'] }],
      valueNames: ['z'],
    });

    const result = contractUsesResolveLayerTransformer({
      filePath,
      read,
      targetByLocalName: new Map(),
    });

    expect(result).toStrictEqual({ parseSites: [], wholeParseSites: [], valueTargets: [] });
  });
});

import { contractIndexFileReadTransformer } from './contract-index-file-read-transformer';

const brokerFile = '/repo/packages/a/src/brokers/x/x-broker.ts';
const contractFile = '/repo/packages/a/src/contracts/x/x-contract.ts';

describe('contractIndexFileReadTransformer', () => {
  describe('a production file', () => {
    it('VALID: {imports a contract by value and a type, parses the value} => records links and uses by local name, never the type-only one', () => {
      const result = contractIndexFileReadTransformer({
        filePath: brokerFile,
        text: [
          "import { thingContract } from '../../contracts/thing/thing-contract';",
          "import type { Other } from '../../contracts/other/other-contract';",
          'export const xBroker = (value: unknown): Other => thingContract.parse(value);',
        ].join('\n'),
        isContractFile: false,
      });

      expect(result).toStrictEqual({
        imports: [
          {
            localName: 'thingContract',
            importedName: 'thingContract',
            specifier: '../../contracts/thing/thing-contract',
            isTypeOnly: false,
          },
          {
            localName: 'Other',
            importedName: 'Other',
            specifier: '../../contracts/other/other-contract',
            isTypeOnly: true,
          },
        ],
        reExports: [],
        exports: null,
        parseCalls: [{ line: 3, parsedNames: ['thingContract'], wholeNames: ['thingContract'] }],
        valueNames: ['thingContract'],
      });
    });
  });

  describe('a contract file', () => {
    it('VALID: {isContractFile: true} => also records its exported consts and types', () => {
      const result = contractIndexFileReadTransformer({
        filePath: contractFile,
        text: [
          "export const xContract = z.object({ id: z.string().brand<'XId'>() }).brand<'X'>();",
          'export type X = z.infer<typeof xContract>;',
        ].join('\n'),
        isContractFile: true,
      });

      expect(result).toStrictEqual({
        imports: [],
        reExports: [],
        exports: {
          exportedContractNames: ['xContract'],
          typeExports: [{ typeName: 'X', isSchemaInferred: true, isExempt: false }],
        },
        parseCalls: [],
        valueNames: [],
      });
    });
  });

  describe('a barrel', () => {
    it('VALID: {star and named re-exports} => records both links', () => {
      const result = contractIndexFileReadTransformer({
        filePath: '/repo/packages/a/src/contracts/contracts.ts',
        text: "export * from './x/x-contract';\nexport { yContract as zContract } from './y/y-contract';",
        isContractFile: false,
      });

      expect(result.reExports).toStrictEqual([
        { kind: 'star', exportedName: '*', sourceName: '*', specifier: './x/x-contract' },
        {
          kind: 'named',
          exportedName: 'zContract',
          sourceName: 'yContract',
          specifier: './y/y-contract',
        },
      ]);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {text: ""} => returns an empty read', () => {
      expect(
        contractIndexFileReadTransformer({ filePath: brokerFile, text: '', isContractFile: false }),
      ).toStrictEqual({
        imports: [],
        reExports: [],
        exports: null,
        parseCalls: [],
        valueNames: [],
      });
    });
  });
});

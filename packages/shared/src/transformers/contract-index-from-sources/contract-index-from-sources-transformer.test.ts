import { ContentTextStub } from '../../contracts/content-text/content-text.stub';
import { ContractIndexPackageStub } from '../../contracts/contract-index-package/contract-index-package.stub';
import { PackageNameStub } from '../../contracts/package-name/package-name.stub';
import { contractIndexFromSourcesTransformer } from './contract-index-from-sources-transformer';

const rootDir = '/repo';
const alphaDir = '/repo/packages/alpha';
const betaDir = '/repo/packages/beta';
const alphaPackage = ContractIndexPackageStub({
  name: PackageNameStub({ value: '@repo/alpha' }),
  dir: alphaDir,
});
const betaPackage = ContractIndexPackageStub({
  name: PackageNameStub({ value: '@repo/beta' }),
  dir: betaDir,
});

const ONE_CONTRACT_TEXT = ContentTextStub({
  value: [
    "import { z } from 'zod';",
    "export const oneContract = z.string().brand<'one'>();",
    'export type one = z.infer<typeof oneContract>;',
    '',
  ].join('\n'),
});
const TWO_CONTRACT_TEXT = ContentTextStub({
  value: [
    "import { z } from 'zod';",
    "export const twoContract = z.string().brand<'two'>();",
    'export type two = z.infer<typeof twoContract>;',
    '',
  ].join('\n'),
});
const INNER_CONTRACT_TEXT = ContentTextStub({
  value: [
    "import { z } from 'zod';",
    "export const innerContract = z.string().brand<'inner'>();",
    'export type inner = z.infer<typeof innerContract>;',
    '',
  ].join('\n'),
});
const DETAIL_CONTRACT_TEXT = ContentTextStub({
  value: [
    "import { z } from 'zod';",
    "export const detailContract = z.string().brand<'detail'>();",
    'export type detail = z.infer<typeof detailContract>;',
    '',
  ].join('\n'),
});

describe('contractIndexFromSourcesTransformer', () => {
  describe('parse detection', () => {
    it('VALID: {a broker parses one contract, another is never parsed} => marks only the parsed one', () => {
      const parsedFile = '/repo/packages/alpha/src/contracts/one/one-contract.ts';
      const lonelyFile = '/repo/packages/alpha/src/contracts/two/two-contract.ts';
      const brokerFile = '/repo/packages/alpha/src/brokers/use/use-broker.ts';

      const result = contractIndexFromSourcesTransformer({
        rootDir,
        packages: [alphaPackage, betaPackage],
        sources: [
          { filePath: parsedFile, text: ONE_CONTRACT_TEXT },
          { filePath: lonelyFile, text: TWO_CONTRACT_TEXT },
          {
            filePath: brokerFile,
            text: ContentTextStub({
              value:
                "import { oneContract } from '../../contracts/one/one-contract';\nexport const useBroker = (v: unknown) => oneContract.parse(v);",
            }),
          },
        ],
      });

      expect(result).toStrictEqual([
        {
          filePath: parsedFile,
          packageName: '@repo/alpha',
          isLayer: false,
          exportedContractNames: ['oneContract'],
          typeExports: [{ typeName: 'one', isSchemaInferred: true, isExempt: false }],
          parseSites: [{ filePath: brokerFile, line: 2 }],
          nestedInFiles: [],
          isParsed: true,
        },
        {
          filePath: lonelyFile,
          packageName: '@repo/alpha',
          isLayer: false,
          exportedContractNames: ['twoContract'],
          typeExports: [{ typeName: 'two', isSchemaInferred: true, isExempt: false }],
          parseSites: [],
          nestedInFiles: [],
          isParsed: false,
        },
      ]);
    });

    it('VALID: {a parse that only a test file makes} => the contract stays unparsed', () => {
      const contractFile = '/repo/packages/alpha/src/contracts/one/one-contract.ts';

      const result = contractIndexFromSourcesTransformer({
        rootDir,
        packages: [alphaPackage, betaPackage],
        sources: [
          { filePath: contractFile, text: ONE_CONTRACT_TEXT },
          {
            filePath: '/repo/packages/alpha/src/contracts/one/one-contract.test.ts',
            text: ContentTextStub({
              value: "import { oneContract } from './one-contract';\noneContract.parse('x');",
            }),
          },
        ],
      });

      expect(result).toStrictEqual([
        {
          filePath: contractFile,
          packageName: '@repo/alpha',
          isLayer: false,
          exportedContractNames: ['oneContract'],
          typeExports: [{ typeName: 'one', isSchemaInferred: true, isExempt: false }],
          parseSites: [],
          nestedInFiles: [],
          isParsed: false,
        },
      ]);
    });
  });

  describe('harness parses', () => {
    it('VALID: {a test/harnesses file parses the contract} => the parse site is the harness and the contract counts as parsed', () => {
      const contractFile = '/repo/packages/alpha/src/contracts/one/one-contract.ts';
      const harnessFile = '/repo/packages/beta/test/harnesses/mock/mock.harness.ts';

      const result = contractIndexFromSourcesTransformer({
        rootDir,
        packages: [alphaPackage, betaPackage],
        sources: [
          { filePath: contractFile, text: ONE_CONTRACT_TEXT },
          {
            filePath: harnessFile,
            text: ContentTextStub({
              value:
                "import { oneContract } from '@repo/alpha/contracts';\nexport const enqueue = (v: unknown) => oneContract.parse(v);",
            }),
          },
          {
            filePath: '/repo/packages/alpha/contracts.ts',
            text: ContentTextStub({
              value: "export * from './src/contracts/one/one-contract';\n// contract barrel",
            }),
          },
        ],
      });

      expect(result).toStrictEqual([
        {
          filePath: contractFile,
          packageName: '@repo/alpha',
          isLayer: false,
          exportedContractNames: ['oneContract'],
          typeExports: [{ typeName: 'one', isSchemaInferred: true, isExempt: false }],
          parseSites: [{ filePath: harnessFile, line: 2 }],
          nestedInFiles: [],
          isParsed: true,
        },
      ]);
    });

    it('VALID: {a test, a stub and a proxy inside test/harnesses parse the contract} => the contract stays unparsed', () => {
      const contractFile = '/repo/packages/alpha/src/contracts/one/one-contract.ts';
      const parseText = ContentTextStub({
        value: "import { oneContract } from '@repo/alpha/contracts';\noneContract.parse('x');",
      });

      const result = contractIndexFromSourcesTransformer({
        rootDir,
        packages: [alphaPackage, betaPackage],
        sources: [
          { filePath: contractFile, text: ONE_CONTRACT_TEXT },
          {
            filePath: '/repo/packages/alpha/contracts.ts',
            text: ContentTextStub({
              value: "export * from './src/contracts/one/one-contract';\n// contract barrel",
            }),
          },
          {
            filePath: '/repo/packages/beta/test/harnesses/mock/mock.harness.test.ts',
            text: parseText,
          },
          {
            filePath: '/repo/packages/beta/test/harnesses/mock/mock.stub.ts',
            text: parseText,
          },
          {
            filePath: '/repo/packages/beta/test/harnesses/mock/mock.harness.proxy.ts',
            text: parseText,
          },
        ],
      });

      expect(result).toStrictEqual([
        {
          filePath: contractFile,
          packageName: '@repo/alpha',
          isLayer: false,
          exportedContractNames: ['oneContract'],
          typeExports: [{ typeName: 'one', isSchemaInferred: true, isExempt: false }],
          parseSites: [],
          nestedInFiles: [],
          isParsed: false,
        },
      ]);
    });
  });

  describe('types-only contract files', () => {
    it('VALID: {a file exporting only call-signature and method-set types} => no contract names, every type exempt, not parsed', () => {
      const handleFile = '/repo/packages/alpha/src/contracts/mock-handle/mock-handle-contract.ts';

      const result = contractIndexFromSourcesTransformer({
        rootDir,
        packages: [alphaPackage, betaPackage],
        sources: [
          {
            filePath: handleFile,
            text: ContentTextStub({
              value: [
                'export type MockHandle = {',
                '  callsMatching: {',
                '    (args: readonly []): RecordedCalls;',
                '    (args: readonly unknown[]): unknown[][];',
                '  };',
                '};',
                'export interface RecordedCalls {',
                '  readonly length: number;',
                '  map: <U>(fn: (call: unknown[], index: number) => U) => U[];',
                '}',
                '',
              ].join('\n'),
            }),
          },
        ],
      });

      expect(result).toStrictEqual([
        {
          filePath: handleFile,
          packageName: '@repo/alpha',
          isLayer: false,
          exportedContractNames: [],
          typeExports: [
            { typeName: 'MockHandle', isSchemaInferred: false, isExempt: true },
            { typeName: 'RecordedCalls', isSchemaInferred: false, isExempt: true },
          ],
          parseSites: [],
          nestedInFiles: [],
          isParsed: false,
        },
      ]);
    });
  });

  describe('nested contracts', () => {
    it('VALID: {a parsed contract uses another as a value} => the nested one counts as parsed', () => {
      const innerFile = '/repo/packages/alpha/src/contracts/inner/inner-contract.ts';
      const outerFile = '/repo/packages/alpha/src/contracts/outer/outer-contract.ts';
      const brokerFile = '/repo/packages/alpha/src/brokers/use/use-broker.ts';

      const result = contractIndexFromSourcesTransformer({
        rootDir,
        packages: [alphaPackage, betaPackage],
        sources: [
          { filePath: innerFile, text: INNER_CONTRACT_TEXT },
          {
            filePath: outerFile,
            text: ContentTextStub({
              value: [
                "import { z } from 'zod';",
                "import { innerContract } from '../inner/inner-contract';",
                'export const outerContract = z.object({ inner: innerContract });',
                'export type Outer = z.infer<typeof outerContract>;',
                '',
              ].join('\n'),
            }),
          },
          {
            filePath: brokerFile,
            text: ContentTextStub({
              value:
                "import { outerContract } from '../../contracts/outer/outer-contract';\nexport const useBroker = (v: unknown) => outerContract.parse(v);",
            }),
          },
        ],
      });

      expect(result).toStrictEqual([
        {
          filePath: innerFile,
          packageName: '@repo/alpha',
          isLayer: false,
          exportedContractNames: ['innerContract'],
          typeExports: [{ typeName: 'inner', isSchemaInferred: true, isExempt: false }],
          parseSites: [],
          nestedInFiles: [outerFile],
          isParsed: true,
        },
        {
          filePath: outerFile,
          packageName: '@repo/alpha',
          isLayer: false,
          exportedContractNames: ['outerContract'],
          typeExports: [{ typeName: 'Outer', isSchemaInferred: true, isExempt: false }],
          parseSites: [{ filePath: brokerFile, line: 2 }],
          nestedInFiles: [],
          isParsed: true,
        },
      ]);
    });
  });

  describe('barrels and layers', () => {
    it('VALID: {a contract parsed through another package barrel, and a layer contract} => resolves the barrel and flags the layer', () => {
      const contractFile = '/repo/packages/alpha/src/contracts/one/one-contract.ts';
      const layerFile = '/repo/packages/alpha/src/contracts/one/detail-layer-contract.ts';
      const brokerFile = '/repo/packages/beta/src/brokers/use/use-broker.ts';

      const result = contractIndexFromSourcesTransformer({
        rootDir,
        packages: [alphaPackage, betaPackage],
        sources: [
          { filePath: contractFile, text: ONE_CONTRACT_TEXT },
          { filePath: layerFile, text: DETAIL_CONTRACT_TEXT },
          {
            filePath: '/repo/packages/alpha/contracts.ts',
            text: ContentTextStub({
              value: "export * from './src/contracts/one/one-contract';\n// contract barrel",
            }),
          },
          {
            filePath: brokerFile,
            text: ContentTextStub({
              value:
                "import { oneContract } from '@repo/alpha/contracts';\nexport const useBroker = (v: unknown) => oneContract.safeParse(v);",
            }),
          },
        ],
      });

      expect(result).toStrictEqual([
        {
          filePath: contractFile,
          packageName: '@repo/alpha',
          isLayer: false,
          exportedContractNames: ['oneContract'],
          typeExports: [{ typeName: 'one', isSchemaInferred: true, isExempt: false }],
          parseSites: [{ filePath: brokerFile, line: 2 }],
          nestedInFiles: [],
          isParsed: true,
        },
        {
          filePath: layerFile,
          packageName: '@repo/alpha',
          isLayer: true,
          exportedContractNames: ['detailContract'],
          typeExports: [{ typeName: 'detail', isSchemaInferred: true, isExempt: false }],
          parseSites: [],
          nestedInFiles: [],
          isParsed: false,
        },
      ]);
    });

    it('EMPTY: {no sources} => returns an empty index', () => {
      const result = contractIndexFromSourcesTransformer({
        rootDir,
        packages: [alphaPackage, betaPackage],
        sources: [],
      });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {contract outside every package} => reports package unknown', () => {
      const contractFile = '/repo/tools/src/contracts/one/one-contract.ts';

      const result = contractIndexFromSourcesTransformer({
        rootDir,
        packages: [alphaPackage, betaPackage],
        sources: [{ filePath: contractFile, text: ONE_CONTRACT_TEXT }],
      });

      expect(result).toStrictEqual([
        {
          filePath: contractFile,
          packageName: 'unknown',
          isLayer: false,
          exportedContractNames: ['oneContract'],
          typeExports: [{ typeName: 'one', isSchemaInferred: true, isExempt: false }],
          parseSites: [],
          nestedInFiles: [],
          isParsed: false,
        },
      ]);
    });
  });
});

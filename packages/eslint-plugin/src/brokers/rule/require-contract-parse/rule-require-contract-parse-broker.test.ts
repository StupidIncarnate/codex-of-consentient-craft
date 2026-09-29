import { ruleTesterHarness } from '../../../../test/harnesses/rule-tester/rule-tester.harness';
import { ruleRequireContractParseBroker } from './rule-require-contract-parse-broker';
import { ruleRequireContractParseBrokerProxy } from './rule-require-contract-parse-broker.proxy';

const ruleTester = ruleTesterHarness();

// The rule builds its index from the staged tree once per process, so staging every case
// identically leaves the first case to build it and the rest to read it back.
beforeEach(() => {
  const proxy = ruleRequireContractParseBrokerProxy();
  proxy.setupProject({
    parsedContractText: [
      "import { z } from 'zod';",
      "export const thingContract = z.string().brand<'Thing'>();",
      'export type Thing = z.infer<typeof thingContract>;',
      '',
    ].join('\n'),
    lonelyContractText: [
      "import { z } from 'zod';",
      "export const lonelyContract = z.string().brand<'Lonely'>();",
      'export type Lonely = z.infer<typeof lonelyContract>;',
      '',
    ].join('\n'),
    functionTypesContractText: [
      'export type OnLine = (line: string) => void;',
      'export interface Loader {',
      '  load: () => void;',
      '  clear: () => void;',
      '}',
      '',
    ].join('\n'),
    dataTypeContractText: 'export type Plain = { name: string };\n',
    driftedTypeContractText: [
      "import { z } from 'zod';",
      "export const driftedContract = z.string().brand<'Drifted'>();",
      "export type Drifted = string & { readonly __brand: 'Drifted' };",
      '',
    ].join('\n'),
    parsingBrokerText: [
      "import { thingContract } from '../../contracts/thing/thing-contract';",
      'export const useBroker = ({ value }: { value: unknown }) => thingContract.parse(value);',
      '',
    ].join('\n'),
  });
});

ruleTester.run('require-contract-parse', ruleRequireContractParseBroker(), {
  valid: [
    {
      code: 'export const thingContract = 1;',
      filename: '/project/packages/alpha/src/contracts/thing/thing-contract.ts',
    },
    {
      code: 'export const useBroker = 1;',
      filename: '/project/packages/alpha/src/brokers/use/use-broker.ts',
    },
    {
      code: 'export const unknownContract = 1;',
      filename: '/project/packages/alpha/src/contracts/unindexed/unindexed-contract.ts',
    },
    {
      code: 'export const outsideContract = 1;',
      filename: '/project/scripts/outside-contract.ts',
    },
    // A types-only file whose types are function types or a method set: nothing to parse
    {
      code: 'export type OnLine = (line: string) => void;',
      filename: '/project/packages/alpha/src/contracts/handler/handler-contract.ts',
    },
  ],
  invalid: [
    {
      code: 'export const lonelyContract = 1;',
      filename: '/project/packages/alpha/src/contracts/lonely/lonely-contract.ts',
      errors: [{ messageId: 'contractNeverParsed', data: { contractNames: 'lonelyContract' } }],
    },
    // A types-only file holding a plain data type: reported as not schema-inferred, and not as unparsed
    {
      code: 'export type Plain = { name: string };',
      filename: '/project/packages/alpha/src/contracts/plain/plain-contract.ts',
      errors: [
        {
          messageId: 'typeNotSchemaInferred',
          data: { typeName: 'Plain', file: 'plain-contract.ts' },
        },
      ],
    },
    // A file with a const whose exported type is not z.infer of it
    {
      code: 'export const driftedContract = 1;',
      filename: '/project/packages/alpha/src/contracts/drifted/drifted-contract.ts',
      errors: [
        {
          messageId: 'typeNotSchemaInferred',
          data: { typeName: 'Drifted', file: 'drifted-contract.ts' },
        },
        { messageId: 'contractNeverParsed', data: { contractNames: 'driftedContract' } },
      ],
    },
  ],
});

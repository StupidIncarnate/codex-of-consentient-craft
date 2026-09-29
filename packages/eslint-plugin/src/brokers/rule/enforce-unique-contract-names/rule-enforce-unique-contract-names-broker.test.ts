import { ruleTesterHarness } from '../../../../test/harnesses/rule-tester/rule-tester.harness';
import { ruleEnforceUniqueContractNamesBroker } from './rule-enforce-unique-contract-names-broker';
import { ruleEnforceUniqueContractNamesBrokerProxy } from './rule-enforce-unique-contract-names-broker.proxy';

const ruleTester = ruleTesterHarness();

// The rule builds its index from the staged tree once per process, so staging every case
// identically leaves the first case to build it and the rest to read it back.
beforeEach(() => {
  const proxy = ruleEnforceUniqueContractNamesBrokerProxy();
  proxy.setupProject();
});

ruleTester.run('enforce-unique-contract-names', ruleEnforceUniqueContractNamesBroker(), {
  valid: [
    {
      code: 'export const soloContract = 1;',
      filename: '/project/packages/alpha/src/contracts/solo/solo-contract.ts',
    },
    {
      code: 'export const labelContract = 1;',
      filename: '/project/packages/alpha/src/contracts/label/label-contract.ts',
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
  ],
  invalid: [
    {
      code: 'export const thingContract = 1;',
      filename: '/project/packages/alpha/src/contracts/thing/thing-contract.ts',
      errors: [
        {
          messageId: 'duplicateContractName',
          data: { name: 'thingContract', otherPackage: '@project/beta' },
        },
      ],
    },
    {
      code: 'export const thingContract = 1;',
      filename: '/project/packages/beta/src/contracts/thing/thing-contract.ts',
      errors: [
        {
          messageId: 'duplicateContractName',
          data: { name: 'thingContract', otherPackage: '@project/alpha' },
        },
      ],
    },
  ],
});

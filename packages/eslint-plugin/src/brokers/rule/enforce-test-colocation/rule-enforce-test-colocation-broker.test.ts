import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleEnforceTestColocationBroker } from './rule-enforce-test-colocation-broker';
import { ruleEnforceTestColocationBrokerProxy } from './rule-enforce-test-colocation-broker.proxy';

const ruleTester = eslintRuleTesterAdapter();

beforeEach(() => {
  const { fsExistsSync: adapterProxy } = ruleEnforceTestColocationBrokerProxy();

  adapterProxy.setupFileSystem((filePath) => {
    const path = String(filePath);

    // Implementation files that exist
    const existingFiles = [
      '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      '/project/src/contracts/user/user-contract.ts',
      '/project/src/transformers/format-date/format-date-transformer.ts',
      '/project/src/adapters/axios/axios-get.tsx',
      '/project/src/guards/has-permission/has-permission-guard.ts',
      '/project/src/statics/config/config-statics.ts',
      '/project/src/widgets/user-card/user-card-widget.tsx',
      '/project/src/@types/stub-argument.type.ts',
    ];

    return existingFiles.includes(path);
  });
});

ruleTester.run('enforce-test-colocation', ruleEnforceTestColocationBroker(), {
  valid: [
    {
      code: 'describe("test", () => {});',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.test.ts',
    },
    {
      code: 'describe("test", () => {});',
      filename: '/project/src/contracts/user/user-contract.spec.ts',
    },
    {
      code: 'describe("test", () => {});',
      filename: '/project/src/transformers/format-date/format-date-transformer.integration.test.ts',
    },
    {
      code: 'describe("test", () => {});',
      filename: '/project/src/adapters/axios/axios-get.integration.spec.tsx',
    },
    {
      code: 'describe("test", () => {});',
      filename: '/project/src/guards/has-permission/has-permission-guard.test.ts',
    },
    {
      code: 'describe("test", () => {});',
      filename: '/project/src/statics/config/config-statics.spec.ts',
    },
    {
      code: 'describe("test", () => {});',
      filename: '/project/src/widgets/user-card/user-card-widget.test.tsx',
    },
    {
      code: 'describe("test", () => {});',
      filename: '/project/src/@types/stub-argument.test.ts',
    },
    // {
    //   code: 'describe("test", () => {});',
    //   filename: '/project/tests/e2e/user-flow.e2e.test.ts',
    // },
    // {
    //   code: 'describe("test", () => {});',
    //   filename: '/project/tests/e2e/checkout-flow.e2e.spec.ts',
    // },
    {
      code: 'const foo = "bar"',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
    },
    {
      code: 'const foo = "bar"',
      filename: '/project/not-a-test-file.ts',
    },
  ],
  invalid: [
    {
      code: 'describe("test", () => {});',
      filename: '/project/src/brokers/user/fetch/orphaned-test.test.ts',
      errors: [{ messageId: 'testNotColocated' }],
    },
    {
      code: 'describe("test", () => {});',
      filename: '/project/src/contracts/user/user-fetch-broker.spec.ts',
      errors: [{ messageId: 'testNotColocated' }],
    },
    {
      code: 'describe("test", () => {});',
      filename: '/project/src/transformers/missing.integration.test.ts',
      errors: [{ messageId: 'testNotColocated' }],
    },
    {
      code: 'describe("test", () => {});',
      filename: '/project/src/adapters/missing.integration.spec.tsx',
      errors: [{ messageId: 'testNotColocated' }],
    },
    // {
    //   code: 'describe("test", () => {});',
    //   filename: '/project/src/brokers/user/user-flow.e2e.test.ts',
    //   errors: [{ messageId: 'e2eTestInSrc' }],
    // },
    // {
    //   code: 'describe("test", () => {});',
    //   filename: '/project/src/widgets/checkout.e2e.spec.tsx',
    //   errors: [{ messageId: 'e2eTestInSrc' }],
    // },
  ],
});

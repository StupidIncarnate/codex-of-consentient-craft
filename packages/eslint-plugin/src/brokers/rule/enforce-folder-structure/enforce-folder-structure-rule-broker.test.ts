import { createEslintRuleTester } from '../../../../test/helpers/eslint-rule-tester';
import { enforceFolderStructureRuleBroker } from './enforce-folder-structure-rule-broker';

const ruleTester = createEslintRuleTester();

ruleTester.run('enforce-folder-structure', enforceFolderStructureRuleBroker(), {
  valid: [
    {
      code: 'const foo = "bar"',
      filename: '/project/src/contracts/user/user-contract.ts',
    },
    {
      code: 'const foo = "bar"',
      filename: '/project/src/transformers/format-date/format-date-transformer.ts',
    },
    {
      code: 'const foo = "bar"',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
    },
    {
      code: 'const foo = "bar"',
      filename: '/project/src/adapters/axios/axios-get.ts',
    },
    {
      code: 'const foo = "bar"',
      filename: '/project/src/state/user-cache/user-cache-state.ts',
    },
    {
      code: 'const foo = "bar"',
      filename: '/project/not-in-src/utils/helper.ts',
    },
  ],
  invalid: [
    {
      code: 'const foo = "bar"',
      filename: '/project/src/utils/format-date.ts',
      errors: [{ messageId: 'forbiddenFolder' }],
    },
    {
      code: 'const foo = "bar"',
      filename: '/project/src/lib/api-client.ts',
      errors: [{ messageId: 'forbiddenFolder' }],
    },
    {
      code: 'const foo = "bar"',
      filename: '/project/src/helpers/validate-email.ts',
      errors: [{ messageId: 'forbiddenFolder' }],
    },
    {
      code: 'const foo = "bar"',
      filename: '/project/src/services/user-service.ts',
      errors: [{ messageId: 'forbiddenFolder' }],
    },
    {
      code: 'const foo = "bar"',
      filename: '/project/src/types/user.ts',
      errors: [{ messageId: 'forbiddenFolder' }],
    },
    {
      code: 'const foo = "bar"',
      filename: '/project/src/unknown-folder/some-file.ts',
      errors: [{ messageId: 'unknownFolder' }],
    },
    {
      code: 'const foo = "bar"',
      filename: '/project/src/donut/donut-maker.ts',
      errors: [{ messageId: 'unknownFolder' }],
    },
  ],
});

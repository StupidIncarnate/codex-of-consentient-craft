import { eslintRuleTesterAdapter } from '@dungeonmaster/eslint-plugin';
import { ruleBanSyncSeedingMethodsBroker } from './rule-ban-sync-seeding-methods-broker';

const ruleTester = eslintRuleTesterAdapter();
const rule = ruleBanSyncSeedingMethodsBroker();

ruleTester.run('ban-sync-seeding-methods', rule, {
  valid: [
    {
      code: 'const obj = { async seedUser() {} };',
      filename: '/repo/packages/web/test/harness/user.harness.ts',
    },
    {
      code: 'class Harness { async createData() {} }',
      filename: '/repo/packages/web/test/harness/user.harness.ts',
    },
    {
      code: 'class Harness { writeConfig(): Promise<void> {} }',
      filename: '/repo/packages/web/test/harness/user.harness.ts',
    },
    {
      code: 'const obj = { seedUser() {} };',
      filename: '/repo/packages/web/test/user.ts',
    },
    {
      code: 'class Harness { doSomething() {} }',
      filename: '/repo/packages/web/test/harness/user.harness.ts',
    },
  ],
  invalid: [
    {
      code: 'const obj = { seedUser() {} };',
      filename: '/repo/packages/web/test/harness/user.harness.ts',
      errors: [
        {
          messageId: 'syncSeeding',
        },
      ],
    },
    {
      code: 'class Harness { createData() {} }',
      filename: '/repo/packages/web/test/harness/user.harness.ts',
      errors: [
        {
          messageId: 'syncSeeding',
        },
      ],
    },
    {
      code: 'const obj = { patchSettings: () => {} };',
      filename: '/repo/packages/web/test/harness/user.harness.ts',
      errors: [
        {
          messageId: 'syncSeeding',
        },
      ],
    },
  ],
});

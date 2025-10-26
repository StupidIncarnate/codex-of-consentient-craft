import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleEnforceMagicArraysBroker } from './rule-enforce-magic-arrays-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('enforce-magic-arrays', ruleEnforceMagicArraysBroker(), {
  valid: [
    // Empty arrays are allowed
    'const items = [];',
    'const values: string[] = [];',

    // Arrays with non-primitive values are allowed
    'const users = [UserStub(), UserStub()];',
    'const configs = [{ name: "test" }, { name: "prod" }];',
    'const mixed = [1, "two", true];',

    // Arrays from transformations are allowed
    'const sorted = [...items].sort((a, b) => a - b);',
    'const mapped = items.map(x => x.toString());',

    // Statics files are allowed to have arrays
    {
      code: `export const userStatics = {
        roles: ['admin', 'user', 'guest'],
        limits: [5, 10, 100]
      } as const;`,
      filename: 'statics/user/user-statics.ts',
    },
    {
      code: `export const apiStatics = {
        endpoints: ['users', 'posts', 'comments']
      } as const;`,
      filename: 'src/statics/api/api-statics.ts',
    },

    // Test files are exempt
    {
      code: `const validStatuses = ['active', 'inactive', 'pending'];`,
      filename: 'user-fetch-broker.test.ts',
    },
    {
      code: `const testNumbers = [1, 2, 3, 4, 5];`,
      filename: 'src/brokers/user/fetch/user-fetch-broker.test.ts',
    },

    // Stub files are exempt
    {
      code: `const defaults = ['default1', 'default2'];`,
      filename: 'user.stub.ts',
    },
    {
      code: `const defaultValues = [0, 1, 2];`,
      filename: 'src/contracts/config/config.stub.ts',
    },

    // Proxy files are exempt
    {
      code: `const mockValues = ['mock1', 'mock2'];`,
      filename: 'user-fetch-broker.proxy.ts',
    },
    {
      code: `const setup = [1, 2, 3];`,
      filename: 'src/adapters/http/http-adapter.proxy.ts',
    },
  ],

  invalid: [
    // String arrays in regular files
    {
      code: `const KNOWN_PACKAGES = ['axios', 'fs', 'path'];`,
      filename: 'src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'forbidMagicArray' }],
    },
    {
      code: `const statuses = ['active', 'inactive'];`,
      filename: 'adapters/api/api-adapter.ts',
      errors: [{ messageId: 'forbidMagicArray' }],
    },

    // Multiline string arrays
    {
      code: `const VALID_FOLDERS = [
        'contracts',
        'transformers',
        'errors'
      ];`,
      filename: 'src/guards/is-valid-folder/is-valid-folder-guard.ts',
      errors: [{ messageId: 'forbidMagicArray' }],
    },

    // Number arrays in regular files
    {
      code: `const LIMITS = [5, 10, 100, 1000];`,
      filename: 'src/brokers/user/create/user-create-broker.ts',
      errors: [{ messageId: 'forbidMagicArray' }],
    },
    {
      code: `const scores = [1, 2, 3];`,
      filename: 'transformers/calculate-score/calculate-score-transformer.ts',
      errors: [{ messageId: 'forbidMagicArray' }],
    },

    // Template literals
    {
      code: `const urls = [\`/api/users\`, \`/api/posts\`];`,
      filename: 'src/brokers/api/fetch/api-fetch-broker.ts',
      errors: [{ messageId: 'forbidMagicArray' }],
    },

    // In contract files (these should be in statics)
    {
      code: `export const ALL_FRAMEWORKS = ['react', 'vue', 'angular'];`,
      filename: 'src/contracts/framework/framework-contract.ts',
      errors: [{ messageId: 'forbidMagicArray' }],
    },
    {
      code: `export const VALID_ROLES = ['admin', 'user', 'guest'];`,
      filename: 'contracts/role/role-contract.ts',
      errors: [{ messageId: 'forbidMagicArray' }],
    },

    // Arrays inside functions (applies to all const declarations)
    {
      code: `export const processUser = () => {
        const statuses = ['pending', 'active'];
        return statuses[0];
      };`,
      filename: 'src/brokers/user/process/user-process-broker.ts',
      errors: [{ messageId: 'forbidMagicArray' }],
    },
  ],
});

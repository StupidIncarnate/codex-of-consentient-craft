import { createEslintRuleTester } from '../../../../test/helpers/eslint-rule-tester';
import { noMultiplePropertyAssertionsRuleBroker } from './no-multiple-property-assertions-rule-broker';

const ruleTester = createEslintRuleTester();

ruleTester.run('no-multiple-property-assertions', noMultiplePropertyAssertionsRuleBroker(), {
  valid: [
    // Non-test files are allowed
    {
      code: `
          expect(result.files).toStrictEqual(['*.ts']);
          expect(result.ignores).toStrictEqual(['dist/']);
        `,
      filename: '/project/src/brokers/user/user-broker.ts',
    },

    // Single assertion on complete object
    {
      code: `
          it('VALID: {config} => returns config', () => {
            expect(result).toStrictEqual({
              files: ['*.ts', '*.tsx'],
              ignores: ['dist/', 'build/']
            });
          });
        `,
      filename: '/project/src/brokers/config/config-broker.test.ts',
    },

    // Single property assertion (only one property tested)
    {
      code: `
          it('VALID: {files} => returns files', () => {
            expect(result.files).toStrictEqual(['*.ts', '*.tsx']);
          });
        `,
      filename: '/project/src/brokers/config/config-broker.test.ts',
    },

    // Different root objects
    {
      code: `
          it('VALID: {user, config} => returns both', () => {
            expect(user.name).toStrictEqual('John');
            expect(config.timeout).toStrictEqual(5000);
          });
        `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // Assertions in different it() blocks
    {
      code: `
          it('VALID: {files} => returns files', () => {
            expect(result.files).toStrictEqual(['*.ts']);
          });

          it('VALID: {ignores} => returns ignores', () => {
            expect(result.ignores).toStrictEqual(['dist/']);
          });
        `,
      filename: '/project/src/brokers/config/config-broker.test.ts',
    },

    // Non-toStrictEqual matchers are not checked
    {
      code: `
          it('VALID: multiple matchers allowed', () => {
            expect(result.files).toBeDefined();
            expect(result.ignores).toBeDefined();
          });
        `,
      filename: '/project/src/brokers/config/config-broker.test.ts',
    },

    // Direct object assertions (not properties)
    {
      code: `
          it('VALID: multiple objects', () => {
            expect(user).toStrictEqual({id: '1', name: 'John'});
            expect(config).toStrictEqual({timeout: 5000});
          });
        `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // Nested properties from different root objects
    {
      code: `
          it('VALID: different roots', () => {
            expect(user.profile.name).toStrictEqual('John');
            expect(config.api.timeout).toStrictEqual(5000);
          });
        `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },
  ],
  invalid: [
    // Multiple properties from same root - basic case
    {
      code: `
          it('VALID: {files, ignores} => returns config', () => {
            expect(result.files).toStrictEqual(['*.ts', '*.tsx']);
            expect(result.ignores).toStrictEqual(['dist/', 'build/']);
          });
        `,
      filename: '/project/src/brokers/config/config-broker.test.ts',
      errors: [
        {
          messageId: 'multiplePropertyAssertions',
          data: { rootObject: 'result', count: '2' },
        },
        {
          messageId: 'multiplePropertyAssertions',
          data: { rootObject: 'result', count: '2' },
        },
      ],
    },

    // Three properties from same root
    {
      code: `
          it('VALID: {files, ignores, rules} => returns config', () => {
            expect(config.files).toStrictEqual(['*.ts']);
            expect(config.ignores).toStrictEqual(['dist/']);
            expect(config.rules).toStrictEqual({});
          });
        `,
      filename: '/project/src/brokers/config/config-broker.test.ts',
      errors: [
        {
          messageId: 'multiplePropertyAssertions',
          data: { rootObject: 'config', count: '3' },
        },
        {
          messageId: 'multiplePropertyAssertions',
          data: { rootObject: 'config', count: '3' },
        },
        {
          messageId: 'multiplePropertyAssertions',
          data: { rootObject: 'config', count: '3' },
        },
      ],
    },

    // Nested properties from same root
    {
      code: `
          it('VALID: {user.profile, user.settings} => returns user data', () => {
            expect(user.profile.name).toStrictEqual('John');
            expect(user.profile.email).toStrictEqual('john@test.com');
          });
        `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'multiplePropertyAssertions',
          data: { rootObject: 'user', count: '2' },
        },
        {
          messageId: 'multiplePropertyAssertions',
          data: { rootObject: 'user', count: '2' },
        },
      ],
    },

    // Multiple properties with other assertions mixed in
    {
      code: `
          it('VALID: {result} => processes data', () => {
            expect(result.status).toStrictEqual('success');
            expect(result.data).toBeDefined();
            expect(result.errors).toStrictEqual([]);
          });
        `,
      filename: '/project/src/brokers/process/process-broker.test.ts',
      errors: [
        {
          messageId: 'multiplePropertyAssertions',
          data: { rootObject: 'result', count: '2' },
        },
        {
          messageId: 'multiplePropertyAssertions',
          data: { rootObject: 'result', count: '2' },
        },
      ],
    },

    // TSX test file
    {
      code: `
          it('VALID: {widget} => renders correctly', () => {
            expect(widget.title).toStrictEqual('Dashboard');
            expect(widget.count).toStrictEqual(5);
          });
        `,
      filename: '/project/src/widgets/dashboard/dashboard-widget.test.tsx',
      errors: [
        {
          messageId: 'multiplePropertyAssertions',
          data: { rootObject: 'widget', count: '2' },
        },
        {
          messageId: 'multiplePropertyAssertions',
          data: { rootObject: 'widget', count: '2' },
        },
      ],
    },

    // Integration test file
    {
      code: `
          it('VALID: {response} => returns data', () => {
            expect(response.status).toStrictEqual(200);
            expect(response.body).toStrictEqual({id: '1'});
          });
        `,
      filename: '/project/src/brokers/api/api-broker.integration.test.ts',
      errors: [
        {
          messageId: 'multiplePropertyAssertions',
          data: { rootObject: 'response', count: '2' },
        },
        {
          messageId: 'multiplePropertyAssertions',
          data: { rootObject: 'response', count: '2' },
        },
      ],
    },

    // Using test() instead of it()
    {
      code: `
          test('VALID: {config} => returns config', () => {
            expect(config.timeout).toStrictEqual(5000);
            expect(config.retries).toStrictEqual(3);
          });
        `,
      filename: '/project/src/brokers/config/config-broker.test.ts',
      errors: [
        {
          messageId: 'multiplePropertyAssertions',
          data: { rootObject: 'config', count: '2' },
        },
        {
          messageId: 'multiplePropertyAssertions',
          data: { rootObject: 'config', count: '2' },
        },
      ],
    },

    // Mixed root objects - one has violation, other doesn't
    {
      code: `
          it('VALID: {result, config} => processes data', () => {
            expect(result.status).toStrictEqual('success');
            expect(result.data).toStrictEqual({id: '1'});
            expect(config.timeout).toStrictEqual(5000);
          });
        `,
      filename: '/project/src/brokers/process/process-broker.test.ts',
      errors: [
        {
          messageId: 'multiplePropertyAssertions',
          data: { rootObject: 'result', count: '2' },
        },
        {
          messageId: 'multiplePropertyAssertions',
          data: { rootObject: 'result', count: '2' },
        },
      ],
    },

    // Real example from the codebase
    {
      code: `
          it('VALID: {files: ["*.ts"], ignores: ["dist/"]} => returns config with custom patterns', () => {
            const result = EslintConfigStub({
              files: ['*.ts', '*.tsx'],
              ignores: ['dist/', 'build/'],
            });

            expect(result.files).toStrictEqual(['*.ts', '*.tsx']);
            expect(result.ignores).toStrictEqual(['dist/', 'build/']);
          });
        `,
      filename:
        '/project/packages/eslint-plugin/src/contracts/eslint-config/eslint-config-contract.test.ts',
      errors: [
        {
          messageId: 'multiplePropertyAssertions',
          data: { rootObject: 'result', count: '2' },
        },
        {
          messageId: 'multiplePropertyAssertions',
          data: { rootObject: 'result', count: '2' },
        },
      ],
    },
  ],
});

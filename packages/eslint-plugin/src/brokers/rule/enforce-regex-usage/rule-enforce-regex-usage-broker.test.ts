import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleEnforceRegexUsageBroker } from './rule-enforce-regex-usage-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('enforce-regex-usage', ruleEnforceRegexUsageBroker(), {
  valid: [
    // Guards can use regex
    {
      code: 'const isValid = /^[a-z]+$/.test(input);',
      filename: '/project/src/guards/is-valid/is-valid-guard.ts',
    },
    {
      code: 'export const hasNumberGuard = ({ value }: { value?: string }): boolean => /\\d/.test(value ?? "");',
      filename: '/project/src/guards/has-number/has-number-guard.ts',
    },
    {
      code: 'const pattern = /email@example\\.com/i;',
      filename: '/project/src/guards/email-check/email-check-guard.ts',
    },

    // Transformers can use regex
    {
      code: 'const cleaned = input.replace(/[^a-z]/g, "");',
      filename: '/project/src/transformers/clean-string/clean-string-transformer.ts',
    },
    {
      code: 'export const extractNumbersTransformer = ({ text }: { text: string }): number[] => text.match(/\\d+/g) ?? [];',
      filename: '/project/src/transformers/extract-numbers/extract-numbers-transformer.ts',
    },
    {
      code: 'const parts = value.split(/\\s+/);',
      filename: '/project/src/transformers/split-words/split-words-transformer.ts',
    },

    // Contracts can use regex
    {
      code: 'const emailPattern = /^[a-z@.]+$/;',
      filename: '/project/src/contracts/email/email-contract.ts',
    },
    {
      code: 'export const userContract = z.object({ email: z.string().regex(/^\\S+@\\S+$/) });',
      filename: '/project/src/contracts/user/user-contract.ts',
    },

    // Files not in src/ folder should be ignored
    {
      code: 'const regex = /test/;',
      filename: '/project/test/helpers/test-helper.ts',
    },
    {
      code: 'const pattern = /[a-z]+/;',
      filename: '/project/scripts/build.ts',
    },

    // Test files can use regex regardless of folder type
    {
      code: 'const pattern = /test-pattern/;',
      filename: '/project/src/brokers/user/validate/user-validate-broker.test.ts',
    },
    {
      code: 'expect(result).toMatch(/^[a-z]+$/);',
      filename: '/project/src/adapters/http/get/http-get-adapter.test.ts',
    },
    {
      code: 'const mockValue = "test".match(/[a-z]/g);',
      filename: '/project/src/widgets/user-form/user-form-widget.test.tsx',
    },
    {
      code: 'it("should match pattern", () => { expect(/\\d+/.test("123")).toBe(true); });',
      filename: '/project/src/responders/user/create/user-create-responder.test.ts',
    },
  ],
  invalid: [
    // Brokers cannot use regex
    {
      code: 'const isValid = /^[a-z]+$/.test(input);',
      filename: '/project/src/brokers/user/validate/user-validate-broker.ts',
      errors: [
        {
          messageId: 'forbiddenRegex',
          data: {
            folderType: 'brokers',
            allowedFolders: 'contracts, guards, transformers',
          },
        },
      ],
    },
    {
      code: 'const pattern = /email/i;',
      filename: '/project/src/brokers/email/send/email-send-broker.ts',
      errors: [
        {
          messageId: 'forbiddenRegex',
          data: {
            folderType: 'brokers',
            allowedFolders: 'contracts, guards, transformers',
          },
        },
      ],
    },

    // Adapters cannot use regex
    {
      code: 'const cleaned = value.replace(/\\s+/g, "");',
      filename: '/project/src/adapters/http/get/http-get-adapter.ts',
      errors: [
        {
          messageId: 'forbiddenRegex',
          data: {
            folderType: 'adapters',
            allowedFolders: 'contracts, guards, transformers',
          },
        },
      ],
    },

    // Widgets cannot use regex
    {
      code: 'const isValid = /^[0-9]+$/.test(input);',
      filename: '/project/src/widgets/user-form/user-form-widget.tsx',
      errors: [
        {
          messageId: 'forbiddenRegex',
          data: {
            folderType: 'widgets',
            allowedFolders: 'contracts, guards, transformers',
          },
        },
      ],
    },

    // Responders cannot use regex
    {
      code: 'const sanitized = input.replace(/<script>/g, "");',
      filename: '/project/src/responders/user/create/user-create-responder.ts',
      errors: [
        {
          messageId: 'forbiddenRegex',
          data: {
            folderType: 'responders',
            allowedFolders: 'contracts, guards, transformers',
          },
        },
      ],
    },

    // Bindings cannot use regex
    {
      code: 'const pattern = /test/;',
      filename: '/project/src/bindings/use-validation/use-validation-binding.ts',
      errors: [
        {
          messageId: 'forbiddenRegex',
          data: {
            folderType: 'bindings',
            allowedFolders: 'contracts, guards, transformers',
          },
        },
      ],
    },

    // State cannot use regex
    {
      code: 'const key = id.replace(/[^a-z]/g, "");',
      filename: '/project/src/state/cache/cache-state.ts',
      errors: [
        {
          messageId: 'forbiddenRegex',
          data: {
            folderType: 'state',
            allowedFolders: 'contracts, guards, transformers',
          },
        },
      ],
    },

    // Middleware cannot use regex
    {
      code: 'const cleaned = path.replace(/\\.\\./g, "");',
      filename: '/project/src/middleware/security/security-middleware.ts',
      errors: [
        {
          messageId: 'forbiddenRegex',
          data: {
            folderType: 'middleware',
            allowedFolders: 'contracts, guards, transformers',
          },
        },
      ],
    },

    // Flows cannot use regex
    {
      code: 'const routePattern = /^\\/users\\/\\d+$/;',
      filename: '/project/src/flows/user/user-flow.ts',
      errors: [
        {
          messageId: 'forbiddenRegex',
          data: {
            folderType: 'flows',
            allowedFolders: 'contracts, guards, transformers',
          },
        },
      ],
    },

    // Statics cannot use regex
    {
      code: 'const emailPattern = /^[a-z@.]+$/;',
      filename: '/project/src/statics/patterns/patterns-statics.ts',
      errors: [
        {
          messageId: 'forbiddenRegex',
          data: {
            folderType: 'statics',
            allowedFolders: 'contracts, guards, transformers',
          },
        },
      ],
    },

    // Errors cannot use regex
    {
      code: 'const cleaned = message.replace(/\\d/g, "");',
      filename: '/project/src/errors/validation/validation-error.ts',
      errors: [
        {
          messageId: 'forbiddenRegex',
          data: {
            folderType: 'errors',
            allowedFolders: 'contracts, guards, transformers',
          },
        },
      ],
    },

    // Startup cannot use regex
    {
      code: 'const version = process.version.match(/\\d+/);',
      filename: '/project/src/startup/start-app.ts',
      errors: [
        {
          messageId: 'forbiddenRegex',
          data: {
            folderType: 'startup',
            allowedFolders: 'contracts, guards, transformers',
          },
        },
      ],
    },
  ],
});

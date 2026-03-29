import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleEnforceTestNamePrefixBroker } from './rule-enforce-test-name-prefix-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('enforce-test-name-prefix', ruleEnforceTestNamePrefixBroker(), {
  valid: [
    // VALID: prefix
    {
      code: `it('VALID: {input} => returns result', () => {});`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // INVALID: prefix
    {
      code: `it('INVALID: {bad input} => throws', () => {});`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // ERROR: prefix
    {
      code: `it('ERROR: {network failure} => returns error', () => {});`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // EDGE: prefix
    {
      code: `it('EDGE: {empty array} => returns empty', () => {});`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // EMPTY: prefix
    {
      code: `it('EMPTY: {null input} => returns default', () => {});`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // Playwright test fn with valid prefix
    {
      code: `test('VALID: quest loads correctly', () => {});`,
      filename: '/project/src/e2e/quest.spec.ts',
    },

    // Describe blocks are not checked
    {
      code: `describe('something without prefix', () => {});`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // Non-test file is not checked
    {
      code: `it('no prefix needed here', () => {});`,
      filename: '/project/src/brokers/user/user-broker.ts',
    },

    // Inside ruleTester.run() — not checked
    {
      code: `
        const ruleTester = eslintRuleTesterAdapter();
        ruleTester.run('my-rule', myRule(), {
          valid: [{ code: 'valid code', filename: '/test.ts' }],
          invalid: [{ code: 'bad code', filename: '/test.ts', errors: [{ messageId: 'err' }] }],
        });
      `,
      filename: '/project/src/brokers/rule/my-rule/my-rule-broker.test.ts',
    },
  ],
  invalid: [
    // No prefix at all
    {
      code: `it('returns the correct value', () => {});`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'missingPrefix',
          data: { name: 'returns the correct value', prefixes: 'VALID:, INVALID:, ERROR:, EDGE:, EMPTY:' },
        },
      ],
    },

    // Non-standard prefix: MISSING
    {
      code: `it('MISSING: {input} => returns null', () => {});`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'missingPrefix',
          data: { name: 'MISSING: {input} => returns null', prefixes: 'VALID:, INVALID:, ERROR:, EDGE:, EMPTY:' },
        },
      ],
    },

    // Non-standard prefix: SAFETY
    {
      code: `it('SAFETY: {memory} => stays under limit', () => {});`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'missingPrefix',
          data: { name: 'SAFETY: {memory} => stays under limit', prefixes: 'VALID:, INVALID:, ERROR:, EDGE:, EMPTY:' },
        },
      ],
    },

    // Non-standard prefix: FALLBACK
    {
      code: `it('FALLBACK: {no file} => uses default', () => {});`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'missingPrefix',
          data: { name: 'FALLBACK: {no file} => uses default', prefixes: 'VALID:, INVALID:, ERROR:, EDGE:, EMPTY:' },
        },
      ],
    },

    // VALID_ONLY is not VALID:
    {
      code: `it('VALID_ONLY: {only lint} => parses', () => {});`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'missingPrefix',
          data: { name: 'VALID_ONLY: {only lint} => parses', prefixes: 'VALID:, INVALID:, ERROR:, EDGE:, EMPTY:' },
        },
      ],
    },

    // Spec file test fn without prefix
    {
      code: `test('should render the component', () => {});`,
      filename: '/project/src/e2e/quest.spec.ts',
      errors: [
        {
          messageId: 'missingPrefix',
          data: { name: 'should render the component', prefixes: 'VALID:, INVALID:, ERROR:, EDGE:, EMPTY:' },
        },
      ],
    },

    // TSX test file
    {
      code: `it('renders correctly', () => {});`,
      filename: '/project/src/widgets/button/button-widget.test.tsx',
      errors: [
        {
          messageId: 'missingPrefix',
          data: { name: 'renders correctly', prefixes: 'VALID:, INVALID:, ERROR:, EDGE:, EMPTY:' },
        },
      ],
    },
  ],
});

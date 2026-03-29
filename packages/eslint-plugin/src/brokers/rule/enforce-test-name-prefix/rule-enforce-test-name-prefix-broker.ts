/**
 * PURPOSE: Enforces that all test names start with VALID:, INVALID:, ERROR:, EDGE:, or EMPTY: prefix
 *
 * USAGE:
 * const rule = ruleEnforceTestNamePrefixBroker();
 * // Returns ESLint rule that validates test name prefixes in it() and test() calls
 *
 * WHEN-TO-USE: When registering ESLint rules to enforce consistent test naming across all test types
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';
import { hasValidTestNamePrefixGuard } from '../../../guards/has-valid-test-name-prefix/has-valid-test-name-prefix-guard';
import { testNamePrefixStatics } from '../../../statics/test-name-prefix/test-name-prefix-statics';

export const ruleEnforceTestNamePrefixBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Enforce that all test names start with VALID:, INVALID:, ERROR:, EDGE:, or EMPTY: prefix.',
      },
      messages: {
        missingPrefix:
          'Test name must start with VALID:, INVALID:, ERROR:, EDGE:, or EMPTY: — found: "{{name}}"',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const isTestFile = isTestFileGuard({ filename: ctx.filename ?? '' });

    if (!isTestFile) {
      return {};
    }

    let ruleTesterDepth = 0;

    return {
      CallExpression: (node: Tsestree): void => {
        const { callee } = node;

        // Detect ruleTester.run() entry — skip checks inside RuleTester blocks
        if (
          callee?.type === 'MemberExpression' &&
          callee.property?.name === 'run' &&
          callee.object?.type === 'Identifier' &&
          callee.object.name === 'ruleTester'
        ) {
          ruleTesterDepth += 1;
          return;
        }

        // Skip checks inside ruleTester.run() blocks
        if (ruleTesterDepth > 0) {
          return;
        }

        // Check it() and test() calls
        const isItOrTest =
          callee?.type === 'Identifier' && (callee.name === 'it' || callee.name === 'test');

        if (!isItOrTest) {
          return;
        }

        // Get the first argument (test name)
        const firstArg = node.arguments?.[0];
        if (firstArg?.type !== 'Literal' || typeof firstArg.value !== 'string') {
          return;
        }

        const testName = firstArg.value;

        if (!hasValidTestNamePrefixGuard({ name: testName })) {
          const displayName =
            testName.length > testNamePrefixStatics.maxDisplayLength
              ? `${testName.slice(0, testNamePrefixStatics.maxDisplayLength)}...`
              : testName;

          ctx.report({
            node,
            messageId: 'missingPrefix',
            data: { name: displayName },
          });
        }
      },

      'CallExpression:exit': (node: Tsestree): void => {
        const { callee } = node;

        // Detect ruleTester.run() exit
        if (
          callee?.type === 'MemberExpression' &&
          callee.property?.name === 'run' &&
          callee.object?.type === 'Identifier' &&
          callee.object.name === 'ruleTester'
        ) {
          ruleTesterDepth -= 1;
        }
      },
    };
  },
});

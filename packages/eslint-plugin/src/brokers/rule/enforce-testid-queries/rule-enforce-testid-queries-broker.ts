/**
 * PURPOSE: Enforces use of testid and role queries instead of content-based queries in React component tests
 *
 * USAGE:
 * const rule = ruleEnforceTestidQueriesBroker();
 * // Returns ESLint rule that bans getByText, container.querySelector, etc. in all test files
 *
 * WHEN-TO-USE: When registering ESLint rules to enforce accessible, stable test queries
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';
import { bannedQueryMethodsStatics } from '../../../statics/banned-query-methods/banned-query-methods-statics';

export const ruleEnforceTestidQueriesBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Enforce use of testid and role queries instead of content-based queries in React component tests.',
      },
      messages: {
        contentBasedQuery:
          'Use {{replacement}} instead of content-based query {{method}} in test files',
        containerQuery: 'Use screen.getByTestId instead of container.{{method}}',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    return {
      CallExpression: (node: Tsestree): void => {
        const filename = ctx.filename ?? '';
        const isTest = isTestFileGuard({ filename });

        if (!isTest) {
          return;
        }

        const { callee } = node;

        if (callee?.type !== 'MemberExpression') {
          return;
        }

        const objectName = callee.object?.name;
        const propertyName = callee.property?.name;

        if (objectName === undefined || propertyName === undefined) {
          return;
        }

        // Check screen.bannedMethod()
        const matchedScreenMethod =
          objectName === 'screen'
            ? bannedQueryMethodsStatics.screenMethods.find((method) => method === propertyName)
            : undefined;

        if (matchedScreenMethod !== undefined) {
          const replacement =
            bannedQueryMethodsStatics.replacementRecord[matchedScreenMethod] ?? 'getByTestId';

          ctx.report({
            node,
            messageId: 'contentBasedQuery',
            data: {
              method: `screen.${propertyName}`,
              replacement: `screen.${replacement}`,
            },
          });
          return;
        }

        // Check container.querySelector / container.querySelectorAll
        const isBannedContainerMethod =
          objectName === 'container' &&
          bannedQueryMethodsStatics.containerMethods.some((method) => method === propertyName);

        if (isBannedContainerMethod) {
          ctx.report({
            node,
            messageId: 'containerQuery',
            data: {
              method: propertyName,
            },
          });
        }
      },
    };
  },
});

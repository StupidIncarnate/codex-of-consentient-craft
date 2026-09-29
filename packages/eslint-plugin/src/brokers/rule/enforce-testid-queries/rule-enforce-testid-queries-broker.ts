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
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
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
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    return {
      CallExpression: (node: TSESTree.CallExpression): void => {
        const { filename } = ctx;
        const isTest = isTestFileGuard({ filename });

        if (!isTest) {
          return;
        }

        const { callee } = node;

        if (callee.type !== AST_NODE_TYPES.MemberExpression) {
          return;
        }

        const objectName =
          callee.object.type === AST_NODE_TYPES.Identifier ? callee.object.name : undefined;
        const propertyName =
          callee.property.type === AST_NODE_TYPES.Identifier ||
          callee.property.type === AST_NODE_TYPES.PrivateIdentifier
            ? callee.property.name
            : undefined;

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

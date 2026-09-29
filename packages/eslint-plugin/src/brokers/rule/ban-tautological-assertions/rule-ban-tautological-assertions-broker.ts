/**
 * PURPOSE: Bans tautological assertions where expect(X).toBe(X) with identical literals
 *
 * USAGE:
 * const rule = ruleBanTautologicalAssertionsBroker();
 * // Returns ESLint rule that prevents expect(true).toBe(true) and similar tautologies
 *
 * WHEN-TO-USE: When registering ESLint rules to prevent assertions that always pass
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';
import { astFindExpectCallTransformer } from '../../../transformers/ast-find-expect-call/ast-find-expect-call-transformer';
import { tautologyLiteralKeyTransformer } from '../../../transformers/tautology-literal-key/tautology-literal-key-transformer';

export const ruleBanTautologicalAssertionsBroker =
  (): TSESLint.RuleModule<'tautologicalAssertion'> => ({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban tautological assertions like expect(true).toBe(true) where both sides are identical literals.',
      },
      messages: {
        tautologicalAssertion:
          'Tautological assertion: expect({{value}}).toBe({{value}}) always passes. Assert on actual function return values or side effects instead.',
      },
      schema: [],
    },
    defaultOptions: [],
    create: (context: TSESLint.RuleContext<string, unknown[]>) => {
      const ctx = context;
      const isTestFile = isTestFileGuard({ filename: ctx.filename });

      if (!isTestFile) {
        return {};
      }

      const tautologyMatchers = new Set(['toBe', 'toEqual', 'toStrictEqual']);

      return {
        CallExpression: (node: TSESTree.CallExpression): void => {
          const { callee } = node;

          if (callee.type !== AST_NODE_TYPES.MemberExpression) {
            return;
          }

          const matcherName =
            callee.property.type === AST_NODE_TYPES.Identifier ||
            callee.property.type === AST_NODE_TYPES.PrivateIdentifier
              ? callee.property.name
              : undefined;
          if (matcherName === undefined || !tautologyMatchers.has(matcherName)) {
            return;
          }

          // Verify the chain originates from expect()
          const expectCall = astFindExpectCallTransformer({ node });
          if (expectCall === null) {
            return;
          }

          // Get the expect() argument
          const [expectArg] = expectCall.arguments;
          if (expectArg === undefined) {
            return;
          }

          // Get the matcher argument
          const [matcherArg] = node.arguments;
          if (matcherArg === undefined) {
            return;
          }

          // Check for same identifier (variable) tautology: expect(foo).toBe(foo)
          if (
            expectArg.type === AST_NODE_TYPES.Identifier &&
            matcherArg.type === AST_NODE_TYPES.Identifier &&
            expectArg.name === matcherArg.name
          ) {
            ctx.report({
              node,
              messageId: 'tautologicalAssertion',
              data: { value: expectArg.name },
            });
            return;
          }

          // Check for identical literal tautology: expect(true).toBe(true)
          const expectKey = tautologyLiteralKeyTransformer({ node: expectArg });
          const matcherKey = tautologyLiteralKeyTransformer({ node: matcherArg });

          if (expectKey === null || matcherKey === null) {
            return;
          }

          if (expectKey === matcherKey) {
            ctx.report({
              node,
              messageId: 'tautologicalAssertion',
              data: {
                value:
                  expectArg.type === AST_NODE_TYPES.Literal &&
                  (typeof expectArg.value === 'string' ||
                    typeof expectArg.value === 'number' ||
                    typeof expectArg.value === 'boolean')
                    ? String(expectArg.value)
                    : expectArg.type === AST_NODE_TYPES.Identifier
                      ? expectArg.name
                      : expectKey,
              },
            });
          }
        },
      };
    },
  });

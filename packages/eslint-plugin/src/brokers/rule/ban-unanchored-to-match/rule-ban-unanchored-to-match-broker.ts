/**
 * PURPOSE: Bans unanchored regex patterns in toMatch(), toHaveText(), and toContainText() assertions
 *
 * USAGE:
 * const rule = ruleBanUnanchoredToMatchBroker();
 * // Returns ESLint rule that requires at least one anchor (^ or $) in regex assertions
 *
 * WHEN-TO-USE: When registering ESLint rules to prevent partial regex matching that hides bugs
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';
import { hasRegexAnchorGuard } from '../../../guards/has-regex-anchor/has-regex-anchor-guard';
import { regexMatchMethodsStatics } from '../../../statics/regex-match-methods/regex-match-methods-statics';
import { astFindExpectCallTransformer } from '../../../transformers/ast-find-expect-call/ast-find-expect-call-transformer';

export const ruleBanUnanchoredToMatchBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Require both anchors (^ and $) in regex patterns passed to toMatch(), toHaveText(), toContainText(), and expect.stringMatching().',
      },
      messages: {
        unanchoredRegex:
          '{{method}}() regex must have both anchors (^ and $) to prevent partial matching',
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

    return {
      CallExpression: (node: Tsestree): void => {
        const { callee } = node;

        // Check if this is a method call on an expect chain
        if (callee?.type !== 'MemberExpression') {
          return;
        }

        const methodName = callee.property?.name;
        if (methodName === undefined) {
          return;
        }

        // Check expect.stringMatching(/regex/)
        if (
          methodName === 'stringMatching' &&
          callee.object?.type === 'Identifier' &&
          callee.object.name === 'expect'
        ) {
          const firstArg = node.arguments?.[0];
          if (firstArg === null || firstArg === undefined) {
            return;
          }

          const regexPattern = firstArg.regex?.pattern;
          if (regexPattern === undefined || typeof regexPattern !== 'string') {
            return;
          }

          if (!hasRegexAnchorGuard({ pattern: regexPattern })) {
            ctx.report({
              node,
              messageId: 'unanchoredRegex',
              data: { method: 'expect.stringMatching' },
            });
          }
          return;
        }

        // Check if the method is one of the anchor-required matchers
        const isAnchorRequired = regexMatchMethodsStatics.anchorRequired.some(
          (m) => m === methodName,
        );

        if (!isAnchorRequired) {
          return;
        }

        // Verify this is on an expect chain (skip non-expect calls like someLib.toMatch())
        const expectCall = astFindExpectCallTransformer({ node });
        if (expectCall === null) {
          return;
        }

        // Check if the first argument is a regex literal
        const firstArg = node.arguments?.[0];
        if (firstArg === null || firstArg === undefined) {
          return;
        }

        // ESLint AST stores regex literals as Literal nodes with a regex property
        const regexPattern = firstArg.regex?.pattern;
        if (regexPattern === undefined || typeof regexPattern !== 'string') {
          return;
        }

        // Check if regex has at least one anchor
        if (!hasRegexAnchorGuard({ pattern: regexPattern })) {
          ctx.report({
            node,
            messageId: 'unanchoredRegex',
            data: { method: methodName },
          });
        }
      },
    };
  },
});

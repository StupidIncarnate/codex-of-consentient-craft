/**
 * PURPOSE: Bans unanchored regex patterns in toMatch(), toHaveText(), and toContainText() assertions
 *
 * USAGE:
 * const rule = ruleBanUnanchoredToMatchBroker();
 * // Returns ESLint rule that requires at least one anchor (^ or $) in regex assertions
 *
 * WHEN-TO-USE: When registering ESLint rules to prevent partial regex matching that hides bugs
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';
import { hasRegexAnchorGuard } from '../../../guards/has-regex-anchor/has-regex-anchor-guard';
import { regexMatchMethodsStatics } from '../../../statics/regex-match-methods/regex-match-methods-statics';
import { astFindExpectCallTransformer } from '../../../transformers/ast-find-expect-call/ast-find-expect-call-transformer';

export const ruleBanUnanchoredToMatchBroker = (): TSESLint.RuleModule<'unanchoredRegex'> => ({
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
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const isTestFile = isTestFileGuard({ filename: ctx.filename });

    if (!isTestFile) {
      return {};
    }

    return {
      CallExpression: (node: TSESTree.CallExpression): void => {
        const { callee } = node;

        // Check if this is a method call on an expect chain
        if (callee.type !== AST_NODE_TYPES.MemberExpression) {
          return;
        }

        const methodName =
          callee.property.type === AST_NODE_TYPES.Identifier ||
          callee.property.type === AST_NODE_TYPES.PrivateIdentifier
            ? callee.property.name
            : undefined;
        if (methodName === undefined) {
          return;
        }

        // Check expect.stringMatching(/regex/)
        if (
          methodName === 'stringMatching' &&
          callee.object.type === AST_NODE_TYPES.Identifier &&
          callee.object.name === 'expect'
        ) {
          const [firstArg] = node.arguments;
          if (firstArg === undefined) {
            return;
          }

          const regexPattern =
            firstArg.type === AST_NODE_TYPES.Literal && 'regex' in firstArg
              ? firstArg.regex.pattern
              : undefined;
          if (regexPattern === undefined) {
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
        const [firstArg] = node.arguments;
        if (firstArg === undefined) {
          return;
        }

        // ESLint AST stores regex literals as Literal nodes with a regex property
        const regexPattern =
          firstArg.type === AST_NODE_TYPES.Literal && 'regex' in firstArg
            ? firstArg.regex.pattern
            : undefined;
        if (regexPattern === undefined) {
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

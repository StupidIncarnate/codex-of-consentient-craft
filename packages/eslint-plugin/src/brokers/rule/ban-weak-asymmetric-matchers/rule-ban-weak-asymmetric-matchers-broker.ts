/**
 * PURPOSE: Bans weak asymmetric matchers nested inside toStrictEqual()/toBe() arguments
 *
 * USAGE:
 * const rule = ruleBanWeakAsymmetricMatchersBroker();
 * // Returns ESLint rule that prevents expect.any(X), expect.objectContaining(), etc. nested inside matchers
 *
 * WHEN-TO-USE: When registering ESLint rules to close the nesting evasion gap for banned matchers
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';
import { astFindExpectCallTransformer } from '../../../transformers/ast-find-expect-call/ast-find-expect-call-transformer';

const bannedAsymmetricMethods = new Set([
  'objectContaining',
  'arrayContaining',
  'stringContaining',
]);

// Allowlist: only Function is permitted for expect.any()
const allowedAnyArgs = new Set(['Function']);

const enclosingMatchers = new Set(['toStrictEqual', 'toBe']);

const maxParentDepth = 20;

export const ruleBanWeakAsymmetricMatchersBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban weak asymmetric matchers (expect.any(X), expect.objectContaining(), etc.) nested inside toStrictEqual() or toBe() arguments.',
      },
      messages: {
        bannedNestedAny:
          'expect.any({{type}}) nested in assertion proves nothing about shape. Assert the exact value instead.',
        bannedNestedAsymmetric:
          'expect.{{method}}() nested in assertion is a partial match that hides missing/extra keys. Assert the complete value instead.',
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
        // Step 1: Check if this CallExpression is a banned asymmetric matcher
        const { callee } = node;
        if (callee?.type !== 'MemberExpression') {
          return;
        }
        if (callee.object?.type !== 'Identifier' || callee.object.name !== 'expect') {
          return;
        }
        if (callee.property?.type !== 'Identifier') {
          return;
        }

        const method = String(callee.property.name);
        let isBanned = false;
        let bannedType = '';

        if (method === 'any') {
          const firstArg = node.arguments?.[0];
          if (firstArg?.type === 'Identifier' && firstArg.name !== undefined) {
            const argName = String(firstArg.name);
            if (!allowedAnyArgs.has(argName)) {
              isBanned = true;
              bannedType = argName;
            }
          }
        } else if (bannedAsymmetricMethods.has(method)) {
          isBanned = true;
        }

        if (!isBanned) {
          return;
        }

        // Step 2: Walk parent chain to check if nested inside toStrictEqual()/toBe()
        let current: Tsestree | null | undefined = node.parent;
        let depth = 0;
        while (current !== null && current !== undefined && depth < maxParentDepth) {
          if (current.type === 'CallExpression') {
            const parentCallee = current.callee;
            if (parentCallee?.type === 'MemberExpression') {
              const parentMatcherName = parentCallee.property?.name;
              if (
                parentMatcherName !== undefined &&
                enclosingMatchers.has(String(parentMatcherName))
              ) {
                // Verify this parent is on an expect chain
                const expectCall = astFindExpectCallTransformer({ node: current });
                if (expectCall !== null) {
                  if (method === 'any' && bannedType !== '') {
                    ctx.report({
                      node,
                      messageId: 'bannedNestedAny',
                      data: { type: bannedType },
                    });
                  } else {
                    ctx.report({
                      node,
                      messageId: 'bannedNestedAsymmetric',
                      data: { method },
                    });
                  }
                  return;
                }
              }
            }
            // Hit a non-matcher CallExpression — stop walking
            return;
          }
          current = current.parent;
          depth += 1;
        }
      },
    };
  },
});

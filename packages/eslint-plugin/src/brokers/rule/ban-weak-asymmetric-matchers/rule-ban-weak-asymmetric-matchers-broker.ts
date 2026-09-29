/**
 * PURPOSE: Bans weak asymmetric matchers nested inside toStrictEqual()/toBe() arguments
 *
 * USAGE:
 * const rule = ruleBanWeakAsymmetricMatchersBroker();
 * // Returns ESLint rule that prevents expect.any(X), expect.objectContaining(), etc. nested inside matchers
 *
 * WHEN-TO-USE: When registering ESLint rules to close the nesting evasion gap for banned matchers
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
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

export const ruleBanWeakAsymmetricMatchersBroker = (): TSESLint.RuleModule<
  'bannedNestedAny' | 'bannedNestedAsymmetric'
> => ({
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
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const isTestFile = isTestFileGuard({ filename: ctx.filename });

    if (!isTestFile) {
      return {};
    }

    return {
      CallExpression: (node: TSESTree.CallExpression): void => {
        // Step 1: Check if this CallExpression is a banned asymmetric matcher
        const { callee } = node;
        if (callee.type !== AST_NODE_TYPES.MemberExpression) {
          return;
        }
        if (callee.object.type !== AST_NODE_TYPES.Identifier || callee.object.name !== 'expect') {
          return;
        }
        if (callee.property.type !== AST_NODE_TYPES.Identifier) {
          return;
        }

        const method = callee.property.name;
        let isBanned = false;
        let bannedType = '';

        if (method === 'any') {
          const [firstArg] = node.arguments;
          if (firstArg?.type === AST_NODE_TYPES.Identifier) {
            const argName = firstArg.name;
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
        let current: TSESTree.Node | undefined = node.parent;
        let depth = 0;
        while (current && depth < maxParentDepth) {
          if (current.type === AST_NODE_TYPES.CallExpression) {
            const parentCallee = current.callee;
            if (parentCallee.type === AST_NODE_TYPES.MemberExpression) {
              const parentMatcherName =
                parentCallee.property.type === AST_NODE_TYPES.Identifier ||
                parentCallee.property.type === AST_NODE_TYPES.PrivateIdentifier
                  ? parentCallee.property.name
                  : undefined;
              if (parentMatcherName !== undefined && enclosingMatchers.has(parentMatcherName)) {
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

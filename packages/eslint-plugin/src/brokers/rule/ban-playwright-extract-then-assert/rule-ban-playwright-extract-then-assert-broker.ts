/**
 * PURPOSE: Bans extracting textContent/inputValue/count then asserting separately in Playwright specs
 *
 * USAGE:
 * const rule = ruleBanPlaywrightExtractThenAssertBroker();
 *
 * WHEN-TO-USE: When registering ESLint rules to enforce Playwright auto-retrying assertions
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';

import { isSpecFileGuard } from '../../../guards/is-spec-file/is-spec-file-guard';
import { playwrightExtractionMethodsStatics } from '../../../statics/playwright-extraction-methods/playwright-extraction-methods-statics';

export const ruleBanPlaywrightExtractThenAssertBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban extracting textContent/inputValue/count then asserting separately — use Playwright auto-retrying assertions.',
      },
      messages: {
        extractThenAssert:
          'Use await expect(locator).{{replacement}}() instead of extracting .{{method}}() then asserting',
      },
      schema: [],
    },
  }),
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const trackedVariables = new Map<string, string>();

    return {
      VariableDeclarator: (node: TSESTree.VariableDeclarator): void => {
        const isSpecFile = isSpecFileGuard({ filename: ctx.filename });

        if (!isSpecFile) {
          return;
        }

        // Check: const x = await el.textContent()
        const { init } = node;

        if (init?.type !== AST_NODE_TYPES.AwaitExpression) {
          return;
        }

        const { argument } = init;

        if (
          argument.type !== AST_NODE_TYPES.CallExpression ||
          argument.callee.type !== AST_NODE_TYPES.MemberExpression
        ) {
          return;
        }

        const { property } = argument.callee;
        const methodName = 'name' in property ? property.name : undefined;
        const isTrackedMethod =
          methodName === 'textContent' || methodName === 'inputValue' || methodName === 'count';

        if (!isTrackedMethod) {
          return;
        }

        const variableName = node.id.type === AST_NODE_TYPES.Identifier ? node.id.name : undefined;

        if (variableName === undefined) {
          return;
        }

        const { methods } = playwrightExtractionMethodsStatics;
        const methodKey = methodName;
        trackedVariables.set(variableName, methods[methodKey] as string);
      },
      CallExpression: (node: TSESTree.CallExpression): void => {
        const isSpecFile = isSpecFileGuard({ filename: ctx.filename });

        if (!isSpecFile) {
          return;
        }

        const isExpectCall =
          node.callee.type === AST_NODE_TYPES.Identifier && node.callee.name === 'expect';

        if (!isExpectCall) {
          return;
        }

        const [firstArg] = node.arguments;
        const isIdentifier = firstArg?.type === AST_NODE_TYPES.Identifier;

        if (!isIdentifier) {
          return;
        }

        const argName = firstArg.name;

        const replacement = trackedVariables.get(argName);

        if (replacement === undefined) {
          return;
        }

        // Find the method name from the replacement
        const { methods } = playwrightExtractionMethodsStatics;
        const methodEntries = Object.entries(methods);
        const matchedEntry = methodEntries.find(([, value]) => value === replacement);

        if (matchedEntry === undefined) {
          return;
        }

        ctx.report({
          node,
          messageId: 'extractThenAssert',
          data: {
            method: matchedEntry[0],
            replacement,
          },
        });
      },
    };
  },
});

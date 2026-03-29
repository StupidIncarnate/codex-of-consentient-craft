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
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import type { Identifier } from '@dungeonmaster/shared/contracts';
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
  create: (context: EslintContext) => {
    const ctx = context;
    const trackedVariables = new Map<Identifier, Identifier>();

    return {
      VariableDeclarator: (node: Tsestree): void => {
        const isSpecFile = isSpecFileGuard({ filename: ctx.filename ?? '' });

        if (!isSpecFile) {
          return;
        }

        // Check: const x = await el.textContent()
        const isAwaitExpression = node.init?.type === 'AwaitExpression';

        if (!isAwaitExpression) {
          return;
        }

        const isCallExpression = node.init?.argument?.type === 'CallExpression';

        if (!isCallExpression) {
          return;
        }

        const isMemberExpression = node.init?.argument?.callee?.type === 'MemberExpression';

        if (!isMemberExpression) {
          return;
        }

        const methodName = node.init?.argument?.callee?.property?.name;
        const isTrackedMethod =
          methodName === 'textContent' || methodName === 'inputValue' || methodName === 'count';

        if (!isTrackedMethod) {
          return;
        }

        const variableName = node.id?.name;

        if (variableName === undefined) {
          return;
        }

        const { methods } = playwrightExtractionMethodsStatics;
        const methodKey = String(methodName) as keyof typeof methods;
        trackedVariables.set(variableName, methods[methodKey] as Identifier);
      },
      CallExpression: (node: Tsestree): void => {
        const isSpecFile = isSpecFileGuard({ filename: ctx.filename ?? '' });

        if (!isSpecFile) {
          return;
        }

        const isExpectCall = node.callee?.name === 'expect';

        if (!isExpectCall) {
          return;
        }

        const firstArg = node.arguments?.[0];
        const isIdentifier = firstArg?.type === 'Identifier';

        if (!isIdentifier) {
          return;
        }

        const argName = firstArg.name;

        if (argName === undefined) {
          return;
        }

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

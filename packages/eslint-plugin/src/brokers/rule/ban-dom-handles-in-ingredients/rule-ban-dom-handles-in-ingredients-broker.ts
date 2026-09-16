/**
 * PURPOSE: Bans DOM handles — refs, selectors, screen positions, and JSX — from ingredient
 * declaration files, so an ingredient stays confined to writing files and calling APIs. Fires on a
 * file matching one of three signals, none of them sufficient alone: `isIngredientDeclarationFileGuard`
 * (a bare `<name>-ingredient.ts(x)` filename, or this repo's real `<name>-ingredient-broker.ts(x)`
 * inside an `ingredient/` folder of a `*-recipes` package), OR the file itself calling the
 * framework's `ingredient({...})` declaration function anywhere in its body — checked as the file
 * is traversed, so a violation appearing before that call is still caught. Say so in the message,
 * because a rule that looks like it covers something and does not is worse than no rule.
 *
 * USAGE:
 * const rule = ruleBanDomHandlesInIngredientsBroker();
 * // Returns an ESLint rule that flags `page.locator(...)`, `getBoundingClientRect()`, `useRef()`,
 * // JSX markup, and an import of `react` or `playwright` inside an ingredient declaration file —
 * // by path, or by calling `ingredient({...})` — and stays silent on the same code elsewhere.
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { domHandleWatchlistStatics } from '../../../statics/dom-handle-watchlist/dom-handle-watchlist-statics';
import { isIngredientDeclarationFileGuard } from '../../../guards/is-ingredient-declaration-file/is-ingredient-declaration-file-guard';
import { isIngredientDeclarationCallGuard } from '../../../guards/is-ingredient-declaration-call/is-ingredient-declaration-call-guard';

export const ruleBanDomHandlesInIngredientsBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          "Ban DOM handles — refs, selectors, screen positions, and JSX — from ingredient declaration files. An ingredient writes files and calls APIs; fires on a `<name>-ingredient.ts(x)` file, this repo's `<name>-ingredient-broker.ts(x)` inside a `*-recipes` package's `ingredient/` folder, or any file that calls `ingredient({...})`.",
      },
      messages: {
        domHandleInIngredient:
          "An ingredient touches STATE, never a screen, so it must not hold {{detail}}. The moment an ingredient knows about the UI it has become a walk. This rule fires on a file named `<name>-ingredient.ts`/`.tsx`, on this repo's `<name>-ingredient-broker.ts`/`.tsx` inside an `ingredient/` folder of a `*-recipes` package, or on any file that calls the framework's `ingredient(...)` declaration function directly — an ingredient reached only through a re-exported wrapper that never itself calls `ingredient(...)`, under none of those names or locations, is invisible to it.",
      },
      schema: [],
    },
  }),
  create: (context: unknown) => {
    const ctx = context as EslintContext;
    const filename = ctx.filename ?? ctx.getFilename?.() ?? '';

    const isKnownIngredientFileByPath = isIngredientDeclarationFileGuard({
      filename: String(filename),
    });
    let isKnownIngredientFileByCall = false;
    const pendingReports: (() => void)[] = [];

    return {
      ImportDeclaration: (node: Tsestree): void => {
        const sourceValue = node.source?.value;
        if (typeof sourceValue !== 'string') {
          return;
        }
        const isBannedSource = domHandleWatchlistStatics.bannedImportSources.some(
          (source) => source === sourceValue,
        );
        if (isBannedSource) {
          pendingReports.push(() => {
            ctx.report({
              node,
              messageId: 'domHandleInIngredient',
              data: { detail: `an import of \`${sourceValue}\`, a UI-driving package` },
            });
          });
        }
      },

      'JSXElement, JSXFragment': (node: Tsestree): void => {
        pendingReports.push(() => {
          ctx.report({
            node,
            messageId: 'domHandleInIngredient',
            data: { detail: 'JSX markup, which renders a screen' },
          });
        });
      },

      CallExpression: (node: Tsestree): void => {
        if (isIngredientDeclarationCallGuard({ node })) {
          isKnownIngredientFileByCall = true;
        }

        const { callee } = node;

        if (callee?.type === 'Identifier' && callee.name !== undefined) {
          const calleeName = callee.name;
          if (domHandleWatchlistStatics.refCallNames.some((name) => name === calleeName)) {
            pendingReports.push(() => {
              ctx.report({
                node,
                messageId: 'domHandleInIngredient',
                data: { detail: `a DOM ref (\`${String(calleeName)}(...)\`)` },
              });
            });
          }
          return;
        }

        if (callee?.type !== 'MemberExpression') {
          return;
        }
        const propertyName =
          callee.property?.type === 'Identifier' ? callee.property.name : undefined;
        if (propertyName === undefined) {
          return;
        }
        if (domHandleWatchlistStatics.selectorMemberNames.some((name) => name === propertyName)) {
          pendingReports.push(() => {
            ctx.report({
              node,
              messageId: 'domHandleInIngredient',
              data: { detail: `a DOM selector call (\`.${String(propertyName)}(...)\`)` },
            });
          });
          return;
        }
        if (domHandleWatchlistStatics.positionMemberNames.some((name) => name === propertyName)) {
          pendingReports.push(() => {
            ctx.report({
              node,
              messageId: 'domHandleInIngredient',
              data: { detail: `a DOM position call (\`.${String(propertyName)}(...)\`)` },
            });
          });
        }
      },

      'Program:exit': (): void => {
        if (isKnownIngredientFileByPath || isKnownIngredientFileByCall) {
          pendingReports.forEach((report) => {
            report();
          });
        }
      },
    };
  },
});

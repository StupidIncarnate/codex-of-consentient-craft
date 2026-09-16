/**
 * PURPOSE: Bans `Date.now()`, `Math.random()` and `crypto.randomUUID()` from ingredient
 * declaration files. The recipe-book specification's whole argument for this rule is that the
 * chain already hands each row its own index, so reaching for one of these three global calls is
 * the only way left to break byte-identical output across two runs of the same plan. Fires on a
 * file matching one of three signals, none of them sufficient alone: `isIngredientDeclarationFileGuard`
 * (a bare `<name>-ingredient.ts(x)` filename, or this repo's real `<name>-ingredient-broker.ts(x)`
 * inside an `ingredient/` folder of a `*-recipes` package), OR the file itself calling the
 * framework's `ingredient({...})` declaration function anywhere in its body — checked as the file
 * is traversed, so a violation appearing before that call is still caught.
 *
 * USAGE:
 * const rule = ruleBanNondeterminismInIngredientsBroker();
 * // Returns an ESLint rule that flags `Date.now()`, `Math.random()` and `crypto.randomUUID()`
 * // inside an ingredient declaration file — by path, or by calling `ingredient({...})` — and
 * // stays silent on the same calls elsewhere (a route broker minting a real id is untouched).
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { nondeterministicCallWatchlistStatics } from '../../../statics/nondeterministic-call-watchlist/nondeterministic-call-watchlist-statics';
import { isIngredientDeclarationFileGuard } from '../../../guards/is-ingredient-declaration-file/is-ingredient-declaration-file-guard';
import { isIngredientDeclarationCallGuard } from '../../../guards/is-ingredient-declaration-call/is-ingredient-declaration-call-guard';

export const ruleBanNondeterminismInIngredientsBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          "Ban Date.now(), Math.random() and crypto.randomUUID() from ingredient declaration files. The chain hands each row its own index, so nothing else in an ingredient needs to vary. Fires on a `<name>-ingredient.ts(x)` file, this repo's `<name>-ingredient-broker.ts(x)` inside a `*-recipes` package's `ingredient/` folder, or any file that calls `ingredient({...})`.",
      },
      messages: {
        nondeterministicCallInIngredient:
          "An ingredient must not call `{{objectName}}.{{propertyName}}()` — the chain already hands each row its own index, so this is the only way left to break byte-identical output across two runs of the same plan. This rule fires on a file named `<name>-ingredient.ts`/`.tsx`, on this repo's `<name>-ingredient-broker.ts`/`.tsx` inside an `ingredient/` folder of a `*-recipes` package, or on any file that calls the framework's `ingredient(...)` declaration function directly — a destructured import (`import { randomUUID } from 'node:crypto'`), an equivalent call (`new Date()`, `performance.now()`), or an ingredient reached only through a re-exported wrapper that never itself calls `ingredient(...)`, is invisible to it.",
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
      CallExpression: (node: Tsestree): void => {
        if (isIngredientDeclarationCallGuard({ node })) {
          isKnownIngredientFileByCall = true;
        }

        const { callee } = node;
        if (callee?.type !== 'MemberExpression') {
          return;
        }
        const objectName = callee.object?.type === 'Identifier' ? callee.object.name : undefined;
        const propertyName =
          callee.property?.type === 'Identifier' ? callee.property.name : undefined;
        if (objectName === undefined || propertyName === undefined) {
          return;
        }

        const isBanned = nondeterministicCallWatchlistStatics.bannedCalls.some(
          (call) => call.objectName === objectName && call.propertyName === propertyName,
        );
        if (isBanned) {
          pendingReports.push(() => {
            ctx.report({
              node,
              messageId: 'nondeterministicCallInIngredient',
              data: { objectName: String(objectName), propertyName: String(propertyName) },
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

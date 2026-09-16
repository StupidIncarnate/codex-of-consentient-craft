/**
 * PURPOSE: Bans `Date.now()`, `Math.random()` and `crypto.randomUUID()` from ingredient
 * declaration files. The recipe-book specification's whole argument for this rule is that the
 * chain already hands each row its own index, so reaching for one of these three global calls is
 * the only way left to break byte-identical output across two runs of the same plan. Scoped to
 * files literally named `<name>-ingredient.ts` or `.tsx`.
 *
 * USAGE:
 * const rule = ruleBanNondeterminismInIngredientsBroker();
 * // Returns an ESLint rule that flags `Date.now()`, `Math.random()` and `crypto.randomUUID()`
 * // inside a `*-ingredient.ts(x)` file, and stays silent on the same calls anywhere else — and on
 * // a destructured import of the same function (`import { randomUUID } from 'node:crypto'`).
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { nondeterministicCallWatchlistStatics } from '../../../statics/nondeterministic-call-watchlist/nondeterministic-call-watchlist-statics';
import { isIngredientDeclarationFileGuard } from '../../../guards/is-ingredient-declaration-file/is-ingredient-declaration-file-guard';

export const ruleBanNondeterminismInIngredientsBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban Date.now(), Math.random() and crypto.randomUUID() from ingredient declaration files. The chain hands each row its own index, so nothing else in an ingredient needs to vary. Scoped to files named `<name>-ingredient.ts` or `.tsx`.',
      },
      messages: {
        nondeterministicCallInIngredient:
          "An ingredient must not call `{{objectName}}.{{propertyName}}()` — the chain already hands each row its own index, so this is the only way left to break byte-identical output across two runs of the same plan. This rule only fires on a file named `<name>-ingredient.ts` or `.tsx`, and only on this exact global call — a destructured import (`import { randomUUID } from 'node:crypto'`) or an equivalent call (`new Date()`, `performance.now()`) is invisible to it.",
      },
      schema: [],
    },
  }),
  create: (context: unknown) => {
    const ctx = context as EslintContext;
    const filename = ctx.filename ?? ctx.getFilename?.() ?? '';

    if (!isIngredientDeclarationFileGuard({ filename: String(filename) })) {
      return {};
    }

    return {
      CallExpression: (node: Tsestree): void => {
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
          ctx.report({
            node,
            messageId: 'nondeterministicCallInIngredient',
            data: { objectName: String(objectName), propertyName: String(propertyName) },
          });
        }
      },
    };
  },
});

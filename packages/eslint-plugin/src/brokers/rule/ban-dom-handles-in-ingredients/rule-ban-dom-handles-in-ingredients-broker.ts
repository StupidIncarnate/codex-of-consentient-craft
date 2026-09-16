/**
 * PURPOSE: Bans DOM handles — refs, selectors, screen positions, and JSX — from ingredient
 * declaration files, so an ingredient stays confined to writing files and calling APIs. Scoped to
 * files literally named `<name>-ingredient.ts` or `.tsx`; an ingredient declared under a different
 * filename is invisible to it — say so in the message, because a rule that looks like it covers
 * something and does not is worse than no rule.
 *
 * USAGE:
 * const rule = ruleBanDomHandlesInIngredientsBroker();
 * // Returns an ESLint rule that flags `page.locator(...)`, `getBoundingClientRect()`, `useRef()`,
 * // JSX markup, and an import of `react` or `playwright` inside a `*-ingredient.ts(x)` file — and
 * // stays silent on the same code anywhere else.
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { domHandleWatchlistStatics } from '../../../statics/dom-handle-watchlist/dom-handle-watchlist-statics';
import { isIngredientDeclarationFileGuard } from '../../../guards/is-ingredient-declaration-file/is-ingredient-declaration-file-guard';

export const ruleBanDomHandlesInIngredientsBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban DOM handles — refs, selectors, screen positions, and JSX — from ingredient declaration files. An ingredient writes files and calls APIs; scoped to files named `<name>-ingredient.ts` or `.tsx`.',
      },
      messages: {
        domHandleInIngredient:
          'An ingredient touches STATE, never a screen, so it must not hold {{detail}}. The moment an ingredient knows about the UI it has become a walk. This rule only fires on a file named `<name>-ingredient.ts` or `.tsx`; an ingredient declared under a different filename, or one that reaches a DOM handle through a re-exported wrapper, is invisible to it.',
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
      ImportDeclaration: (node: Tsestree): void => {
        const sourceValue = node.source?.value;
        if (typeof sourceValue !== 'string') {
          return;
        }
        const isBannedSource = domHandleWatchlistStatics.bannedImportSources.some(
          (source) => source === sourceValue,
        );
        if (isBannedSource) {
          ctx.report({
            node,
            messageId: 'domHandleInIngredient',
            data: { detail: `an import of \`${sourceValue}\`, a UI-driving package` },
          });
        }
      },

      'JSXElement, JSXFragment': (node: Tsestree): void => {
        ctx.report({
          node,
          messageId: 'domHandleInIngredient',
          data: { detail: 'JSX markup, which renders a screen' },
        });
      },

      CallExpression: (node: Tsestree): void => {
        const { callee } = node;

        if (callee?.type === 'Identifier' && callee.name !== undefined) {
          const calleeName = callee.name;
          if (domHandleWatchlistStatics.refCallNames.some((name) => name === calleeName)) {
            ctx.report({
              node,
              messageId: 'domHandleInIngredient',
              data: { detail: `a DOM ref (\`${String(calleeName)}(...)\`)` },
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
          ctx.report({
            node,
            messageId: 'domHandleInIngredient',
            data: { detail: `a DOM selector call (\`.${String(propertyName)}(...)\`)` },
          });
          return;
        }
        if (domHandleWatchlistStatics.positionMemberNames.some((name) => name === propertyName)) {
          ctx.report({
            node,
            messageId: 'domHandleInIngredient',
            data: { detail: `a DOM position call (\`.${String(propertyName)}(...)\`)` },
          });
        }
      },
    };
  },
});

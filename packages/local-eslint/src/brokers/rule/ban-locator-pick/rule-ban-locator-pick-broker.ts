/**
 * PURPOSE: Holds the no-pick rule (siegelense-tooling.md's "Holding the no-pick rule mechanically")
 * inside the step-command broker implementations only. `.first()`/`.last()` on a
 * locator there are never legitimate — both mean an ambiguity the caller did not resolve, which is
 * the whole defect `stepTargetResolveBroker` exists to throw on instead. `.nth()` is banned only
 * when its argument is a literal: `.nth(0)` written as a literal is `.first()` with extra steps, but
 * `.nth()` is a naming-ladder rung a caller may legitimately ask for when the index comes from
 * caller input. Cannot reach `querySelector` inside a page-eval source string — that stays prose in
 * packages/siegelense/CLAUDE.md, per the same section's own caution that a rule inspecting string
 * contents is fragile enough to be its own liability.
 *
 * USAGE:
 * const rule = ruleBanLocatorPickBroker();
 * // Returns ESLint rule that flags `locator.first()`, `locator.last()` and `locator.nth(0)` inside
 * // packages/siegelense/src/brokers/step/** — and stays silent on `locator.nth(index)` there, and
 * // on the identical text anywhere outside that path.
 *
 * WHEN-TO-USE: Registered in @dungeonmaster/local-eslint (this repo only, never shipped) to hold the
 * standing "nothing ever silently picks a match" constraint over the step-command implementations.
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { locatorPickStatics } from '../../../statics/locator-pick/locator-pick-statics';
import { isLocatorPickScopeFileGuard } from '../../../guards/is-locator-pick-scope-file/is-locator-pick-scope-file-guard';

export const ruleBanLocatorPickBroker = (): TSESLint.RuleModule<'locatorPick' | 'literalNth'> => ({
  meta: {
    type: 'problem',
    docs: {
      description:
        "Ban '.first()'/'.last()' and a literal '.nth()' on a locator inside the step-command broker implementations only (packages/siegelense/src/brokers/step/**) — ambiguity there must throw, never silently resolve to one match.",
    },
    messages: {
      locatorPick:
        "This rule enforces the no-pick rule inside the step-command broker implementations only ({{scope}}). Do not call '.{{method}}()' here — it silently resolves an ambiguity the caller did not resolve. Let the target-resolve broker throw instead, or narrow with `within`.",
      literalNth:
        "This rule enforces the no-pick rule inside the step-command broker implementations only ({{scope}}). Do not call '.nth({{argument}})' with a literal index — '.nth(0)' written as a literal is '.first()' with extra steps. '.nth()' is allowed only when its index comes from caller input (a parameter or a variable).",
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context: unknown) => {
    const ctx = context as TSESLint.RuleContext<string, unknown[]>;
    const { filename } = ctx;

    if (!isLocatorPickScopeFileGuard({ filename })) {
      return {};
    }

    return {
      CallExpression: (node: TSESTree.CallExpression): void => {
        const { callee } = node;
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

        const isAlwaysBanned = locatorPickStatics.bannedMethodNames.always.some(
          (name) => name === methodName,
        );
        if (isAlwaysBanned) {
          ctx.report({
            node,
            messageId: 'locatorPick',
            data: {
              method: methodName,
              scope: locatorPickStatics.scope.inScopePathSubstring,
            },
          });
          return;
        }

        if (methodName !== locatorPickStatics.bannedMethodNames.conditional) {
          return;
        }

        const [firstArgument] = node.arguments;
        if (!firstArgument || firstArgument.type !== AST_NODE_TYPES.Literal) {
          return;
        }

        ctx.report({
          node,
          messageId: 'literalNth',
          data: {
            argument: String(firstArgument.value),
            scope: locatorPickStatics.scope.inScopePathSubstring,
          },
        });
      },
    };
  },
});

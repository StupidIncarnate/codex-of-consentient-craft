/**
 * PURPOSE: Refuses a `calledWith([])` answer on a handle from `registerMock({ fn })` where `fn`'s
 * real signature requires at least one argument — the prefix-match rule that lets `calledWith`
 * describe fewer arguments than a call passes makes an empty array match ANY call, so this is a
 * catch-all in every way that matters except syntax. Needs the TypeScript type checker to tell
 * `fn`'s signature (so `randomUUID`, which takes none, still passes), so this rule runs only through
 * ward's typecheck-backed lint pass, never pre-edit — the same reason `platform-globals-ban` and
 * `gateway-return-unknown-not-caller-type` are ward-only, and why this rule's own type-checking
 * branch is proven only through its RuleTester integration test, real ESLint over a real
 * TypeScript program, rather than a Jest unit test mocking the compiler API.
 *
 * USAGE:
 * const rule = ruleBanProxyEmptyCalledWithBroker();
 * // Flags `registerMock({ fn: readFileSync })` then `handle.calledWith([]).returns('')`;
 * // leaves `registerMock({ fn: randomUUID })` then `handle.calledWith([]).returns(uuid)` alone
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { identifierContract, type Identifier } from '@dungeonmaster/shared/contracts';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { typedFunctionTakesNoArgsTransformer } from '../../../transformers/typed-function-takes-no-args/typed-function-takes-no-args-transformer';

export const ruleBanProxyEmptyCalledWithBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          "Ban calledWith([]) on a registerMock({ fn }) handle whose fn's real signature requires an argument.",
      },
      messages: {
        emptyCalledWithRequiresArgs:
          "This handle's fn requires at least one argument, so calledWith([]) matches every call — including ones you never described, the same as a wildcard predicate. Address it by the real arguments instead; only a truly zero-arg function (randomUUID, Date.now) may use calledWith([]).",
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const filename = String(ctx.filename ?? '');

    if (!hasFileSuffixGuard({ filename, suffix: 'proxy' })) {
      return {};
    }

    // `fnProperty.value` reads as `unknown` from the Tsestree contract (the same gap
    // validate-no-exposed-child-proxies-layer-broker documents for Property.value) — it is handed
    // straight to typedFunctionTakesNoArgsTransformer, whose own `node` parameter is `unknown` too
    // and narrows it internally via the real TSESTree.Node cast, so no narrowing happens here.
    const fnNodesByHandleName = new Map<Identifier, unknown>();

    return {
      VariableDeclarator: (node: Tsestree): void => {
        const { id, init } = node;

        if (!id?.name || init?.type !== 'CallExpression') {
          return;
        }

        if (init.callee?.type !== 'Identifier' || init.callee.name !== 'registerMock') {
          return;
        }

        const [optionsArgument] = init.arguments ?? [];

        if (optionsArgument?.type !== 'ObjectExpression') {
          return;
        }

        const fnProperty = (optionsArgument.properties ?? []).find(
          (property) => property.key?.name === 'fn',
        );

        if (!fnProperty?.value) {
          return;
        }

        fnNodesByHandleName.set(identifierContract.parse(id.name), fnProperty.value);
      },

      CallExpression: (node: Tsestree): void => {
        const { callee } = node;

        if (
          callee?.type !== 'MemberExpression' ||
          callee.property?.name !== 'calledWith' ||
          callee.object?.type !== 'Identifier' ||
          !callee.object.name
        ) {
          return;
        }

        const fnValueNode = fnNodesByHandleName.get(identifierContract.parse(callee.object.name));

        if (!fnValueNode) {
          return;
        }

        const [addressArgument] = node.arguments ?? [];

        if (
          addressArgument?.type !== 'ArrayExpression' ||
          (addressArgument.elements ?? []).length !== 0
        ) {
          return;
        }

        const takesNoArgs = typedFunctionTakesNoArgsTransformer({
          context: ctx,
          node: fnValueNode,
        });

        if (takesNoArgs === false) {
          ctx.report({ node, messageId: 'emptyCalledWithRequiresArgs' });
        }
      },
    };
  },
});

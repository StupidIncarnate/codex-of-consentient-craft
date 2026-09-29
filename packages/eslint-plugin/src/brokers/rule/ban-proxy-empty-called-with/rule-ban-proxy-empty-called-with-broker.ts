/**
 * PURPOSE: Refuses a `calledWith([])` answer on a handle from `registerMock({ fn })` where `fn`'s
 * real signature requires at least one argument, or from `registerSpyOn({ object, method })` where
 * `object[method]` does — the prefix-match rule that lets `calledWith`
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
 * // and `registerSpyOn({ object: process.stderr, method: 'write' })` then `spy.calledWith([])`;
 * // leaves `registerMock({ fn: randomUUID })` then `handle.calledWith([]).returns(uuid)` alone
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import { voidSinkSpyLayerBroker } from './void-sink-spy-layer-broker';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { identifierContract, type Identifier } from '@dungeonmaster/shared/contracts';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { typedFunctionTakesNoArgsTransformer } from '../../../transformers/typed-function-takes-no-args/typed-function-takes-no-args-transformer';
import { typedSpyMethodTakesNoArgsLayerBroker } from './typed-spy-method-takes-no-args-layer-broker';

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

    // `Property.value` reads as `unknown` from the Tsestree contract (the same gap
    // validate-no-exposed-child-proxies-layer-broker documents) — each node is handed straight to
    // the type-checker helpers, whose own parameters are `unknown` and narrow via the real
    // TSESTree.Node cast. A handle maps to a thunk so the type checker runs only when a
    // `calledWith([])` on it is actually found.
    const takesNoArgsByHandleName = new Map<Identifier, () => boolean | undefined>();
    // A spy on a void sink (`process.stdout|stderr` `write`, `process` `on`) is a recorder, not a
    // catch-all, when the proxy reads its calls back — so its report waits for Program:exit, by
    // which point every read-back in the file has been seen.
    const voidSinkHandleNames = new Set<Identifier>();
    const readBackHandleNames = new Set<Identifier>();
    const deferredReports: { node: Tsestree; handleName: Identifier }[] = [];

    return {
      VariableDeclarator: (node: Tsestree): void => {
        const { id, init } = node;

        if (!id?.name || init?.type !== 'CallExpression' || init.callee?.type !== 'Identifier') {
          return;
        }

        const registerName = init.callee.name;

        if (registerName !== 'registerMock' && registerName !== 'registerSpyOn') {
          return;
        }

        const [optionsArgument] = init.arguments ?? [];

        if (optionsArgument?.type !== 'ObjectExpression') {
          return;
        }

        const properties = optionsArgument.properties ?? [];
        const handleName = identifierContract.parse(id.name);

        if (registerName === 'registerMock') {
          const fnNode = properties.find((property) => property.key?.name === 'fn')?.value;

          if (fnNode) {
            takesNoArgsByHandleName.set(handleName, () =>
              typedFunctionTakesNoArgsTransformer({ context: ctx, node: fnNode }),
            );
          }

          return;
        }

        const objectNode = properties.find((property) => property.key?.name === 'object')?.value;
        const method = properties.find((property) => property.key?.name === 'method')?.value;

        if (
          objectNode &&
          typeof method === 'object' &&
          method !== null &&
          'value' in method &&
          typeof method.value === 'string'
        ) {
          const methodName = method.value;

          if (voidSinkSpyLayerBroker({ objectNode, method: methodName })) {
            voidSinkHandleNames.add(handleName);
          }

          takesNoArgsByHandleName.set(handleName, () =>
            typedSpyMethodTakesNoArgsLayerBroker({
              context: ctx,
              objectNode,
              method: methodName,
            }),
          );
        }
      },

      MemberExpression: (node: Tsestree): void => {
        if (
          node.object?.type === 'Identifier' &&
          node.object.name &&
          (node.property?.name === 'callsMatching' || node.property?.name === 'mock')
        ) {
          readBackHandleNames.add(identifierContract.parse(node.object.name));
        }
      },

      'Program:exit': (): void => {
        for (const { node, handleName } of deferredReports) {
          if (readBackHandleNames.has(handleName)) {
            continue;
          }
          if (takesNoArgsByHandleName.get(handleName)?.() === false) {
            ctx.report({ node, messageId: 'emptyCalledWithRequiresArgs' });
          }
        }
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

        const takesNoArgsOf = takesNoArgsByHandleName.get(
          identifierContract.parse(callee.object.name),
        );

        if (!takesNoArgsOf) {
          return;
        }

        const [addressArgument] = node.arguments ?? [];

        if (
          addressArgument?.type !== 'ArrayExpression' ||
          (addressArgument.elements ?? []).length !== 0
        ) {
          return;
        }

        const handleName = identifierContract.parse(callee.object.name);

        if (voidSinkHandleNames.has(handleName)) {
          deferredReports.push({ node, handleName });
          return;
        }

        if (takesNoArgsOf() === false) {
          ctx.report({ node, messageId: 'emptyCalledWithRequiresArgs' });
        }
      },
    };
  },
});

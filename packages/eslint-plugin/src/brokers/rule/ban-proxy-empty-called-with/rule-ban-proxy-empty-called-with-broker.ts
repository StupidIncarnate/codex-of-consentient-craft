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
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { voidSinkSpyLayerBroker } from './void-sink-spy-layer-broker';
import { type Identifier } from '@dungeonmaster/shared/contracts';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { typedFunctionTakesNoArgsTransformer } from '../../../transformers/typed-function-takes-no-args/typed-function-takes-no-args-transformer';
import { typedSpyMethodTakesNoArgsLayerBroker } from './typed-spy-method-takes-no-args-layer-broker';

export const ruleBanProxyEmptyCalledWithBroker =
  (): TSESLint.RuleModule<'emptyCalledWithRequiresArgs'> => ({
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
    defaultOptions: [],
    create: (context: TSESLint.RuleContext<string, unknown[]>) => {
      const ctx = context;
      const { filename } = ctx;

      if (!hasFileSuffixGuard({ filename, suffix: 'proxy' })) {
        return {};
      }

      // Each node is handed straight to the type-checker helpers, whose own parameters are `unknown`
      // and narrow via the real TSESTree.Node cast. A handle maps to a thunk so the type checker runs
      // only when a `calledWith([])` on it is actually found.
      const takesNoArgsByHandleName = new Map<string, () => boolean | undefined>();
      // A spy on a void sink (`process.stdout|stderr` `write`, `process` `on`, `stdout|stderr` imported from `#gateway/node/process`) is a recorder, not a
      // catch-all, when the proxy reads its calls back — so its report waits for Program:exit, by
      // which point every read-back in the file has been seen.
      const voidSinkHandleNames = new Set<string>();
      // Local names of `stderr`/`stdout` imported from `#gateway/node/process` (an `as` alias records
      // the alias) — matched by import, so a local variable named `stderr` is not exempt.
      const gatewaySinkNames = new Set<string>();
      const readBackHandleNames = new Set<string>();
      const deferredReports: { node: TSESTree.Node; handleName: string }[] = [];

      return {
        ImportDeclaration: (node: TSESTree.ImportDeclaration): void => {
          if (!node.source.value.startsWith('#gateway/node/process')) {
            return;
          }

          for (const specifier of node.specifiers) {
            if (
              specifier.type === AST_NODE_TYPES.ImportSpecifier &&
              specifier.imported.type === AST_NODE_TYPES.Identifier &&
              (specifier.imported.name === 'stderr' || specifier.imported.name === 'stdout')
            ) {
              gatewaySinkNames.add(specifier.local.name);
            }
          }
        },

        VariableDeclarator: (node: TSESTree.VariableDeclarator): void => {
          const { id, init } = node;

          if (
            id.type !== AST_NODE_TYPES.Identifier ||
            init?.type !== AST_NODE_TYPES.CallExpression ||
            init.callee.type !== AST_NODE_TYPES.Identifier
          ) {
            return;
          }

          const registerName = init.callee.name;

          if (registerName !== 'registerMock' && registerName !== 'registerSpyOn') {
            return;
          }

          const [optionsArgument] = init.arguments;

          if (optionsArgument?.type !== AST_NODE_TYPES.ObjectExpression) {
            return;
          }

          const properties = optionsArgument.properties.filter(
            (property) => property.type === AST_NODE_TYPES.Property,
          );
          const handleName = id.name;

          if (registerName === 'registerMock') {
            const fnNode = properties.find(
              (property) =>
                property.key.type === AST_NODE_TYPES.Identifier && property.key.name === 'fn',
            )?.value;

            if (fnNode) {
              takesNoArgsByHandleName.set(handleName, () =>
                typedFunctionTakesNoArgsTransformer({ context: ctx, node: fnNode }),
              );
            }

            return;
          }

          const objectNode = properties.find(
            (property) =>
              property.key.type === AST_NODE_TYPES.Identifier && property.key.name === 'object',
          )?.value;
          const method = properties.find(
            (property) =>
              property.key.type === AST_NODE_TYPES.Identifier && property.key.name === 'method',
          )?.value;

          if (
            objectNode &&
            method?.type === AST_NODE_TYPES.Literal &&
            typeof method.value === 'string'
          ) {
            const methodName = method.value;

            if (voidSinkSpyLayerBroker({ objectNode, method: methodName, gatewaySinkNames })) {
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

        MemberExpression: (node: TSESTree.MemberExpression): void => {
          if (
            node.object.type === AST_NODE_TYPES.Identifier &&
            node.object.name &&
            (((node.property.type === AST_NODE_TYPES.Identifier ||
              node.property.type === AST_NODE_TYPES.PrivateIdentifier) &&
              node.property.name === 'callsMatching') ||
              ((node.property.type === AST_NODE_TYPES.Identifier ||
                node.property.type === AST_NODE_TYPES.PrivateIdentifier) &&
                node.property.name === 'mock'))
          ) {
            readBackHandleNames.add(node.object.name);
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

        CallExpression: (node: TSESTree.CallExpression): void => {
          const { callee } = node;

          if (
            callee.type !== AST_NODE_TYPES.MemberExpression ||
            (callee.property.type === AST_NODE_TYPES.Identifier ||
            callee.property.type === AST_NODE_TYPES.PrivateIdentifier
              ? callee.property.name
              : undefined) !== 'calledWith' ||
            callee.object.type !== AST_NODE_TYPES.Identifier ||
            !callee.object.name
          ) {
            return;
          }

          const takesNoArgsOf = takesNoArgsByHandleName.get(
            callee.object.name,
          );

          if (!takesNoArgsOf) {
            return;
          }

          const [addressArgument] = node.arguments;

          if (
            addressArgument?.type !== AST_NODE_TYPES.ArrayExpression ||
            addressArgument.elements.length !== 0
          ) {
            return;
          }

          const handleName = callee.object.name;

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

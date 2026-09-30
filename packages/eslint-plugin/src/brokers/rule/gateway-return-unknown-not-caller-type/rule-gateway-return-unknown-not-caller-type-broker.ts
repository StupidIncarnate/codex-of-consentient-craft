/**
 * PURPOSE: Refuses a gateway function that casts or declares its return as a type its CALLER
 * picked — the caller claiming what outside data is, with nothing checking the claim. Gateway
 * files only (`packages/@gateway/{npm,node,browser,bin}/src/**`); needs the TypeScript type
 * checker to tell a function's OWN generic type parameter apart from a real declared type
 * (an interface, a class, the outside package's own type), which is why it runs in ward's
 * typecheck-backed lint pass, never pre-edit — and why the cast and return-type checks live here
 * directly rather than in their own `brokers/` files: `enforce-import-dependencies` refuses a
 * `brokers/` file importing `eslint`/`@typescript-eslint/parser` even from a test, so a
 * type-checker-touching branch is proven only through this rule's own RuleTester integration
 * test, the same shape `platform-globals-ban` already uses. Three shapes are refused: a cast
 * whose target is a type parameter (`JSON.parse(text) as T`); a return type that is a bare type
 * parameter, or a `Promise` of one (`async <T>(): Promise<T>`), unless that same parameter also
 * names one of the function's own parameter types (a generic array helper forwarding the caller's
 * value unchanged); and an `any` leaving a function with NO declared return type, from a direct or
 * one-hop-local `JSON.parse`/`import()`. A cast or return type naming `unknown` or a real declared
 * type is left alone in every case.
 *
 * USAGE:
 * const rule = ruleGatewayReturnUnknownNotCallerTypeBroker();
 * // Flags `JSON.parse(text) as T` inside packages/@gateway/node/src/fetch/fetch-json/fetch-json.ts;
 * // leaves alone the same cast against `unknown`, or against a real interface
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isGatewayFileGuard } from '../../../guards/is-gateway-file/is-gateway-file-guard';
import { typedTypeParameterNameTransformer } from '../../../transformers/typed-type-parameter-name/typed-type-parameter-name-transformer';
import { isTypeNameReferencedLayerBroker } from './is-type-name-referenced-layer-broker';
import { checkAnyLeakReturnLayerBroker } from './check-any-leak-return-layer-broker';
import { isJsonParseOrDynamicImportCallLayerBroker } from './is-json-parse-or-dynamic-import-call-layer-broker';

export const ruleGatewayReturnUnknownNotCallerTypeBroker = (): TSESLint.RuleModule<
  'castToCallerType' | 'bareReturnTypeParameter' | 'anyLeakNoReturnType'
> => ({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Refuse a gateway function that casts or declares its return as a type its caller picked, instead of `unknown` or a real declared type.',
    },
    messages: {
      castToCallerType:
        'This cast names "{{typeParameterName}}", this function\'s own type parameter — the caller\'s picked type, not a checked one. Cast to `unknown`, or to a type this function or the outside package declares.',
      bareReturnTypeParameter:
        'The return type is bare type parameter "{{typeParameterName}}" — nothing in this function derived it from an input of that same type. Return `unknown`, or a type this function or the outside package declares.',
      anyLeakNoReturnType:
        "This function has no declared return type, so the untyped `any` from JSON.parse or import() leaves unchecked. Declare a return type — `unknown` for the caller's own data, or a real type.",
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context: unknown) => {
    const ctx = context as TSESLint.RuleContext<string, unknown[]>;
    const { filename } = ctx;

    if (filename.length === 0 || !isGatewayFileGuard({ filename })) {
      return {};
    }

    return {
      'TSAsExpression, TSTypeAssertion': (
        node: TSESTree.TSAsExpression | TSESTree.TSTypeAssertion,
      ): void => {
        const { typeAnnotation } = node;

        if (
          typeAnnotation.type !== AST_NODE_TYPES.TSTypeReference ||
          typeAnnotation.typeName.type !== AST_NODE_TYPES.Identifier
        ) {
          return;
        }

        const isPromiseWrapped = typeAnnotation.typeName.name === 'Promise';
        const promiseTypeArgs = typeAnnotation.typeArguments;
        const promiseInner = promiseTypeArgs?.params[0];
        const candidate = isPromiseWrapped ? promiseInner : typeAnnotation;

        if (
          candidate?.type !== AST_NODE_TYPES.TSTypeReference ||
          candidate.typeName.type !== AST_NODE_TYPES.Identifier
        ) {
          return;
        }

        const typeParameterName = typedTypeParameterNameTransformer({
          context: ctx,
          node: candidate.typeName,
        });

        if (typeParameterName === undefined) {
          return;
        }

        ctx.report({
          node,
          messageId: 'castToCallerType',
          data: { typeParameterName },
        });
      },

      'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression': (
        node:
          | TSESTree.FunctionDeclaration
          | TSESTree.FunctionExpression
          | TSESTree.ArrowFunctionExpression,
      ): void => {
        const returnTypeAnnotation = node.returnType?.typeAnnotation;

        if (
          returnTypeAnnotation?.type === AST_NODE_TYPES.TSTypeReference &&
          returnTypeAnnotation.typeName.type === AST_NODE_TYPES.Identifier
        ) {
          const isPromiseWrapped = returnTypeAnnotation.typeName.name === 'Promise';
          const promiseTypeArgs = returnTypeAnnotation.typeArguments;
          const promiseInner = promiseTypeArgs?.params[0];
          const candidate = isPromiseWrapped ? promiseInner : returnTypeAnnotation;

          if (
            candidate?.type === AST_NODE_TYPES.TSTypeReference &&
            candidate.typeName.type === AST_NODE_TYPES.Identifier
          ) {
            const typeParameterName = typedTypeParameterNameTransformer({
              context: ctx,
              node: candidate.typeName,
            });

            const isForwarded =
              typeParameterName !== undefined &&
              node.params.some((param) =>
                isTypeNameReferencedLayerBroker({
                  node: param,
                  typeParameterName: typeParameterName,
                }),
              );

            if (typeParameterName !== undefined && !isForwarded) {
              ctx.report({
                node,
                messageId: 'bareReturnTypeParameter',
                data: { typeParameterName },
              });
            }
          }
        }

        if (
          node.type === AST_NODE_TYPES.ArrowFunctionExpression &&
          !node.returnType &&
          !Array.isArray(node.body) &&
          node.body.type !== AST_NODE_TYPES.BlockStatement &&
          isJsonParseOrDynamicImportCallLayerBroker({ node: node.body })
        ) {
          ctx.report({ node: node.body, messageId: 'anyLeakNoReturnType' });
        }
      },

      ReturnStatement: (node: TSESTree.ReturnStatement): void => {
        checkAnyLeakReturnLayerBroker({ node, context: ctx });
      },
    };
  },
});

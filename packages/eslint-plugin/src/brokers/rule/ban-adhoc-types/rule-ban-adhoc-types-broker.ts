/**
 * PURPOSE: Bans ad-hoc interface definitions and inline type assertions to enforce using shared contracts.
 * With the `checkModuleLevelShapes` option on, it also bans an object type literal (alone, or inside a
 * union, intersection, array or type argument) in a module-level function's return type, type alias,
 * variable type or `new`/call type argument, because such a shape leaves the function as data another
 * function receives. An object type whose every member is a function stays; `.proxy.ts` files are skipped.
 *
 * USAGE:
 * const rule = ruleBanAdhocTypesBroker();
 * // Returns ESLint rule that prevents `interface Foo {}` and `as { foo: string }` in implementation files
 * // Registered with options: [{ checkModuleLevelShapes: true }] it also refuses
 * // `type CarveResult = { ok: true }` and `(): { camel: string } => …` at module level
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { projectFolderTypeFromFilePathTransformer } from '../../../transformers/project-folder-type-from-file-path/project-folder-type-from-file-path-transformer';
import { folderConfigTransformer } from '../../../transformers/folder-config/folder-config-transformer';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { isModuleLevelShapeGuard } from '../../../guards/is-module-level-shape/is-module-level-shape-guard';

export const ruleBanAdhocTypesBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban ad-hoc interface definitions and inline type assertions. Use shared contracts instead.',
      },
      messages: {
        noAdhocInterface:
          "Ad-hoc interface definitions are forbidden in {{folderType}}/ files. Define our types in contracts/ and import them. A library's types are imported through the gateway.",
        noAdhocShape:
          "An object type in a module-level {{where}} is forbidden in {{folderType}}/ files: it leaves the function as data. Define our types in contracts/ and import them. A library's types are imported through the gateway.",
        noInlineTypeAssertion:
          'Inline type assertions creating structural types (as {{"{"}}{"{"}}) are forbidden in {{folderType}}/ files. Use proper contracts from contracts/ folder.',
      },
      schema: [
        {
          type: 'object',
          properties: { checkModuleLevelShapes: { type: 'boolean' } },
          additionalProperties: false,
        },
      ],
    },
  }),
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const [option] = ctx.options;
    const checkModuleLevelShapes =
      typeof option === 'object' &&
      option !== null &&
      'checkModuleLevelShapes' in option &&
      option.checkModuleLevelShapes === true;
    const { filename } = ctx;

    // Get folder type to check config
    const folderType = projectFolderTypeFromFilePathTransformer({ filename });
    if (!folderType) {
      return {};
    }

    // Check if this folder type has the config
    const folderConfigValue = folderConfigTransformer({ folderType });

    // If config doesn't exist or disallowAdhocTypes is false, skip validation
    if (!folderConfigValue?.disallowAdhocTypes) {
      return {};
    }

    const reportShapes =
      checkModuleLevelShapes && !hasFileSuffixGuard({ filename, suffix: 'proxy' });

    const shapeListeners = reportShapes
      ? {
          TSTypeAliasDeclaration: (node: TSESTree.TSTypeAliasDeclaration): void => {
            if (isModuleLevelShapeGuard({ node, typeNode: node.typeAnnotation })) {
              ctx.report({
                node,
                messageId: 'noAdhocShape',
                data: { folderType, where: 'type alias' },
              });
            }
          },
          VariableDeclarator: (node: TSESTree.VariableDeclarator): void => {
            if (isModuleLevelShapeGuard({ node, typeNode: node.id.typeAnnotation })) {
              ctx.report({
                node,
                messageId: 'noAdhocShape',
                data: { folderType, where: 'variable type' },
              });
            }
          },
          // A function's return type only leaves it when the function itself is a module-level
          // declaration or a module-level `const f = …`; a callback passed to a call does not count.
          FunctionDeclaration: (node: TSESTree.FunctionDeclaration): void => {
            if (isModuleLevelShapeGuard({ node, typeNode: node.returnType })) {
              ctx.report({
                node,
                messageId: 'noAdhocShape',
                data: { folderType, where: 'return type' },
              });
            }
          },
          ArrowFunctionExpression: (node: TSESTree.ArrowFunctionExpression): void => {
            if (
              node.parent.type === AST_NODE_TYPES.VariableDeclarator &&
              isModuleLevelShapeGuard({ node, typeNode: node.returnType })
            ) {
              ctx.report({
                node,
                messageId: 'noAdhocShape',
                data: { folderType, where: 'return type' },
              });
            }
          },
          FunctionExpression: (node: TSESTree.FunctionExpression): void => {
            if (
              node.parent.type === AST_NODE_TYPES.VariableDeclarator &&
              isModuleLevelShapeGuard({ node, typeNode: node.returnType })
            ) {
              ctx.report({
                node,
                messageId: 'noAdhocShape',
                data: { folderType, where: 'return type' },
              });
            }
          },
          NewExpression: (node: TSESTree.NewExpression): void => {
            if (isModuleLevelShapeGuard({ node, typeNode: node.typeArguments })) {
              ctx.report({
                node,
                messageId: 'noAdhocShape',
                data: { folderType, where: 'type argument' },
              });
            }
          },
          CallExpression: (node: TSESTree.CallExpression): void => {
            if (isModuleLevelShapeGuard({ node, typeNode: node.typeArguments })) {
              ctx.report({
                node,
                messageId: 'noAdhocShape',
                data: { folderType, where: 'type argument' },
              });
            }
          },
        }
      : {};

    return {
      ...shapeListeners,
      // Ban ALL interface declarations (both top-level and nested)
      TSInterfaceDeclaration: (node: TSESTree.TSInterfaceDeclaration): void => {
        ctx.report({
          node,
          messageId: 'noAdhocInterface',
          data: {
            folderType,
          },
        });
      },

      // Ban inline type assertions that create structural types
      TSAsExpression: (node: TSESTree.TSAsExpression): void => {
        const { typeAnnotation } = node;

        // Allow 'as const' assertions
        if (typeAnnotation.type === AST_NODE_TYPES.TSTypeReference) {
          const { typeName } = typeAnnotation;
          if (typeName.type === AST_NODE_TYPES.Identifier && typeName.name === 'const') {
            return;
          }
        }

        // Allow 'as unknown' when part of 'as unknown as Type' pattern
        if (typeAnnotation.type === AST_NODE_TYPES.TSUnknownKeyword) {
          return;
        }

        // Check if this is an inline structural type (object literal type)
        if (typeAnnotation.type === AST_NODE_TYPES.TSTypeLiteral) {
          ctx.report({
            node,
            messageId: 'noInlineTypeAssertion',
            data: {
              folderType,
            },
          });
        }
      },
    };
  },
});

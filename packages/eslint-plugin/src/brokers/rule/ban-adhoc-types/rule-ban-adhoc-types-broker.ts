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
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
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
  create: (context: EslintContext) => {
    const ctx = context;
    const option = ctx.options?.[0];
    const checkModuleLevelShapes =
      typeof option === 'object' &&
      option !== null &&
      'checkModuleLevelShapes' in option &&
      option.checkModuleLevelShapes === true;
    const filename = String(ctx.filename ?? '');

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
          TSTypeAliasDeclaration: (node: Tsestree): void => {
            if (isModuleLevelShapeGuard({ node, typeNode: node.typeAnnotation })) {
              ctx.report({
                node,
                messageId: 'noAdhocShape',
                data: { folderType, where: 'type alias' },
              });
            }
          },
          VariableDeclarator: (node: Tsestree): void => {
            if (isModuleLevelShapeGuard({ node, typeNode: node.id?.typeAnnotation })) {
              ctx.report({
                node,
                messageId: 'noAdhocShape',
                data: { folderType, where: 'variable type' },
              });
            }
          },
          // A function's return type only leaves it when the function itself is a module-level
          // declaration or a module-level `const f = …`; a callback passed to a call does not count.
          FunctionDeclaration: (node: Tsestree): void => {
            if (isModuleLevelShapeGuard({ node, typeNode: node.returnType })) {
              ctx.report({
                node,
                messageId: 'noAdhocShape',
                data: { folderType, where: 'return type' },
              });
            }
          },
          ArrowFunctionExpression: (node: Tsestree): void => {
            if (
              node.parent?.type === 'VariableDeclarator' &&
              isModuleLevelShapeGuard({ node, typeNode: node.returnType })
            ) {
              ctx.report({
                node,
                messageId: 'noAdhocShape',
                data: { folderType, where: 'return type' },
              });
            }
          },
          FunctionExpression: (node: Tsestree): void => {
            if (
              node.parent?.type === 'VariableDeclarator' &&
              isModuleLevelShapeGuard({ node, typeNode: node.returnType })
            ) {
              ctx.report({
                node,
                messageId: 'noAdhocShape',
                data: { folderType, where: 'return type' },
              });
            }
          },
          NewExpression: (node: Tsestree): void => {
            if (
              isModuleLevelShapeGuard({ node, typeNode: node.typeArguments ?? node.typeParameters })
            ) {
              ctx.report({
                node,
                messageId: 'noAdhocShape',
                data: { folderType, where: 'type argument' },
              });
            }
          },
          CallExpression: (node: Tsestree): void => {
            if (
              isModuleLevelShapeGuard({ node, typeNode: node.typeArguments ?? node.typeParameters })
            ) {
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
      TSInterfaceDeclaration: (node: Tsestree): void => {
        ctx.report({
          node,
          messageId: 'noAdhocInterface',
          data: {
            folderType,
          },
        });
      },

      // Ban inline type assertions that create structural types
      TSAsExpression: (node: Tsestree): void => {
        const { typeAnnotation } = node;
        if (!typeAnnotation) {
          return;
        }

        // Allow 'as const' assertions
        if (typeAnnotation.type === 'TSTypeReference') {
          const { typeName } = typeAnnotation;
          if (typeName && typeName.type === 'Identifier' && typeName.name === 'const') {
            return;
          }
        }

        // Allow 'as unknown' when part of 'as unknown as Type' pattern
        if (typeAnnotation.type === 'TSUnknownKeyword') {
          return;
        }

        // Check if this is an inline structural type (object literal type)
        if (typeAnnotation.type === 'TSTypeLiteral') {
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

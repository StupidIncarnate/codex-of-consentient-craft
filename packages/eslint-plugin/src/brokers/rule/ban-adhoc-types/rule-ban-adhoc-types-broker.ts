import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { folderConfigStatics } from '../../../statics/folder-config/folder-config-statics';
import { projectFolderTypeFromFilePathTransformer } from '../../../transformers/project-folder-type-from-file-path/project-folder-type-from-file-path-transformer';

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
          'Ad-hoc interface definitions are forbidden in {{folderType}}/ files. Define types in contracts/ and import them.',
        noInlineTypeAssertion:
          'Inline type assertions creating structural types (as {{"{"}}{"{"}}) are forbidden in {{folderType}}/ files. Use proper contracts from contracts/ folder.',
      },
      schema: [],
    },
  }),
  create: (context: unknown) => {
    const ctx = context as EslintContext;
    const filename = String(ctx.filename ?? '');

    // Get folder type to check config
    const folderType = projectFolderTypeFromFilePathTransformer({ filename });
    if (!folderType) {
      return {};
    }

    // Check if this folder type has the config
    const folderConfig = Reflect.get(folderConfigStatics, folderType) as
      | { disallowAdhocTypes?: boolean }
      | undefined;

    // If config doesn't exist or disallowAdhocTypes is false, skip validation
    if (!folderConfig || folderConfig.disallowAdhocTypes === false) {
      return {};
    }

    return {
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

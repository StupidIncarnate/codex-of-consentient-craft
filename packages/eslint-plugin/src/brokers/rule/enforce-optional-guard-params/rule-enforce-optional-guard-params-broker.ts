/**
 * PURPOSE: Enforces that all parameters in guard functions are optional to allow flexible guard usage
 *
 * USAGE:
 * const rule = ruleEnforceOptionalGuardParamsBroker();
 * // Returns ESLint rule that requires `({ param?: Type })` in guard files instead of `({ param: Type })`
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isFileInFolderTypeGuard } from '../../../guards/is-file-in-folder-type/is-file-in-folder-type-guard';

export const ruleEnforceOptionalGuardParamsBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description: 'Enforce all parameters in guard functions to be optional',
      },
      messages: {
        guardParamMustBeOptional:
          'Parameter "{{propertyName}}" in guard function must be optional (use "{{propertyName}}?: Type")',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const filename = String(ctx.getFilename?.() ?? '');

    // Only check files in guards/ folder ending with -guard.ts
    if (
      !isFileInFolderTypeGuard({
        filename,
        folderType: 'guards',
        suffix: 'guard',
      })
    ) {
      return {};
    }

    return {
      ArrowFunctionExpression: (node: Tsestree): void => {
        const { params } = node;
        if (!params || params.length === 0) {
          return;
        }

        const [firstParam] = params;
        if (!firstParam) {
          return;
        }

        // Get type annotation - check ObjectPattern first
        let annotation: Tsestree | null | undefined = null;

        if (firstParam.type === 'ObjectPattern') {
          annotation = firstParam.typeAnnotation;
        } else if (
          firstParam.type === 'AssignmentPattern' &&
          firstParam.left?.type === 'ObjectPattern'
        ) {
          annotation = firstParam.left.typeAnnotation;
        }

        if (!annotation?.typeAnnotation || annotation.typeAnnotation.type !== 'TSTypeLiteral') {
          return;
        }

        const { members } = annotation.typeAnnotation;
        if (!members) {
          return;
        }

        // Check each property in the type annotation
        for (const member of members) {
          if (member.type === 'TSPropertySignature') {
            const propertyKey = member.key;
            const propertyName = propertyKey?.name ?? '';
            const isOptional = member.optional === true;

            if (!isOptional && propertyName.length > 0) {
              ctx.report({
                node: member,
                messageId: 'guardParamMustBeOptional',
                data: {
                  propertyName,
                },
              });
            }
          }
        }
      },
      FunctionDeclaration: (node: Tsestree): void => {
        const { params } = node;
        if (!params || params.length === 0) {
          return;
        }

        const [firstParam] = params;
        if (!firstParam) {
          return;
        }

        // Get type annotation - check ObjectPattern first
        let annotation: Tsestree | null | undefined = null;

        if (firstParam.type === 'ObjectPattern') {
          annotation = firstParam.typeAnnotation;
        } else if (
          firstParam.type === 'AssignmentPattern' &&
          firstParam.left?.type === 'ObjectPattern'
        ) {
          annotation = firstParam.left.typeAnnotation;
        }

        if (!annotation?.typeAnnotation || annotation.typeAnnotation.type !== 'TSTypeLiteral') {
          return;
        }

        const { members } = annotation.typeAnnotation;
        if (!members) {
          return;
        }

        // Check each property in the type annotation
        for (const member of members) {
          if (member.type === 'TSPropertySignature') {
            const propertyKey = member.key;
            const propertyName = propertyKey?.name ?? '';
            const isOptional = member.optional === true;

            if (!isOptional && propertyName.length > 0) {
              ctx.report({
                node: member,
                messageId: 'guardParamMustBeOptional',
                data: {
                  propertyName,
                },
              });
            }
          }
        }
      },
      FunctionExpression: (node: Tsestree): void => {
        const { params } = node;
        if (!params || params.length === 0) {
          return;
        }

        const [firstParam] = params;
        if (!firstParam) {
          return;
        }

        // Get type annotation - check ObjectPattern first
        let annotation: Tsestree | null | undefined = null;

        if (firstParam.type === 'ObjectPattern') {
          annotation = firstParam.typeAnnotation;
        } else if (
          firstParam.type === 'AssignmentPattern' &&
          firstParam.left?.type === 'ObjectPattern'
        ) {
          annotation = firstParam.left.typeAnnotation;
        }

        if (!annotation?.typeAnnotation || annotation.typeAnnotation.type !== 'TSTypeLiteral') {
          return;
        }

        const { members } = annotation.typeAnnotation;
        if (!members) {
          return;
        }

        // Check each property in the type annotation
        for (const member of members) {
          if (member.type === 'TSPropertySignature') {
            const propertyKey = member.key;
            const propertyName = propertyKey?.name ?? '';
            const isOptional = member.optional === true;

            if (!isOptional && propertyName.length > 0) {
              ctx.report({
                node: member,
                messageId: 'guardParamMustBeOptional',
                data: {
                  propertyName,
                },
              });
            }
          }
        }
      },
    };
  },
});

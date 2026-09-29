/**
 * PURPOSE: Enforces that all parameters in guard functions are optional to allow flexible guard usage
 *
 * USAGE:
 * const rule = ruleEnforceOptionalGuardParamsBroker();
 * // Returns ESLint rule that requires `({ param?: Type })` in guard files instead of `({ param: Type })`
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isFileInFolderTypeGuard } from '../../../guards/is-file-in-folder-type/is-file-in-folder-type-guard';

export const ruleEnforceOptionalGuardParamsBroker =
  (): TSESLint.RuleModule<'guardParamMustBeOptional'> => ({
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
    defaultOptions: [],
    create: (context: TSESLint.RuleContext<string, unknown[]>) => {
      const ctx = context;
      const { filename } = ctx;

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
        ArrowFunctionExpression: (node: TSESTree.ArrowFunctionExpression): void => {
          const { params } = node;
          if (params.length === 0) {
            return;
          }

          const [firstParam] = params;
          if (!firstParam) {
            return;
          }

          // Get type annotation - check ObjectPattern first
          let annotation: TSESTree.Node | null | undefined = null;

          if (firstParam.type === AST_NODE_TYPES.ObjectPattern) {
            annotation = firstParam.typeAnnotation;
          } else if (
            firstParam.type === AST_NODE_TYPES.AssignmentPattern &&
            firstParam.left.type === AST_NODE_TYPES.ObjectPattern
          ) {
            annotation = firstParam.left.typeAnnotation;
          }

          if (
            !annotation?.typeAnnotation ||
            annotation.typeAnnotation.type !== AST_NODE_TYPES.TSTypeLiteral
          ) {
            return;
          }

          const { members } = annotation.typeAnnotation;

          // Check each property in the type annotation
          for (const member of members) {
            if (member.type === AST_NODE_TYPES.TSPropertySignature) {
              const propertyKey = member.key;
              const propertyName =
                (propertyKey.type === AST_NODE_TYPES.Identifier ? propertyKey.name : undefined) ??
                '';
              const isOptional = member.optional;

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
        FunctionDeclaration: (node: TSESTree.FunctionDeclaration): void => {
          const { params } = node;
          if (params.length === 0) {
            return;
          }

          const [firstParam] = params;
          if (!firstParam) {
            return;
          }

          // Get type annotation - check ObjectPattern first
          let annotation: TSESTree.Node | null | undefined = null;

          if (firstParam.type === AST_NODE_TYPES.ObjectPattern) {
            annotation = firstParam.typeAnnotation;
          } else if (
            firstParam.type === AST_NODE_TYPES.AssignmentPattern &&
            firstParam.left.type === AST_NODE_TYPES.ObjectPattern
          ) {
            annotation = firstParam.left.typeAnnotation;
          }

          if (
            !annotation?.typeAnnotation ||
            annotation.typeAnnotation.type !== AST_NODE_TYPES.TSTypeLiteral
          ) {
            return;
          }

          const { members } = annotation.typeAnnotation;

          // Check each property in the type annotation
          for (const member of members) {
            if (member.type === AST_NODE_TYPES.TSPropertySignature) {
              const propertyKey = member.key;
              const propertyName =
                (propertyKey.type === AST_NODE_TYPES.Identifier ? propertyKey.name : undefined) ??
                '';
              const isOptional = member.optional;

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
        FunctionExpression: (node: TSESTree.FunctionExpression): void => {
          const { params } = node;
          if (params.length === 0) {
            return;
          }

          const [firstParam] = params;
          if (!firstParam) {
            return;
          }

          // Get type annotation - check ObjectPattern first
          let annotation: TSESTree.Node | null | undefined = null;

          if (firstParam.type === AST_NODE_TYPES.ObjectPattern) {
            annotation = firstParam.typeAnnotation;
          } else if (
            firstParam.type === AST_NODE_TYPES.AssignmentPattern &&
            firstParam.left.type === AST_NODE_TYPES.ObjectPattern
          ) {
            annotation = firstParam.left.typeAnnotation;
          }

          if (
            !annotation?.typeAnnotation ||
            annotation.typeAnnotation.type !== AST_NODE_TYPES.TSTypeLiteral
          ) {
            return;
          }

          const { members } = annotation.typeAnnotation;

          // Check each property in the type annotation
          for (const member of members) {
            if (member.type === AST_NODE_TYPES.TSPropertySignature) {
              const propertyKey = member.key;
              const propertyName =
                (propertyKey.type === AST_NODE_TYPES.Identifier ? propertyKey.name : undefined) ??
                '';
              const isOptional = member.optional;

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

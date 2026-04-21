/**
 * PURPOSE: Enforces return type rules on exported functions — annotation is required, no void/Promise<void> in function-exporting folders, guards must return boolean
 *
 * USAGE:
 * const rule = ruleEnforceFolderReturnTypesBroker();
 * // Returns EslintRule that validates exported-function return types against folder type expectations
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { functionExportingFolderFromFilenameTransformer } from '../../../transformers/function-exporting-folder-from-filename/function-exporting-folder-from-filename-transformer';
import { checkFolderReturnTypeLayerBroker } from './check-folder-return-type-layer-broker';

export const ruleEnforceFolderReturnTypesBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Enforce return type rules on exported functions — annotation required everywhere, no void/Promise<void> in function-exporting folders, guards must return boolean',
      },
      messages: {
        missingReturnType: 'Exported functions must have explicit return types',
        folderVoidReturn:
          'Functions in {{folderType}}/ must not return void — return a meaningful value (e.g., AdapterResult from @dungeonmaster/shared/contracts)',
        folderPromiseVoidReturn:
          'Functions in {{folderType}}/ must not return Promise<void> — return Promise<SomeType>',
        guardMustReturnBoolean: 'Guard functions must return boolean or type predicate (x is T)',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const filename = String(ctx.getFilename?.() ?? '');
    const folderType = functionExportingFolderFromFilenameTransformer({ filename });

    return {
      'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.type="Identifier"] > ArrowFunctionExpression:not([returnType])':
        (node: Tsestree): void => {
          ctx.report({ node, messageId: 'missingReturnType' });
        },
      'ExportNamedDeclaration > FunctionDeclaration:not([returnType])': (node: Tsestree): void => {
        ctx.report({ node, messageId: 'missingReturnType' });
      },
      'ExportDefaultDeclaration > FunctionDeclaration:not([returnType])': (
        node: Tsestree,
      ): void => {
        ctx.report({ node, messageId: 'missingReturnType' });
      },
      'ExportDefaultDeclaration > ArrowFunctionExpression:not([returnType])': (
        node: Tsestree,
      ): void => {
        ctx.report({ node, messageId: 'missingReturnType' });
      },
      'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.type="Identifier"] > ArrowFunctionExpression[returnType]':
        (node: Tsestree): void => {
          checkFolderReturnTypeLayerBroker({ node, ctx, folderType });
        },
      'ExportNamedDeclaration > FunctionDeclaration[returnType]': (node: Tsestree): void => {
        checkFolderReturnTypeLayerBroker({ node, ctx, folderType });
      },
      'ExportDefaultDeclaration > FunctionDeclaration[returnType]': (node: Tsestree): void => {
        checkFolderReturnTypeLayerBroker({ node, ctx, folderType });
      },
      'ExportDefaultDeclaration > ArrowFunctionExpression[returnType]': (node: Tsestree): void => {
        checkFolderReturnTypeLayerBroker({ node, ctx, folderType });
      },
    };
  },
});

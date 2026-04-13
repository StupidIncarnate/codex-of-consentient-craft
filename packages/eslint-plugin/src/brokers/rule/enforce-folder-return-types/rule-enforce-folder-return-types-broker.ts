/**
 * PURPOSE: Enforces return type constraints per folder type — adapters must return meaningful values, guards must return boolean
 *
 * USAGE:
 * const rule = ruleEnforceFolderReturnTypesBroker();
 * // Returns EslintRule that validates return types match folder type expectations
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isFileInFolderTypeGuard } from '../../../guards/is-file-in-folder-type/is-file-in-folder-type-guard';
import { checkFolderReturnTypeLayerBroker } from './check-folder-return-type-layer-broker';

export const ruleEnforceFolderReturnTypesBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Enforce return type constraints per folder type — adapters must return meaningful values, guards must return boolean',
      },
      messages: {
        adapterVoidReturn:
          'Adapter functions must not return void — return a meaningful value (e.g., AdapterResult from @dungeonmaster/shared/contracts)',
        adapterPromiseVoidReturn:
          'Adapter functions must not return Promise<void> — return Promise<AdapterResult> or another meaningful type',
        guardMustReturnBoolean: 'Guard functions must return boolean or type predicate (x is T)',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const filename = String(ctx.getFilename?.() ?? '');

    const isAdapter = isFileInFolderTypeGuard({
      filename,
      folderType: 'adapters',
      suffix: 'adapter',
    });

    const isGuard = isFileInFolderTypeGuard({
      filename,
      folderType: 'guards',
      suffix: 'guard',
    });

    // Only check files in adapters/ or guards/ folders
    if (!isAdapter && !isGuard) {
      return {};
    }

    return {
      'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.type="Identifier"] > ArrowFunctionExpression[returnType]':
        (node: Tsestree): void => {
          checkFolderReturnTypeLayerBroker({ node, ctx, isAdapter, isGuard });
        },
      'ExportNamedDeclaration > FunctionDeclaration[returnType]': (node: Tsestree): void => {
        checkFolderReturnTypeLayerBroker({ node, ctx, isAdapter, isGuard });
      },
      'ExportDefaultDeclaration > FunctionDeclaration[returnType]': (node: Tsestree): void => {
        checkFolderReturnTypeLayerBroker({ node, ctx, isAdapter, isGuard });
      },
      'ExportDefaultDeclaration > ArrowFunctionExpression[returnType]': (node: Tsestree): void => {
        checkFolderReturnTypeLayerBroker({ node, ctx, isAdapter, isGuard });
      },
    };
  },
});

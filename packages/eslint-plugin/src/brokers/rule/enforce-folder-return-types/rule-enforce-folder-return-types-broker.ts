/**
 * PURPOSE: Enforces return type rules on exported functions — annotation required everywhere;
 * void, Promise<void>, or a type that can only ever hold one value (R1) permitted in
 * function-exporting folders exactly when every gateway or broker call the function discards also
 * returned void; guards must return boolean. Needs the type checker (to grade each discarded
 * call's own return type), so it runs through ward's typecheck-backed lint pass, never pre-edit.
 *
 * USAGE:
 * const rule = ruleEnforceFolderReturnTypesBroker();
 * // Returns EslintRule that validates exported-function return types against folder type expectations
 */
import { folderTypeContract } from '@dungeonmaster/shared/contracts';
import { functionExportingFoldersStatics } from '../../../statics/function-exporting-folders/function-exporting-folders-statics';
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
          'Enforce return type rules on exported functions — annotation required everywhere, void/Promise<void>/a single-value type permitted in function-exporting folders exactly when every call the function discards also told it nothing, guards must return boolean',
      },
      messages: {
        missingReturnType: 'Exported functions must have explicit return types',
        folderVoidReturn:
          'This function discards a call that returned something real — return that value (or pass it through) instead of void. void is fine here ONLY when every gateway/broker call it discards also returned void.',
        folderPromiseVoidReturn:
          'This function discards a call that returned something real — return Promise<the real value> (or pass it through) instead of Promise<void>. Promise<void> is fine here ONLY when every gateway/broker call it discards also returned void.',
        folderDisguisedVoidReturn:
          'This return type can only ever hold one value, which says nothing more than void would — and this function discards a call that returned something real. Return that value instead.',
        folderUnknownReturn:
          'Functions in {{folderType}}/ must not return unknown — narrow to a Zod-validated branded type (only *-contract.ts and *-adapter.ts may return unknown at the I/O boundary)',
        folderObjectReturn:
          'Functions in {{folderType}}/ must not return object — return a specific shape or branded type (only *-contract.ts and *-adapter.ts may return object at the I/O boundary)',
        folderRecordUnknownReturn:
          'Functions in {{folderType}}/ must not return Record<string, unknown> or Record<PropertyKey, unknown> — return a specific shape or branded type (only *-contract.ts and *-adapter.ts may return loose Record at the I/O boundary)',
        guardMustReturnBoolean: 'Guard functions must return boolean or type predicate (x is T)',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const filename = String(ctx.getFilename?.() ?? '');
    const baseFolderType = functionExportingFolderFromFilenameTransformer({ filename });
    // Proxy files (e.g., foo-broker.proxy.ts) live in function-exporting folders but the
    // base transformer ignores them because their suffix is .proxy.ts. Detect proxy files
    // here so loose-return checks (unknown/object/Record) still apply.
    const proxyFolderName =
      !baseFolderType && filename.endsWith('.proxy.ts')
        ? functionExportingFoldersStatics.names.find((name) => filename.includes(`/${name}/`))
        : undefined;
    const folderType =
      baseFolderType ?? (proxyFolderName ? folderTypeContract.parse(proxyFolderName) : undefined);
    const isProxyFile = !baseFolderType && Boolean(proxyFolderName);

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
          checkFolderReturnTypeLayerBroker({ node, ctx, folderType, isProxyFile });
        },
      'ExportNamedDeclaration > FunctionDeclaration[returnType]': (node: Tsestree): void => {
        checkFolderReturnTypeLayerBroker({ node, ctx, folderType, isProxyFile });
      },
      'ExportDefaultDeclaration > FunctionDeclaration[returnType]': (node: Tsestree): void => {
        checkFolderReturnTypeLayerBroker({ node, ctx, folderType, isProxyFile });
      },
      'ExportDefaultDeclaration > ArrowFunctionExpression[returnType]': (node: Tsestree): void => {
        checkFolderReturnTypeLayerBroker({ node, ctx, folderType, isProxyFile });
      },
    };
  },
});

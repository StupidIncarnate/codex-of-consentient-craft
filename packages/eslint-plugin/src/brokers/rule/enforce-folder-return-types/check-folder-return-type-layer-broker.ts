/**
 * PURPOSE: Validates return type annotations against folder type constraints for function-exporting folders
 *
 * USAGE:
 * checkFolderReturnTypeLayerBroker({ node, ctx, folderType: FolderTypeStub({value: 'brokers'}) });
 * // Returns AdapterResult; reports lint error if annotation is void, Promise<void>, unknown/object/Record loose returns, or (for guards) not boolean/predicate
 */
import type { AdapterResult, FolderType } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

export const checkFolderReturnTypeLayerBroker = ({
  node,
  ctx,
  folderType,
  isProxyFile,
}: {
  node?: Tsestree;
  ctx?: EslintContext;
  folderType?: FolderType | undefined;
  isProxyFile?: boolean;
}): AdapterResult => {
  const result = adapterResultContract.parse({ success: true });

  if (!node || !ctx || !folderType) {
    return result;
  }

  const { returnType } = node;
  if (!returnType) {
    return result;
  }

  const { typeAnnotation } = returnType;
  if (!typeAnnotation) {
    return result;
  }

  // Proxy files only enforce loose-return checks (unknown/object/Record); they may legitimately
  // return void from mock setup helpers and bypass guard/void/promise-void rules.
  if (!isProxyFile && typeAnnotation.type === 'TSVoidKeyword') {
    ctx.report({
      node,
      messageId: 'folderVoidReturn',
      data: { folderType },
    });
    return result;
  }

  const typeArgs = typeAnnotation.typeArguments ?? typeAnnotation.typeParameters;
  if (
    !isProxyFile &&
    typeAnnotation.type === 'TSTypeReference' &&
    typeAnnotation.typeName?.name === 'Promise' &&
    typeArgs?.params?.[0]?.type === 'TSVoidKeyword'
  ) {
    ctx.report({
      node,
      messageId: 'folderPromiseVoidReturn',
      data: { folderType },
    });
    return result;
  }

  // Loose-return checks; carve-out for I/O boundary files (*-contract.ts, *-adapter.ts).
  // Contracts are not in function-exporting folders so they're already exempt; adapters are
  // exempt by suffix here so they can return raw external shapes.
  const filename = String(ctx.getFilename?.() ?? '');
  const isIoBoundaryFile = filename.endsWith('-contract.ts') || filename.endsWith('-adapter.ts');

  if (!isIoBoundaryFile) {
    if (typeAnnotation.type === 'TSUnknownKeyword') {
      ctx.report({
        node,
        messageId: 'folderUnknownReturn',
        data: { folderType },
      });
      return result;
    }
    if (typeAnnotation.type === 'TSObjectKeyword') {
      ctx.report({
        node,
        messageId: 'folderObjectReturn',
        data: { folderType },
      });
      return result;
    }
    const recordKeyParam = typeArgs?.params?.[0];
    const recordValueParam = typeArgs?.params?.[1];
    const isRecordKeyStringOrPropertyKey =
      recordKeyParam?.type === 'TSStringKeyword' ||
      (recordKeyParam?.type === 'TSTypeReference' &&
        recordKeyParam.typeName?.name === 'PropertyKey');
    if (
      typeAnnotation.type === 'TSTypeReference' &&
      typeAnnotation.typeName?.name === 'Record' &&
      isRecordKeyStringOrPropertyKey &&
      recordValueParam?.type === 'TSUnknownKeyword'
    ) {
      ctx.report({
        node,
        messageId: 'folderRecordUnknownReturn',
        data: { folderType },
      });
      return result;
    }
  }

  if (!isProxyFile && folderType === 'guards') {
    if (typeAnnotation.type !== 'TSBooleanKeyword' && typeAnnotation.type !== 'TSTypePredicate') {
      ctx.report({
        node,
        messageId: 'guardMustReturnBoolean',
      });
    }
  }
  return result;
};

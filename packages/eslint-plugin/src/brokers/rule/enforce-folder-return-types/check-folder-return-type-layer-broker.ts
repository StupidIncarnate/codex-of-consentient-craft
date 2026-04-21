/**
 * PURPOSE: Validates return type annotations against folder type constraints for function-exporting folders
 *
 * USAGE:
 * checkFolderReturnTypeLayerBroker({ node, ctx, folderType: FolderTypeStub({value: 'brokers'}) });
 * // Returns AdapterResult; reports lint error if annotation is void, Promise<void>, or (for guards) not boolean/predicate
 */
import type { AdapterResult, FolderType } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

export const checkFolderReturnTypeLayerBroker = ({
  node,
  ctx,
  folderType,
}: {
  node?: Tsestree;
  ctx?: EslintContext;
  folderType?: FolderType | undefined;
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

  if (typeAnnotation.type === 'TSVoidKeyword') {
    ctx.report({
      node,
      messageId: 'folderVoidReturn',
      data: { folderType },
    });
    return result;
  }

  const typeArgs = typeAnnotation.typeArguments ?? typeAnnotation.typeParameters;
  if (
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

  if (folderType === 'guards') {
    if (typeAnnotation.type !== 'TSBooleanKeyword' && typeAnnotation.type !== 'TSTypePredicate') {
      ctx.report({
        node,
        messageId: 'guardMustReturnBoolean',
      });
    }
  }
  return result;
};

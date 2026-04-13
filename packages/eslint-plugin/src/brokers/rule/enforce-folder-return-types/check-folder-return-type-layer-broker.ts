/**
 * PURPOSE: Validates return type annotations against folder type constraints for adapters and guards
 *
 * USAGE:
 * checkFolderReturnTypeLayerBroker({ node, ctx, isAdapter: true, isGuard: false });
 * // Reports lint error if adapter returns void or Promise<void>
 */
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

export const checkFolderReturnTypeLayerBroker = ({
  node,
  ctx,
  isAdapter,
  isGuard,
}: {
  node?: Tsestree;
  ctx?: EslintContext;
  isAdapter?: boolean;
  isGuard?: boolean;
}): void => {
  if (!node || !ctx) {
    return;
  }

  const { returnType } = node;
  if (!returnType) {
    return;
  }

  const { typeAnnotation } = returnType;
  if (!typeAnnotation) {
    return;
  }

  if (isAdapter === true) {
    // Adapter must NOT return void
    if (typeAnnotation.type === 'TSVoidKeyword') {
      ctx.report({
        node,
        messageId: 'adapterVoidReturn',
      });
      return;
    }

    // Adapter must NOT return Promise<void>
    // @typescript-eslint v6+ uses typeArguments instead of typeParameters
    const typeArgs = typeAnnotation.typeArguments ?? typeAnnotation.typeParameters;
    if (
      typeAnnotation.type === 'TSTypeReference' &&
      typeAnnotation.typeName?.name === 'Promise' &&
      typeArgs?.params?.[0]?.type === 'TSVoidKeyword'
    ) {
      ctx.report({
        node,
        messageId: 'adapterPromiseVoidReturn',
      });
    }
  }

  if (isGuard === true) {
    // Guard must return boolean or type predicate (x is T)
    if (typeAnnotation.type !== 'TSBooleanKeyword' && typeAnnotation.type !== 'TSTypePredicate') {
      ctx.report({
        node,
        messageId: 'guardMustReturnBoolean',
      });
    }
  }
};

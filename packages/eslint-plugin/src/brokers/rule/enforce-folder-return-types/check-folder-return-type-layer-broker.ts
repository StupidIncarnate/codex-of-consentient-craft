/**
 * PURPOSE: Validates return type annotations against folder type constraints for function-exporting
 * folders. R1: void (or a type that can only ever hold one value, such as `{ success: true }`) is
 * permitted exactly when every gateway or broker call the function discards also told it nothing —
 * a discarded call that returned something real is what earns the report, not the void return by
 * itself. Independent of R1: unknown/object/Record loose returns outside I/O-boundary files, and
 * (for guards) a return that is not boolean or a type predicate.
 *
 * USAGE:
 * checkFolderReturnTypeLayerBroker({ node, ctx, folderType: FolderTypeStub({value: 'brokers'}) });
 * // Returns AdapterResult; reports lint error if a void-like return discards an informative
 * // gateway/broker call, or unknown/object/Record loose returns, or (for guards) a non-boolean
 */
import type { AdapterResult, FolderType } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { typedReturnIsVoidLikeTransformer } from '../../../transformers/typed-return-is-void-like/typed-return-is-void-like-transformer';
import { typedParserServicesTransformer } from '../../../transformers/typed-parser-services/typed-parser-services-transformer';
import { isGatewayFileGuard } from '../../../guards/is-gateway-file/is-gateway-file-guard';
import { functionExportingFolderFromFilenameTransformer } from '../../../transformers/function-exporting-folder-from-filename/function-exporting-folder-from-filename-transformer';

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

  const typeArgs = typeAnnotation.typeArguments ?? typeAnnotation.typeParameters;

  if (!isProxyFile) {
    const declaredIsVoidLike = typedReturnIsVoidLikeTransformer({ context: ctx, node });

    // Every ExpressionStatement in the function's own top-level block whose expression (bare, or
    // unwrapped from one `await`) is a plain-identifier call — a MemberExpression callee
    // (array.push, map.set) is never a candidate, which is how built-in methods stay uncounted.
    const functionBody = Array.isArray(node.body) ? undefined : node.body;
    const bodyStatements =
      functionBody?.type === 'BlockStatement' && Array.isArray(functionBody.body)
        ? functionBody.body
        : [];
    const discardedCalls = bodyStatements.reduce<Tsestree[]>((calls, statement) => {
      if (statement.type !== 'ExpressionStatement') {
        return calls;
      }

      const { expression } = statement;
      const candidate = expression?.type === 'AwaitExpression' ? expression.argument : expression;

      if (candidate?.type === 'CallExpression' && candidate.callee?.type === 'Identifier') {
        calls.push(candidate);
      }

      return calls;
    }, []);

    const hasInformativeDiscardedCall = discardedCalls.some((callNode) => {
      const declarationFile = typedParserServicesTransformer({
        context: ctx,
        node: callNode.callee,
      });

      if (!declarationFile) {
        return false;
      }

      const counts =
        isGatewayFileGuard({ filename: declarationFile }) ||
        functionExportingFolderFromFilenameTransformer({ filename: declarationFile }) === 'brokers';

      if (!counts) {
        return false;
      }

      return typedReturnIsVoidLikeTransformer({ context: ctx, node: callNode }) === false;
    });

    if (declaredIsVoidLike === true && hasInformativeDiscardedCall) {
      const isPromiseWrapped =
        typeAnnotation.type === 'TSTypeReference' && typeAnnotation.typeName?.name === 'Promise';
      const isPromiseVoidAst = isPromiseWrapped && typeArgs?.params?.[0]?.type === 'TSVoidKeyword';

      ctx.report({
        node,
        messageId:
          typeAnnotation.type === 'TSVoidKeyword'
            ? 'folderVoidReturn'
            : isPromiseVoidAst
              ? 'folderPromiseVoidReturn'
              : 'folderDisguisedVoidReturn',
        data: { folderType },
      });
      return result;
    }
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

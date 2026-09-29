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
 * // Returns void; reports lint error if a void-like return discards an informative
 * // gateway/broker call, or unknown/object/Record loose returns, or (for guards) a non-boolean
 */
import type { FolderType } from '@dungeonmaster/shared/contracts';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
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
  node?: TSESTree.ArrowFunctionExpression | TSESTree.FunctionDeclaration;
  ctx?: TSESLint.RuleContext<string, unknown[]>;
  folderType?: FolderType | undefined;
  isProxyFile?: boolean;
}): void => {
  if (!node || !ctx || !folderType) {
    return;
  }

  const { returnType } = node;
  if (!returnType) {
    return;
  }

  const { typeAnnotation } = returnType;
  const typeReference =
    typeAnnotation.type === AST_NODE_TYPES.TSTypeReference ? typeAnnotation : undefined;
  const typeReferenceName =
    typeReference?.typeName.type === AST_NODE_TYPES.Identifier
      ? typeReference.typeName.name
      : undefined;
  const typeArgs = typeReference?.typeArguments;

  if (!isProxyFile) {
    const declaredIsVoidLike = typedReturnIsVoidLikeTransformer({ context: ctx, node });

    // Every ExpressionStatement in the function's own top-level block whose expression (bare, or
    // unwrapped from one `await`) is a plain-identifier call — a MemberExpression callee
    // (array.push, map.set) is never a candidate, which is how built-in methods stay uncounted.
    const bodyStatements = node.body.type === AST_NODE_TYPES.BlockStatement ? node.body.body : [];
    const discardedCalls = bodyStatements.reduce<TSESTree.CallExpression[]>((calls, statement) => {
      if (statement.type !== AST_NODE_TYPES.ExpressionStatement) {
        return calls;
      }

      const { expression } = statement;
      const candidate =
        expression.type === AST_NODE_TYPES.AwaitExpression ? expression.argument : expression;

      if (
        candidate.type === AST_NODE_TYPES.CallExpression &&
        candidate.callee.type === AST_NODE_TYPES.Identifier
      ) {
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
      const isPromiseWrapped = typeReferenceName === 'Promise';
      const isPromiseVoidAst =
        isPromiseWrapped && typeArgs?.params[0]?.type === AST_NODE_TYPES.TSVoidKeyword;

      ctx.report({
        node,
        messageId:
          typeAnnotation.type === AST_NODE_TYPES.TSVoidKeyword
            ? 'folderVoidReturn'
            : isPromiseVoidAst
              ? 'folderPromiseVoidReturn'
              : 'folderDisguisedVoidReturn',
        data: { folderType },
      });
      return;
    }
  }

  // Loose-return checks; carve-out for I/O boundary files (*-contract.ts, *-adapter.ts).
  // Contracts are not in function-exporting folders so they're already exempt; adapters are
  // exempt by suffix here so they can return raw external shapes.
  const { filename } = ctx;
  const isIoBoundaryFile = filename.endsWith('-contract.ts') || filename.endsWith('-adapter.ts');

  if (!isIoBoundaryFile) {
    if (typeAnnotation.type === AST_NODE_TYPES.TSUnknownKeyword) {
      ctx.report({
        node,
        messageId: 'folderUnknownReturn',
        data: { folderType },
      });
      return;
    }
    if (typeAnnotation.type === AST_NODE_TYPES.TSObjectKeyword) {
      ctx.report({
        node,
        messageId: 'folderObjectReturn',
        data: { folderType },
      });
      return;
    }
    const recordKeyParam = typeArgs?.params[0];
    const recordValueParam = typeArgs?.params[1];
    const isRecordKeyStringOrPropertyKey =
      recordKeyParam?.type === AST_NODE_TYPES.TSStringKeyword ||
      (recordKeyParam?.type === AST_NODE_TYPES.TSTypeReference &&
        recordKeyParam.typeName.type === AST_NODE_TYPES.Identifier &&
        recordKeyParam.typeName.name === 'PropertyKey');
    if (
      typeReferenceName === 'Record' &&
      isRecordKeyStringOrPropertyKey &&
      recordValueParam?.type === AST_NODE_TYPES.TSUnknownKeyword
    ) {
      ctx.report({
        node,
        messageId: 'folderRecordUnknownReturn',
        data: { folderType },
      });
      return;
    }
  }

  if (!isProxyFile && folderType === 'guards') {
    if (
      typeAnnotation.type !== AST_NODE_TYPES.TSBooleanKeyword &&
      typeAnnotation.type !== AST_NODE_TYPES.TSTypePredicate
    ) {
      ctx.report({
        node,
        messageId: 'guardMustReturnBoolean',
      });
    }
  }
};

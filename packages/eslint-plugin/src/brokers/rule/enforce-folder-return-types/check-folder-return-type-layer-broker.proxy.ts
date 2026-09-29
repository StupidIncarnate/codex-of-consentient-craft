import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
import { typedReturnIsVoidLikeTransformer } from '../../../transformers/typed-return-is-void-like/typed-return-is-void-like-transformer';
import { typedParserServicesTransformer } from '../../../transformers/typed-parser-services/typed-parser-services-transformer';

type FilePath = ReturnType<typeof FilePathStub>;

export const checkFolderReturnTypeLayerBrokerProxy = (): {
  setupDeclaredReturn: (args: { node: TSESTree.Node; isVoidLike: boolean | undefined }) => void;
  setupCallDeclarationFile: (args: {
    callNode: TSESTree.CallExpression;
    declarationFile: FilePath | undefined;
  }) => void;
  setupCallReturnIsVoidLike: (args: {
    callNode: TSESTree.Node;
    isVoidLike: boolean | undefined;
  }) => void;
} => {
  const returnIsVoidLikeHandle = registerMock({ fn: typedReturnIsVoidLikeTransformer });
  const declarationFileHandle = registerMock({ fn: typedParserServicesTransformer });

  return {
    // Addressed by the exact function node under lint, so a test can stage both the declaration's
    // own check and one or more call checks without them colliding.
    setupDeclaredReturn: ({
      node,
      isVoidLike,
    }: {
      node: TSESTree.Node;
      isVoidLike: boolean | undefined;
    }): void => {
      returnIsVoidLikeHandle
        .calledWith([
          (argument: { node: TSESTree.Node }) =>
            argument.node.type === node.type &&
            argument.node.range[0] === node.range[0] &&
            argument.node.range[1] === node.range[1],
        ])
        .returns(isVoidLike);
    },
    // Where a discarded call's callee is declared — the file path the layer broker classifies as
    // gateway, broker, or neither.
    setupCallDeclarationFile: ({
      callNode,
      declarationFile,
    }: {
      callNode: TSESTree.CallExpression;
      declarationFile: FilePath | undefined;
    }): void => {
      declarationFileHandle
        .calledWith([
          (argument: { node: TSESTree.Node }) =>
            argument.node.type === callNode.callee.type &&
            argument.node.range[0] === callNode.callee.range[0] &&
            argument.node.range[1] === callNode.callee.range[1],
        ])
        .returns(declarationFile);
    },
    // Whether one specific discarded call's own resolved return type is void-like.
    setupCallReturnIsVoidLike: ({
      callNode,
      isVoidLike,
    }: {
      callNode: TSESTree.Node;
      isVoidLike: boolean | undefined;
    }): void => {
      returnIsVoidLikeHandle
        .calledWith([
          (argument: { node: TSESTree.Node }) =>
            argument.node.type === callNode.type &&
            argument.node.range[0] === callNode.range[0] &&
            argument.node.range[1] === callNode.range[1],
        ])
        .returns(isVoidLike);
    },
  };
};

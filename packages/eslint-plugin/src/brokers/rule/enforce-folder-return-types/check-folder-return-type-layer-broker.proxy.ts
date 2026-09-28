import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePathStub } from '@dungeonmaster/shared/contracts';
import { typedReturnIsVoidLikeTransformer } from '../../../transformers/typed-return-is-void-like/typed-return-is-void-like-transformer';
import { typedParserServicesTransformer } from '../../../transformers/typed-parser-services/typed-parser-services-transformer';
import type { TsestreeStub } from '../../../contracts/tsestree/tsestree.stub';

type Tsestree = ReturnType<typeof TsestreeStub>;
type FilePath = ReturnType<typeof FilePathStub>;

export const checkFolderReturnTypeLayerBrokerProxy = (): {
  setupDeclaredReturn: (args: { node: Tsestree; isVoidLike: boolean | undefined }) => void;
  setupCallDeclarationFile: (args: {
    callNode: Tsestree;
    declarationFile: FilePath | undefined;
  }) => void;
  setupCallReturnIsVoidLike: (args: {
    callNode: Tsestree;
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
      node: Tsestree;
      isVoidLike: boolean | undefined;
    }): void => {
      returnIsVoidLikeHandle.calledWith([{ node }]).returns(isVoidLike);
    },
    // Where a discarded call's callee is declared — the file path the layer broker classifies as
    // gateway, broker, or neither.
    setupCallDeclarationFile: ({
      callNode,
      declarationFile,
    }: {
      callNode: Tsestree;
      declarationFile: FilePath | undefined;
    }): void => {
      declarationFileHandle.calledWith([{ node: callNode.callee }]).returns(declarationFile);
    },
    // Whether one specific discarded call's own resolved return type is void-like.
    setupCallReturnIsVoidLike: ({
      callNode,
      isVoidLike,
    }: {
      callNode: Tsestree;
      isVoidLike: boolean | undefined;
    }): void => {
      returnIsVoidLikeHandle.calledWith([{ node: callNode }]).returns(isVoidLike);
    },
  };
};

import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePathStub } from '@dungeonmaster/shared/contracts';
import { eslintTypedReturnIsVoidLikeAdapter } from '../../../adapters/eslint/typed-return-is-void-like/eslint-typed-return-is-void-like-adapter';
import { eslintTypedReturnIsVoidLikeAdapterProxy } from '../../../adapters/eslint/typed-return-is-void-like/eslint-typed-return-is-void-like-adapter.proxy';
import { eslintTypedParserServicesAdapter } from '../../../adapters/eslint/typed-parser-services/eslint-typed-parser-services-adapter';
import { eslintTypedParserServicesAdapterProxy } from '../../../adapters/eslint/typed-parser-services/eslint-typed-parser-services-adapter.proxy';
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
  // Both children are empty, real-execution DSL proxies (see their own folders) — called only to
  // satisfy enforce-proxy-child-creation; this proxy mocks the two adapters directly below.
  eslintTypedReturnIsVoidLikeAdapterProxy();
  eslintTypedParserServicesAdapterProxy();

  const returnIsVoidLikeHandle = registerMock({ fn: eslintTypedReturnIsVoidLikeAdapter });
  const declarationFileHandle = registerMock({ fn: eslintTypedParserServicesAdapter });

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

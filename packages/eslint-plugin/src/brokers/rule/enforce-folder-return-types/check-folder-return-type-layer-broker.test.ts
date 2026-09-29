import { checkFolderReturnTypeLayerBroker } from './check-folder-return-type-layer-broker';
import { checkFolderReturnTypeLayerBrokerProxy } from './check-folder-return-type-layer-broker.proxy';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';
import { FolderTypeStub } from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

describe('checkFolderReturnTypeLayerBroker', () => {
  describe('R1 — void is permitted exactly when every discarded call also told it nothing', () => {
    it('INVALID: void return discards a real value from a broker call => reports folderVoidReturn', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const callee = TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'otherBroker' });
      const callNode = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee,
        arguments: [],
      });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        returnType: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: TsestreeStub({ type: TsestreeNodeType.TSVoidKeyword }),
        }),
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            TsestreeStub({
              type: TsestreeNodeType.ExpressionStatement,
              expression: TsestreeStub({
                type: TsestreeNodeType.AwaitExpression,
                argument: callNode,
              }),
            }),
          ],
        }),
      });

      proxy.setupDeclaredReturn({ node, isVoidLike: true });
      proxy.setupCallDeclarationFile({
        callNode,
        declarationFile: FilePathStub({
          value: '/repo/packages/orchestrator/src/brokers/quest/x/quest-x-broker.ts',
        }),
      });
      proxy.setupCallReturnIsVoidLike({ callNode, isVoidLike: false });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: FolderTypeStub({ value: 'brokers' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'folderVoidReturn',
        data: { folderType: FolderTypeStub({ value: 'brokers' }) },
      });
    });

    it('VALID: void return, discarded broker call also returns void => does not report', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const callee = TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'doNothingBroker' });
      const callNode = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee,
        arguments: [],
      });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        returnType: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: TsestreeStub({ type: TsestreeNodeType.TSVoidKeyword }),
        }),
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            TsestreeStub({
              type: TsestreeNodeType.ExpressionStatement,
              expression: callNode,
            }),
          ],
        }),
      });

      proxy.setupDeclaredReturn({ node, isVoidLike: true });
      proxy.setupCallDeclarationFile({
        callNode,
        declarationFile: FilePathStub({
          value: '/repo/packages/orchestrator/src/brokers/quest/y/quest-y-broker.ts',
        }),
      });
      proxy.setupCallReturnIsVoidLike({ callNode, isVoidLike: true });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: FolderTypeStub({ value: 'brokers' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: void return with no discarded calls at all => does not report', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        returnType: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: TsestreeStub({ type: TsestreeNodeType.TSVoidKeyword }),
        }),
        body: TsestreeStub({ type: TsestreeNodeType.BlockStatement, body: [] }),
      });

      proxy.setupDeclaredReturn({ node, isVoidLike: true });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: FolderTypeStub({ value: 'brokers' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('INVALID: Promise<void> return discards a real value from a gateway call => reports folderPromiseVoidReturn', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const callee = TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'statIfExists' });
      const callNode = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee,
        arguments: [],
      });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        returnType: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: TsestreeStub({
            type: TsestreeNodeType.TSTypeReference,
            typeName: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'Promise' }),
            typeArguments: TsestreeStub({
              type: TsestreeNodeType.TSTypeParameterInstantiation,
              params: [TsestreeStub({ type: TsestreeNodeType.TSVoidKeyword })],
            }),
          }),
        }),
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            TsestreeStub({
              type: TsestreeNodeType.ExpressionStatement,
              expression: TsestreeStub({
                type: TsestreeNodeType.AwaitExpression,
                argument: callNode,
              }),
            }),
          ],
        }),
      });

      proxy.setupDeclaredReturn({ node, isVoidLike: true });
      proxy.setupCallDeclarationFile({
        callNode,
        declarationFile: FilePathStub({
          value: '/repo/packages/@gateway/node/src/fs__promises/stat-if-exists/stat-if-exists.ts',
        }),
      });
      proxy.setupCallReturnIsVoidLike({ callNode, isVoidLike: false });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: FolderTypeStub({ value: 'brokers' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'folderPromiseVoidReturn',
        data: { folderType: FolderTypeStub({ value: 'brokers' }) },
      });
    });

    it('VALID: Promise<void> return, discarded gateway call also returns void => does not report', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const callee = TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'unlinkIfExists' });
      const callNode = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee,
        arguments: [],
      });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        returnType: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: TsestreeStub({
            type: TsestreeNodeType.TSTypeReference,
            typeName: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'Promise' }),
            typeArguments: TsestreeStub({
              type: TsestreeNodeType.TSTypeParameterInstantiation,
              params: [TsestreeStub({ type: TsestreeNodeType.TSVoidKeyword })],
            }),
          }),
        }),
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            TsestreeStub({
              type: TsestreeNodeType.ExpressionStatement,
              expression: TsestreeStub({
                type: TsestreeNodeType.AwaitExpression,
                argument: callNode,
              }),
            }),
          ],
        }),
      });

      proxy.setupDeclaredReturn({ node, isVoidLike: true });
      proxy.setupCallDeclarationFile({
        callNode,
        declarationFile: FilePathStub({
          value:
            '/repo/packages/@gateway/node/src/fs__promises/unlink-if-exists/unlink-if-exists.ts',
        }),
      });
      proxy.setupCallReturnIsVoidLike({ callNode, isVoidLike: true });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: FolderTypeStub({ value: 'brokers' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('INVALID: single-value return type discards a real value => reports folderDisguisedVoidReturn', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const callee = TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'otherBroker' });
      const callNode = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee,
        arguments: [],
      });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        returnType: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: TsestreeStub({
            type: TsestreeNodeType.TSTypeReference,
            typeName: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'AdapterResult' }),
          }),
        }),
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            TsestreeStub({
              type: TsestreeNodeType.ExpressionStatement,
              expression: callNode,
            }),
          ],
        }),
      });

      proxy.setupDeclaredReturn({ node, isVoidLike: true });
      proxy.setupCallDeclarationFile({
        callNode,
        declarationFile: FilePathStub({
          value: '/repo/packages/orchestrator/src/brokers/quest/z/quest-z-broker.ts',
        }),
      });
      proxy.setupCallReturnIsVoidLike({ callNode, isVoidLike: false });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: FolderTypeStub({ value: 'brokers' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'folderDisguisedVoidReturn',
        data: { folderType: FolderTypeStub({ value: 'brokers' }) },
      });
    });

    it('VALID: single-value return type, discarded call also void-like => does not report', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const callee = TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'doNothingBroker' });
      const callNode = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee,
        arguments: [],
      });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        returnType: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: TsestreeStub({
            type: TsestreeNodeType.TSTypeReference,
            typeName: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'AdapterResult' }),
          }),
        }),
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            TsestreeStub({
              type: TsestreeNodeType.ExpressionStatement,
              expression: callNode,
            }),
          ],
        }),
      });

      proxy.setupDeclaredReturn({ node, isVoidLike: true });
      proxy.setupCallDeclarationFile({
        callNode,
        declarationFile: FilePathStub({
          value: '/repo/packages/orchestrator/src/brokers/quest/w/quest-w-broker.ts',
        }),
      });
      proxy.setupCallReturnIsVoidLike({ callNode, isVoidLike: true });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: FolderTypeStub({ value: 'brokers' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: void return, discarded call declared outside brokers/gateway => does not report', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const callee = TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'formatQuestId' });
      const callNode = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee,
        arguments: [],
      });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        returnType: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: TsestreeStub({ type: TsestreeNodeType.TSVoidKeyword }),
        }),
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            TsestreeStub({
              type: TsestreeNodeType.ExpressionStatement,
              expression: callNode,
            }),
          ],
        }),
      });

      proxy.setupDeclaredReturn({ node, isVoidLike: true });
      proxy.setupCallDeclarationFile({
        callNode,
        declarationFile: FilePathStub({
          value: '/repo/packages/orchestrator/src/transformers/quest-id/quest-id-transformer.ts',
        }),
      });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: FolderTypeStub({ value: 'brokers' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: void return, discarded call whose declaration file cannot be resolved => does not report', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const callee = TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'unresolvedCall' });
      const callNode = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee,
        arguments: [],
      });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        returnType: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: TsestreeStub({ type: TsestreeNodeType.TSVoidKeyword }),
        }),
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            TsestreeStub({
              type: TsestreeNodeType.ExpressionStatement,
              expression: callNode,
            }),
          ],
        }),
      });

      proxy.setupDeclaredReturn({ node, isVoidLike: true });
      proxy.setupCallDeclarationFile({ callNode, declarationFile: undefined });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: FolderTypeStub({ value: 'brokers' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: void return, discarded MemberExpression call (array.push) => does not report', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const callNode = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({
          type: TsestreeNodeType.MemberExpression,
          object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'items' }),
          property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'push' }),
        }),
        arguments: [],
      });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        returnType: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: TsestreeStub({ type: TsestreeNodeType.TSVoidKeyword }),
        }),
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            TsestreeStub({
              type: TsestreeNodeType.ExpressionStatement,
              expression: callNode,
            }),
          ],
        }),
      });

      proxy.setupDeclaredReturn({ node, isVoidLike: true });

      // No setupCallDeclarationFile staged for this call — if the broker asked the adapter to
      // resolve a MemberExpression callee, the unaddressed mock call would throw unconditionally.
      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: FolderTypeStub({ value: 'brokers' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: proxy file returning void => does not report (R1 skipped for proxy files)', () => {
      checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        returnType: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: TsestreeStub({ type: TsestreeNodeType.TSVoidKeyword }),
        }),
        body: TsestreeStub({ type: TsestreeNodeType.BlockStatement, body: [] }),
      });

      // No setupDeclaredReturn staged — if the broker called the adapter despite isProxyFile,
      // the unaddressed mock call would throw unconditionally.
      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: FolderTypeStub({ value: 'brokers' }),
        isProxyFile: true,
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });
  });

  describe('guard-specific check', () => {
    it('VALID: guard returning boolean => does not report', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        returnType: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: TsestreeStub({ type: TsestreeNodeType.TSBooleanKeyword }),
        }),
      });

      proxy.setupDeclaredReturn({ node, isVoidLike: false });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: FolderTypeStub({ value: 'guards' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: guard returning type predicate => does not report', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        returnType: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: TsestreeStub({ type: TsestreeNodeType.TSTypePredicate }),
        }),
      });

      proxy.setupDeclaredReturn({ node, isVoidLike: false });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: FolderTypeStub({ value: 'guards' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('INVALID: guard returning string => reports guardMustReturnBoolean', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        returnType: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: TsestreeStub({ type: TsestreeNodeType.TSStringKeyword }),
        }),
      });

      proxy.setupDeclaredReturn({ node, isVoidLike: false });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: FolderTypeStub({ value: 'guards' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'guardMustReturnBoolean',
      });
    });

    it('INVALID: guard returning void with no informative calls => reports guardMustReturnBoolean', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        returnType: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: TsestreeStub({ type: TsestreeNodeType.TSVoidKeyword }),
        }),
        body: TsestreeStub({ type: TsestreeNodeType.BlockStatement, body: [] }),
      });

      proxy.setupDeclaredReturn({ node, isVoidLike: true });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: FolderTypeStub({ value: 'guards' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'guardMustReturnBoolean',
      });
    });

    it('VALID: broker returning string (guard check does not apply) => does not report', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        returnType: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: TsestreeStub({ type: TsestreeNodeType.TSStringKeyword }),
        }),
      });

      proxy.setupDeclaredReturn({ node, isVoidLike: false });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: FolderTypeStub({ value: 'brokers' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });
  });

  describe('non-void return types (loose-return and passthrough)', () => {
    it('VALID: broker with non-void return type => does not report', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        returnType: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: TsestreeStub({ type: TsestreeNodeType.TSStringKeyword }),
        }),
      });

      proxy.setupDeclaredReturn({ node, isVoidLike: false });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: FolderTypeStub({ value: 'brokers' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: transformer returning branded type => does not report', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        returnType: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: TsestreeStub({
            type: TsestreeNodeType.TSTypeReference,
            typeName: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'ContentText' }),
          }),
        }),
      });

      proxy.setupDeclaredReturn({ node, isVoidLike: false });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: FolderTypeStub({ value: 'transformers' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });
  });

  describe('early returns', () => {
    it('VALID: no node => does not report', () => {
      checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });

      checkFolderReturnTypeLayerBroker({
        ctx,
        folderType: FolderTypeStub({ value: 'brokers' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: no folderType (file outside function-exporting folders) => does not report', () => {
      checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        returnType: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: TsestreeStub({ type: TsestreeNodeType.TSVoidKeyword }),
        }),
      });

      checkFolderReturnTypeLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: no return type annotation => does not report', () => {
      checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
      });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: FolderTypeStub({ value: 'brokers' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });
  });
});

import { checkFolderReturnTypeLayerBroker } from './check-folder-return-type-layer-broker';
import { checkFolderReturnTypeLayerBrokerProxy } from './check-folder-return-type-layer-broker.proxy';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';
import { FolderTypeStub } from '@dungeonmaster/shared/contracts';

describe('checkFolderReturnTypeLayerBroker', () => {
  describe('universal void rejection', () => {
    it('INVALID: broker returning void => reports folderVoidReturn with folderType data', () => {
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

    it('INVALID: adapter returning Promise<void> => reports folderPromiseVoidReturn', () => {
      checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
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
      });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: FolderTypeStub({ value: 'adapters' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'folderPromiseVoidReturn',
        data: { folderType: FolderTypeStub({ value: 'adapters' }) },
      });
    });

    it('VALID: adapter with non-void return type => does not report', () => {
      checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        returnType: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: TsestreeStub({ type: TsestreeNodeType.TSStringKeyword }),
        }),
      });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: FolderTypeStub({ value: 'adapters' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: transformer returning branded type => does not report', () => {
      checkFolderReturnTypeLayerBrokerProxy();
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

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: FolderTypeStub({ value: 'transformers' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });
  });

  describe('guard-specific check', () => {
    it('VALID: guard returning boolean => does not report', () => {
      checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        returnType: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: TsestreeStub({ type: TsestreeNodeType.TSBooleanKeyword }),
        }),
      });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: FolderTypeStub({ value: 'guards' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: guard returning type predicate => does not report', () => {
      checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        returnType: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: TsestreeStub({ type: TsestreeNodeType.TSTypePredicate }),
        }),
      });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: FolderTypeStub({ value: 'guards' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('INVALID: guard returning string => reports guardMustReturnBoolean', () => {
      checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        returnType: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: TsestreeStub({ type: TsestreeNodeType.TSStringKeyword }),
        }),
      });

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
      checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        returnType: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: TsestreeStub({ type: TsestreeNodeType.TSStringKeyword }),
        }),
      });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: FolderTypeStub({ value: 'brokers' }),
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
        folderType: FolderTypeStub({ value: 'adapters' }),
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
        folderType: FolderTypeStub({ value: 'adapters' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });
  });
});

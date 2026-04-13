import { checkFolderReturnTypeLayerBroker } from './check-folder-return-type-layer-broker';
import { checkFolderReturnTypeLayerBrokerProxy } from './check-folder-return-type-layer-broker.proxy';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';

describe('checkFolderReturnTypeLayerBroker', () => {
  describe('adapter checks', () => {
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

      checkFolderReturnTypeLayerBroker({ node, ctx, isAdapter: true, isGuard: false });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('INVALID: adapter returning void => reports adapterVoidReturn', () => {
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

      checkFolderReturnTypeLayerBroker({ node, ctx, isAdapter: true, isGuard: false });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'adapterVoidReturn',
      });
    });

    it('VALID: no node => does not report', () => {
      checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });

      checkFolderReturnTypeLayerBroker({ ctx, isAdapter: true, isGuard: false });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: no return type annotation => does not report', () => {
      checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
      });

      checkFolderReturnTypeLayerBroker({ node, ctx, isAdapter: true, isGuard: false });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });
  });

  describe('guard checks', () => {
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

      checkFolderReturnTypeLayerBroker({ node, ctx, isAdapter: false, isGuard: true });

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

      checkFolderReturnTypeLayerBroker({ node, ctx, isAdapter: false, isGuard: true });

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

      checkFolderReturnTypeLayerBroker({ node, ctx, isAdapter: false, isGuard: true });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'guardMustReturnBoolean',
      });
    });
  });
});

import { validateProxyFunctionReturnLayerBroker } from './validate-proxy-function-return-layer-broker';
import { validateProxyFunctionReturnLayerBrokerProxy } from './validate-proxy-function-return-layer-broker.proxy';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';

describe('validateProxyFunctionReturnLayerBroker', () => {
  describe('function with no body', () => {
    it('EMPTY: {body: undefined} => does not report', () => {
      validateProxyFunctionReturnLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: undefined,
      });

      validateProxyFunctionReturnLayerBroker(functionNode, mockContext);

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('function with return type annotation', () => {
    it('INVALID: {returnType.typeAnnotation.type: TSVoidKeyword} => reports proxyMustReturnObject', () => {
      validateProxyFunctionReturnLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        returnType: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: TsestreeStub({
            type: TsestreeNodeType.TSVoidKeyword,
          }),
        }),
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [],
        }),
      });

      validateProxyFunctionReturnLayerBroker(functionNode, mockContext);

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: functionNode,
        messageId: 'proxyMustReturnObject',
      });
    });

    it('INVALID: {returnType.typeAnnotation.type: TSStringKeyword} => reports proxyMustReturnObject', () => {
      validateProxyFunctionReturnLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        returnType: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: TsestreeStub({
            type: TsestreeNodeType.TSStringKeyword,
          }),
        }),
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [],
        }),
      });

      validateProxyFunctionReturnLayerBroker(functionNode, mockContext);

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: functionNode,
        messageId: 'proxyMustReturnObject',
      });
    });

    it('INVALID: {returnType.typeAnnotation.type: TSArrayType} => reports proxyMustReturnObject', () => {
      validateProxyFunctionReturnLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        returnType: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: TsestreeStub({
            type: TsestreeNodeType.TSArrayType,
          }),
        }),
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [],
        }),
      });

      validateProxyFunctionReturnLayerBroker(functionNode, mockContext);

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: functionNode,
        messageId: 'proxyMustReturnObject',
      });
    });

    it('VALID: {returnType.typeAnnotation.type: TSTypeLiteral} => does not report', () => {
      validateProxyFunctionReturnLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        returnType: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: TsestreeStub({
            type: TsestreeNodeType.TSTypeLiteral,
          }),
        }),
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({
                type: TsestreeNodeType.ObjectExpression,
                properties: [],
              }),
            }),
          ],
        }),
      });

      validateProxyFunctionReturnLayerBroker(functionNode, mockContext);

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('function with array body', () => {
    it('EDGE: {body: []} => does not report', () => {
      validateProxyFunctionReturnLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: [] as unknown as typeof functionNode.body,
      });

      validateProxyFunctionReturnLayerBroker(functionNode, mockContext);

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('function with block statement body', () => {
    it('VALID: {body.type: BlockStatement, return ObjectExpression} => does not report', () => {
      validateProxyFunctionReturnLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            TsestreeStub({
              type: TsestreeNodeType.ReturnStatement,
              argument: TsestreeStub({
                type: TsestreeNodeType.ObjectExpression,
                properties: [],
              }),
            }),
          ],
        }),
      });

      validateProxyFunctionReturnLayerBroker(functionNode, mockContext);

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('INVALID: {body.type: BlockStatement, body: [] (no return)} => reports proxyMustReturnObject', () => {
      validateProxyFunctionReturnLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: [
            TsestreeStub({
              type: TsestreeNodeType.ExpressionStatement,
              expression: TsestreeStub({
                type: TsestreeNodeType.Literal,
                value: 'hello',
              }),
            }),
          ],
        }),
      });

      validateProxyFunctionReturnLayerBroker(functionNode, mockContext);

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: functionNode,
        messageId: 'proxyMustReturnObject',
      });
    });

    it('EDGE: {body.type: BlockStatement, body.body: undefined} => does not report', () => {
      validateProxyFunctionReturnLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.BlockStatement,
          body: undefined,
        }),
      });

      validateProxyFunctionReturnLayerBroker(functionNode, mockContext);

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('arrow function with direct object return', () => {
    it('VALID: {body.type: ObjectExpression, properties: []} => does not report', () => {
      validateProxyFunctionReturnLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.ObjectExpression,
          properties: [],
        }),
      });

      validateProxyFunctionReturnLayerBroker(functionNode, mockContext);

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('arrow function with direct primitive return', () => {
    it('INVALID: {body.type: Literal, value: "hello"} => reports proxyMustReturnObject', () => {
      validateProxyFunctionReturnLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.Literal,
          value: 'hello',
        }),
      });

      validateProxyFunctionReturnLayerBroker(functionNode, mockContext);

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: functionNode,
        messageId: 'proxyMustReturnObject',
      });
    });

    it('INVALID: {body.type: TemplateLiteral} => reports proxyMustReturnObject', () => {
      validateProxyFunctionReturnLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.TemplateLiteral,
        }),
      });

      validateProxyFunctionReturnLayerBroker(functionNode, mockContext);

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: functionNode,
        messageId: 'proxyMustReturnObject',
      });
    });

    it('INVALID: {body.type: ArrayExpression} => reports proxyMustReturnObject', () => {
      validateProxyFunctionReturnLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.ArrayExpression,
        }),
      });

      validateProxyFunctionReturnLayerBroker(functionNode, mockContext);

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: functionNode,
        messageId: 'proxyMustReturnObject',
      });
    });

    it('INVALID: {body.type: Identifier, name: "someVar"} => reports proxyMustReturnObject', () => {
      validateProxyFunctionReturnLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: 'someVar',
        }),
      });

      validateProxyFunctionReturnLayerBroker(functionNode, mockContext);

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: functionNode,
        messageId: 'proxyMustReturnObject',
      });
    });
  });

  describe('arrow function with other expression types', () => {
    it('VALID: {body.type: CallExpression} => does not report', () => {
      validateProxyFunctionReturnLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.CallExpression,
        }),
      });

      validateProxyFunctionReturnLayerBroker(functionNode, mockContext);

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: {body.type: MemberExpression} => does not report', () => {
      validateProxyFunctionReturnLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const functionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
        body: TsestreeStub({
          type: TsestreeNodeType.MemberExpression,
        }),
      });

      validateProxyFunctionReturnLayerBroker(functionNode, mockContext);

      expect(mockReport).not.toHaveBeenCalled();
    });
  });
});

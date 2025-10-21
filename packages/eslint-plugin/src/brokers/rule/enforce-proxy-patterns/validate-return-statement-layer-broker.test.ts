import { validateReturnStatementLayerBroker } from './validate-return-statement-layer-broker';
import { validateReturnStatementLayerBrokerProxy } from './validate-return-statement-layer-broker.proxy';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';

describe('validateReturnStatementLayerBroker', () => {
  describe('non-return statement', () => {
    it('VALID: {type: ExpressionStatement} => does not report', () => {
      validateReturnStatementLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const mockFunctionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
      });
      const statement = TsestreeStub({
        type: TsestreeNodeType.ExpressionStatement,
      });

      validateReturnStatementLayerBroker(statement, mockContext, mockFunctionNode);

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('return with object-like argument', () => {
    it('VALID: {argument.type: ObjectExpression, properties: []} => does not report', () => {
      validateReturnStatementLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const mockFunctionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
      });
      const statement = TsestreeStub({
        type: TsestreeNodeType.ReturnStatement,
        argument: TsestreeStub({
          type: TsestreeNodeType.ObjectExpression,
          properties: [],
        }),
      });

      validateReturnStatementLayerBroker(statement, mockContext, mockFunctionNode);

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: {argument.type: CallExpression} => does not report', () => {
      validateReturnStatementLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const mockFunctionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
      });
      const statement = TsestreeStub({
        type: TsestreeNodeType.ReturnStatement,
        argument: TsestreeStub({
          type: TsestreeNodeType.CallExpression,
        }),
      });

      validateReturnStatementLayerBroker(statement, mockContext, mockFunctionNode);

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: {argument.type: MemberExpression} => does not report', () => {
      validateReturnStatementLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const mockFunctionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
      });
      const statement = TsestreeStub({
        type: TsestreeNodeType.ReturnStatement,
        argument: TsestreeStub({
          type: TsestreeNodeType.MemberExpression,
        }),
      });

      validateReturnStatementLayerBroker(statement, mockContext, mockFunctionNode);

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('return with no argument', () => {
    it('INVALID: {argument: undefined} => reports proxyMustReturnObject', () => {
      validateReturnStatementLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const mockFunctionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
      });
      const statement = TsestreeStub({
        type: TsestreeNodeType.ReturnStatement,
        argument: undefined,
      });

      validateReturnStatementLayerBroker(statement, mockContext, mockFunctionNode);

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: mockFunctionNode,
        messageId: 'proxyMustReturnObject',
      });
    });

    it('EMPTY: {argument: null} => reports proxyMustReturnObject', () => {
      validateReturnStatementLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const mockFunctionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
      });
      const statement = TsestreeStub({
        type: TsestreeNodeType.ReturnStatement,
        argument: null,
      });

      validateReturnStatementLayerBroker(statement, mockContext, mockFunctionNode);

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: mockFunctionNode,
        messageId: 'proxyMustReturnObject',
      });
    });
  });

  describe('return with primitive literal', () => {
    it('INVALID: {argument.type: Literal, value: "hello"} => reports proxyMustReturnObject', () => {
      validateReturnStatementLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const mockFunctionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
      });
      const statement = TsestreeStub({
        type: TsestreeNodeType.ReturnStatement,
        argument: TsestreeStub({
          type: TsestreeNodeType.Literal,
          value: 'hello',
        }),
      });

      validateReturnStatementLayerBroker(statement, mockContext, mockFunctionNode);

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: mockFunctionNode,
        messageId: 'proxyMustReturnObject',
      });
    });

    it('INVALID: {argument.type: Literal, value: 42} => reports proxyMustReturnObject', () => {
      validateReturnStatementLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const mockFunctionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
      });
      const statement = TsestreeStub({
        type: TsestreeNodeType.ReturnStatement,
        argument: TsestreeStub({
          type: TsestreeNodeType.Literal,
          value: 42,
        }),
      });

      validateReturnStatementLayerBroker(statement, mockContext, mockFunctionNode);

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: mockFunctionNode,
        messageId: 'proxyMustReturnObject',
      });
    });

    it('INVALID: {argument.type: Literal, value: true} => reports proxyMustReturnObject', () => {
      validateReturnStatementLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const mockFunctionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
      });
      const statement = TsestreeStub({
        type: TsestreeNodeType.ReturnStatement,
        argument: TsestreeStub({
          type: TsestreeNodeType.Literal,
          value: true,
        }),
      });

      validateReturnStatementLayerBroker(statement, mockContext, mockFunctionNode);

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: mockFunctionNode,
        messageId: 'proxyMustReturnObject',
      });
    });
  });

  describe('return with template literal', () => {
    it('INVALID: {argument.type: TemplateLiteral} => reports proxyMustReturnObject', () => {
      validateReturnStatementLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const mockFunctionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
      });
      const statement = TsestreeStub({
        type: TsestreeNodeType.ReturnStatement,
        argument: TsestreeStub({
          type: TsestreeNodeType.TemplateLiteral,
        }),
      });

      validateReturnStatementLayerBroker(statement, mockContext, mockFunctionNode);

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: mockFunctionNode,
        messageId: 'proxyMustReturnObject',
      });
    });
  });

  describe('return with array expression', () => {
    it('INVALID: {argument.type: ArrayExpression} => reports proxyMustReturnObject', () => {
      validateReturnStatementLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const mockFunctionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
      });
      const statement = TsestreeStub({
        type: TsestreeNodeType.ReturnStatement,
        argument: TsestreeStub({
          type: TsestreeNodeType.ArrayExpression,
        }),
      });

      validateReturnStatementLayerBroker(statement, mockContext, mockFunctionNode);

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: mockFunctionNode,
        messageId: 'proxyMustReturnObject',
      });
    });
  });

  describe('return with identifier', () => {
    it('INVALID: {argument.type: Identifier, name: "someVar"} => reports proxyMustReturnObject', () => {
      validateReturnStatementLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const mockFunctionNode = TsestreeStub({
        type: TsestreeNodeType.ArrowFunctionExpression,
      });
      const statement = TsestreeStub({
        type: TsestreeNodeType.ReturnStatement,
        argument: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: 'someVar',
        }),
      });

      validateReturnStatementLayerBroker(statement, mockContext, mockFunctionNode);

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: mockFunctionNode,
        messageId: 'proxyMustReturnObject',
      });
    });
  });
});

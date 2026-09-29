import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import { ArrowFunctionExpressionStub } from '#gateway/npm/typescript-eslint__utils/arrow-function-expression/arrow-function-expression.stub';
import { ExpressionStatementStub } from '#gateway/npm/typescript-eslint__utils/expression-statement/expression-statement.stub';
import { ReturnStatementStub } from '#gateway/npm/typescript-eslint__utils/return-statement/return-statement.stub';
import { validateReturnStatementLayerBroker } from './validate-return-statement-layer-broker';
import { validateReturnStatementLayerBrokerProxy } from './validate-return-statement-layer-broker.proxy';

describe('validateReturnStatementLayerBroker', () => {
  describe('non-return statement', () => {
    it('VALID: {type: ExpressionStatement} => does not report', () => {
      validateReturnStatementLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const mockFunctionNode = ArrowFunctionExpressionStub({ code: 'const f = () => {};' });
      const statement = ExpressionStatementStub({ code: 'x;' });

      validateReturnStatementLayerBroker({
        statement,
        context: mockContext,
        functionNode: mockFunctionNode,
      });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('return with object-like argument', () => {
    it('VALID: {argument.type: ObjectExpression, properties: []} => does not report', () => {
      validateReturnStatementLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const mockFunctionNode = ArrowFunctionExpressionStub({ code: 'const f = () => {};' });
      const statement = ReturnStatementStub({ code: 'return {  };' });

      validateReturnStatementLayerBroker({
        statement,
        context: mockContext,
        functionNode: mockFunctionNode,
      });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {argument.type: CallExpression} => does not report', () => {
      validateReturnStatementLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const mockFunctionNode = ArrowFunctionExpressionStub({ code: 'const f = () => {};' });
      const statement = ReturnStatementStub({ code: 'return f();' });

      validateReturnStatementLayerBroker({
        statement,
        context: mockContext,
        functionNode: mockFunctionNode,
      });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {argument.type: MemberExpression} => does not report', () => {
      validateReturnStatementLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const mockFunctionNode = ArrowFunctionExpressionStub({ code: 'const f = () => {};' });
      const statement = ReturnStatementStub({ code: 'return a.b;' });

      validateReturnStatementLayerBroker({
        statement,
        context: mockContext,
        functionNode: mockFunctionNode,
      });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('return with no argument', () => {
    it('INVALID: {argument: undefined} => reports proxyMustReturnObject', () => {
      validateReturnStatementLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const mockFunctionNode = ArrowFunctionExpressionStub({ code: 'const f = () => {};' });
      const statement = ReturnStatementStub({ code: 'return;' });

      validateReturnStatementLayerBroker({
        statement,
        context: mockContext,
        functionNode: mockFunctionNode,
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: mockFunctionNode,
        messageId: 'proxyMustReturnObject',
      });
    });

    it('EMPTY: {argument: null} => reports proxyMustReturnObject', () => {
      validateReturnStatementLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const mockFunctionNode = ArrowFunctionExpressionStub({ code: 'const f = () => {};' });
      const statement = ReturnStatementStub({ code: 'return;' });

      validateReturnStatementLayerBroker({
        statement,
        context: mockContext,
        functionNode: mockFunctionNode,
      });

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
      const mockContext = RuleContextStub({ report: mockReport });
      const mockFunctionNode = ArrowFunctionExpressionStub({ code: 'const f = () => {};' });
      const statement = ReturnStatementStub({ code: 'return "hello";' });

      validateReturnStatementLayerBroker({
        statement,
        context: mockContext,
        functionNode: mockFunctionNode,
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: mockFunctionNode,
        messageId: 'proxyMustReturnObject',
      });
    });

    it('INVALID: {argument.type: Literal, value: 42} => reports proxyMustReturnObject', () => {
      validateReturnStatementLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const mockFunctionNode = ArrowFunctionExpressionStub({ code: 'const f = () => {};' });
      const statement = ReturnStatementStub({ code: 'return 42;' });

      validateReturnStatementLayerBroker({
        statement,
        context: mockContext,
        functionNode: mockFunctionNode,
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: mockFunctionNode,
        messageId: 'proxyMustReturnObject',
      });
    });

    it('INVALID: {argument.type: Literal, value: true} => reports proxyMustReturnObject', () => {
      validateReturnStatementLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const mockFunctionNode = ArrowFunctionExpressionStub({ code: 'const f = () => {};' });
      const statement = ReturnStatementStub({ code: 'return true;' });

      validateReturnStatementLayerBroker({
        statement,
        context: mockContext,
        functionNode: mockFunctionNode,
      });

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
      const mockContext = RuleContextStub({ report: mockReport });
      const mockFunctionNode = ArrowFunctionExpressionStub({ code: 'const f = () => {};' });
      const statement = ReturnStatementStub({ code: `return \`\${x}\`;` });

      validateReturnStatementLayerBroker({
        statement,
        context: mockContext,
        functionNode: mockFunctionNode,
      });

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
      const mockContext = RuleContextStub({ report: mockReport });
      const mockFunctionNode = ArrowFunctionExpressionStub({ code: 'const f = () => {};' });
      const statement = ReturnStatementStub({ code: 'return [];' });

      validateReturnStatementLayerBroker({
        statement,
        context: mockContext,
        functionNode: mockFunctionNode,
      });

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
      const mockContext = RuleContextStub({ report: mockReport });
      const mockFunctionNode = ArrowFunctionExpressionStub({ code: 'const f = () => {};' });
      const statement = ReturnStatementStub({ code: 'return someVar;' });

      validateReturnStatementLayerBroker({
        statement,
        context: mockContext,
        functionNode: mockFunctionNode,
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: mockFunctionNode,
        messageId: 'proxyMustReturnObject',
      });
    });
  });
});

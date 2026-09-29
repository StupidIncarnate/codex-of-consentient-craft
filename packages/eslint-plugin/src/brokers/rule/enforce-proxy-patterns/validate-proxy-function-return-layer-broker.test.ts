import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import { ArrowFunctionExpressionStub } from '#gateway/npm/typescript-eslint__utils/arrow-function-expression/arrow-function-expression.stub';
import { validateProxyFunctionReturnLayerBroker } from './validate-proxy-function-return-layer-broker';
import { validateProxyFunctionReturnLayerBrokerProxy } from './validate-proxy-function-return-layer-broker.proxy';

describe('validateProxyFunctionReturnLayerBroker', () => {
  describe('function with return type annotation', () => {
    it('INVALID: {returnType.typeAnnotation.type: TSVoidKeyword} => reports proxyMustReturnObject', () => {
      validateProxyFunctionReturnLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({ code: 'const f = (): void => {  };' });

      validateProxyFunctionReturnLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: functionNode,
        messageId: 'proxyMustReturnObject',
      });
    });

    it('INVALID: {returnType.typeAnnotation.type: TSStringKeyword} => reports proxyMustReturnObject', () => {
      validateProxyFunctionReturnLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({ code: 'const f = (): string => {  };' });

      validateProxyFunctionReturnLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: functionNode,
        messageId: 'proxyMustReturnObject',
      });
    });

    it('INVALID: {returnType.typeAnnotation.type: TSArrayType} => reports proxyMustReturnObject', () => {
      validateProxyFunctionReturnLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({ code: 'const f = (): string[] => {  };' });

      validateProxyFunctionReturnLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: functionNode,
        messageId: 'proxyMustReturnObject',
      });
    });

    it('VALID: {returnType.typeAnnotation.type: TSTypeLiteral} => does not report', () => {
      validateProxyFunctionReturnLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = (): {  } => { return {  }; };',
      });

      validateProxyFunctionReturnLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('function with block statement body', () => {
    it('VALID: {body.type: BlockStatement, return ObjectExpression} => does not report', () => {
      validateProxyFunctionReturnLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { return {  }; };',
      });

      validateProxyFunctionReturnLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('INVALID: {body.type: BlockStatement, body: [] (no return)} => reports proxyMustReturnObject', () => {
      validateProxyFunctionReturnLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({ code: 'const f = () => { "hello"; };' });

      validateProxyFunctionReturnLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: functionNode,
        messageId: 'proxyMustReturnObject',
      });
    });
  });

  describe('arrow function with direct object return', () => {
    it('VALID: {body.type: ObjectExpression, properties: []} => does not report', () => {
      validateProxyFunctionReturnLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({ code: 'const f = () => ({  });' });

      validateProxyFunctionReturnLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('arrow function with direct primitive return', () => {
    it('INVALID: {body.type: Literal, value: "hello"} => reports proxyMustReturnObject', () => {
      validateProxyFunctionReturnLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({ code: 'const f = () => "hello";' });

      validateProxyFunctionReturnLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: functionNode,
        messageId: 'proxyMustReturnObject',
      });
    });

    it('INVALID: {body.type: TemplateLiteral} => reports proxyMustReturnObject', () => {
      validateProxyFunctionReturnLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({ code: `const f = () => \`\${x}\`;` });

      validateProxyFunctionReturnLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: functionNode,
        messageId: 'proxyMustReturnObject',
      });
    });

    it('INVALID: {body.type: ArrayExpression} => reports proxyMustReturnObject', () => {
      validateProxyFunctionReturnLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({ code: 'const f = () => [];' });

      validateProxyFunctionReturnLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: functionNode,
        messageId: 'proxyMustReturnObject',
      });
    });

    it('INVALID: {body.type: Identifier, name: "someVar"} => reports proxyMustReturnObject', () => {
      validateProxyFunctionReturnLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({ code: 'const f = () => someVar;' });

      validateProxyFunctionReturnLayerBroker({ functionNode, context: mockContext });

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
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({ code: 'const f = () => f();' });

      validateProxyFunctionReturnLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {body.type: MemberExpression} => does not report', () => {
      validateProxyFunctionReturnLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({ code: 'const f = () => a.b;' });

      validateProxyFunctionReturnLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });
});

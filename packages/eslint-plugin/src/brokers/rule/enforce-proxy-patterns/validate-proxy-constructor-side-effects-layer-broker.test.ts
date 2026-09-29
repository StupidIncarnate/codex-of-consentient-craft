import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import { ArrowFunctionExpressionStub } from '#gateway/npm/typescript-eslint__utils/arrow-function-expression/arrow-function-expression.stub';
import { ExpressionStatementStub } from '#gateway/npm/typescript-eslint__utils/expression-statement/expression-statement.stub';
import { validateProxyConstructorSideEffectsLayerBroker } from './validate-proxy-constructor-side-effects-layer-broker';
import { validateProxyConstructorSideEffectsLayerBrokerProxy } from './validate-proxy-constructor-side-effects-layer-broker.proxy';

describe('validateProxyConstructorSideEffectsLayerBroker', () => {
  describe('function with non-block statement body', () => {
    it('VALID: {body.type: ObjectExpression} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({ code: 'const f = () => ({  });' });

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('function with no return statement', () => {
    it('EDGE: {statements with no ReturnStatement} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({ code: 'const f = () => { "hello"; };' });

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('allowed operations before return', () => {
    it('VALID: {mock.mockImplementation()} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { mock.mockImplementation(); return {  }; };',
      });

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {jest.spyOn()} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { jest.spyOn(); return {  }; };',
      });

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {handle.calledWith([]).resolves()} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { handle.calledWith().resolves(); return {  }; };',
      });

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {handle.onceFor([]).rejects()} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { handle.onceFor().rejects(); return {  }; };',
      });

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {handle.calledWith([]).returns()} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { handle.calledWith().returns(); return {  }; };',
      });

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {bare handle.calledWith([])} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { handle.calledWith(); return {  }; };',
      });

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {bare handle.onceFor([])} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { handle.onceFor(); return {  }; };',
      });

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {bare handle.callsMatching([])} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { handle.callsMatching(); return {  }; };',
      });

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {childProxy.someMethod()} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { childProxy.someMethod(); return {  }; };',
      });

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('disallowed side effects before return', () => {
    it('INVALID: {database.connect()} => reports proxyConstructorNoSideEffects with type database.connect()', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const code = 'const f = () => { database.connect(); return {  }; };';
      const statement = ExpressionStatementStub({ code });
      const functionNode = ArrowFunctionExpressionStub({ code });

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: statement,
        messageId: 'proxyConstructorNoSideEffects',
        data: { type: 'database.connect()' },
      });
    });

    it('INVALID: {foo.query().returns()} => reports proxyConstructorNoSideEffects with type unknown.returns() since the chain does not bottom out in calledWith/onceFor', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const code = 'const f = () => { foo.query().returns(); return {  }; };';
      const statement = ExpressionStatementStub({ code });
      const functionNode = ArrowFunctionExpressionStub({ code });

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: statement,
        messageId: 'proxyConstructorNoSideEffects',
        data: { type: 'unknown.returns()' },
      });
    });

    it('INVALID: {logger.log()} => reports proxyConstructorNoSideEffects with type logger.log()', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const code = 'const f = () => { logger.log(); return {  }; };';
      const statement = ExpressionStatementStub({ code });
      const functionNode = ArrowFunctionExpressionStub({ code });

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: statement,
        messageId: 'proxyConstructorNoSideEffects',
        data: { type: 'logger.log()' },
      });
    });
  });

  describe('statements after return are ignored', () => {
    it('EDGE: {side effect after return} => does not report', () => {
      validateProxyConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { return {  }; database.connect(); };',
      });

      validateProxyConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });
});

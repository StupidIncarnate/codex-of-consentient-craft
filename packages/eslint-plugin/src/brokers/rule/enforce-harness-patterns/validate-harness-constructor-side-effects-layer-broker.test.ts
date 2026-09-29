import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import { ArrowFunctionExpressionStub } from '#gateway/npm/typescript-eslint__utils/arrow-function-expression/arrow-function-expression.stub';
import { ExpressionStatementStub } from '#gateway/npm/typescript-eslint__utils/expression-statement/expression-statement.stub';
import { VariableDeclarationStub } from '#gateway/npm/typescript-eslint__utils/variable-declaration/variable-declaration.stub';
import { validateHarnessConstructorSideEffectsLayerBroker } from './validate-harness-constructor-side-effects-layer-broker';
import { validateHarnessConstructorSideEffectsLayerBrokerProxy } from './validate-harness-constructor-side-effects-layer-broker.proxy';

describe('validateHarnessConstructorSideEffectsLayerBroker', () => {
  describe('function with non-block statement body', () => {
    it('VALID: {body.type: ObjectExpression} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({ code: 'const f = () => ({  });' });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('function with no return statement', () => {
    it('EDGE: {statements with no ReturnStatement} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({ code: 'const f = () => { "hello"; };' });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('allowed member expression operations', () => {
    it('VALID: {jest.spyOn()} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { jest.spyOn(); return {  }; };',
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {mock.mockImplementation()} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { mock.mockImplementation(); return {  }; };',
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {childHarness.someMethod()} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { childHarness.setup(); return {  }; };',
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {fs.mkdirSync()} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { fs.mkdirSync(); return {  }; };',
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {os.tmpdir()} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { os.tmpdir(); return {  }; };',
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {path.join()} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { path.join(); return {  }; };',
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('allowed bare identifier calls', () => {
    it('VALID: {beforeEach(...)} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { beforeEach(); return {  }; };',
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {afterEach(...)} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { afterEach(); return {  }; };',
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {beforeAll(...)} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { beforeAll(); return {  }; };',
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {afterAll(...)} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { afterAll(); return {  }; };',
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {childHarness()} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { childHarness(); return {  }; };',
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('disallowed side effects', () => {
    it('INVALID: {database.connect()} => reports harnessConstructorNoSideEffects', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const code = 'const f = () => { database.connect(); return {  }; };';
      const statement = ExpressionStatementStub({ code });
      const functionNode = ArrowFunctionExpressionStub({ code });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: statement,
        messageId: 'harnessConstructorNoSideEffects',
        data: { type: 'database.connect()' },
      });
    });

    it('INVALID: {someRandomFunction()} => reports harnessConstructorNoSideEffects', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const code = 'const f = () => { someRandomFunction(); return {  }; };';
      const statement = ExpressionStatementStub({ code });
      const functionNode = ArrowFunctionExpressionStub({ code });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: statement,
        messageId: 'harnessConstructorNoSideEffects',
        data: { type: 'someRandomFunction()' },
      });
    });
  });

  describe('computed member call', () => {
    it("EDGE: {database['run']()} => reports with the fallback method name", () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const code = "const f = () => { database['run'](); return {  }; };";
      const statement = ExpressionStatementStub({ code });
      const functionNode = ArrowFunctionExpressionStub({ code });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: statement,
        messageId: 'harnessConstructorNoSideEffects',
        data: { type: 'database.method()' },
      });
    });
  });

  describe('IIFE patterns', () => {
    it('INVALID: {(() => { doSomething() })()} => reports harnessConstructorNoSideEffects', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const code = 'const f = () => { (() => {  })(); return {  }; };';
      const statement = ExpressionStatementStub({ code });
      const functionNode = ArrowFunctionExpressionStub({ code });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: statement,
        messageId: 'harnessConstructorNoSideEffects',
        data: { type: 'IIFE' },
      });
    });

    it('INVALID: {(function() { doSomething() })()} => reports harnessConstructorNoSideEffects', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const code = 'const f = () => { (function () {  })(); return {  }; };';
      const statement = ExpressionStatementStub({ code });
      const functionNode = ArrowFunctionExpressionStub({ code });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: statement,
        messageId: 'harnessConstructorNoSideEffects',
        data: { type: 'IIFE' },
      });
    });
  });

  describe('assignment expression patterns', () => {
    it('INVALID: {process.env.FOO = bar} => reports harnessConstructorNoSideEffects', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const code = 'const f = () => { process.env = 0; return {  }; };';
      const statement = ExpressionStatementStub({ code });
      const functionNode = ArrowFunctionExpressionStub({ code });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: statement,
        messageId: 'harnessConstructorNoSideEffects',
        data: { type: 'assignment expression' },
      });
    });
  });

  describe('variable declaration patterns', () => {
    it('INVALID: {const x = database.connect()} => reports harnessConstructorNoSideEffects', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const code = '(() => { const x = database.connect(); return {  }; });';
      const statement = VariableDeclarationStub({ code });
      const functionNode = ArrowFunctionExpressionStub({ code });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: statement,
        messageId: 'harnessConstructorNoSideEffects',
        data: { type: 'database.connect()' },
      });
    });

    it('VALID: {const counters = new Map()} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { const counters = new Map(); return {  }; };',
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {const dir = path.join(...)} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { const dir = path.join(); return {  }; };',
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {let x = 0} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { let x = 0; return {  }; };',
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('statements after return are ignored', () => {
    it('EDGE: {side effect after return} => does not report', () => {
      validateHarnessConstructorSideEffectsLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { return {  }; database.connect(); };',
      });

      validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });
});

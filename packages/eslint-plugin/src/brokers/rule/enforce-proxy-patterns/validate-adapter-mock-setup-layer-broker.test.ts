import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import { ArrowFunctionExpressionStub } from '#gateway/npm/typescript-eslint__utils/arrow-function-expression/arrow-function-expression.stub';
import { validateAdapterMockSetupLayerBroker } from './validate-adapter-mock-setup-layer-broker';
import { validateAdapterMockSetupLayerBrokerProxy } from './validate-adapter-mock-setup-layer-broker.proxy';

describe('validateAdapterMockSetupLayerBroker', () => {
  describe('function with non-block statement body', () => {
    it('VALID: {body.type: ObjectExpression} => does not report', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({ code: 'const f = () => ({  });' });

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('function with no return statement', () => {
    it('EDGE: {statements with no ReturnStatement} => does not report', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({ code: 'const f = () => { "hello"; };' });

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('function with jest mocking and mock setup', () => {
    it('VALID: {jest.mocked() + mockImplementation()} => does not report', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { const x = jest.mocked(); mock.mockImplementation(); return {  }; };',
      });

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {jest.spyOn() + mockResolvedValue()} => does not report', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { const x = jest.spyOn(); mock.mockResolvedValue(); return {  }; };',
      });

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {jest.spyOn() in ExpressionStatement + mockRejectedValue()} => does not report', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { jest.spyOn(); mock.mockRejectedValue(); return {  }; };',
      });

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {jest.mocked() + mockReturnValue()} => does not report', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { const x = jest.mocked(); mock.mockReturnValue(); return {  }; };',
      });

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {jest.mocked() + mockReturnValueOnce()} => does not report', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { const x = jest.mocked(); mock.mockReturnValueOnce(); return {  }; };',
      });

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {jest.mocked() + mockResolvedValueOnce()} => does not report', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { const x = jest.mocked(); mock.mockResolvedValueOnce(); return {  }; };',
      });

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('function with jest mocking but no mock setup', () => {
    it('INVALID: {jest.mocked() without mock setup} => reports adapterProxyMustSetupMocks', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { const x = jest.mocked(); return {  }; };',
      });

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: functionNode,
        messageId: 'adapterProxyMustSetupMocks',
      });
    });

    it('INVALID: {jest.spyOn() without mock setup} => reports adapterProxyMustSetupMocks', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { const x = jest.spyOn(); return {  }; };',
      });

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: functionNode,
        messageId: 'adapterProxyMustSetupMocks',
      });
    });
  });

  describe('function with no jest mocking', () => {
    it('VALID: {no jest mocking} => does not report', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { const x = "test"; return {  }; };',
      });

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('statements after return are ignored', () => {
    it('EDGE: {jest.mocked() after return} => does not report', () => {
      validateAdapterMockSetupLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const functionNode = ArrowFunctionExpressionStub({
        code: 'const f = () => { return {  }; const x = jest.mocked(); };',
      });

      validateAdapterMockSetupLayerBroker({ functionNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });
});

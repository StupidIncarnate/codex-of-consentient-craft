import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import { ObjectExpressionStub } from '#gateway/npm/typescript-eslint__utils/object-expression/object-expression.stub';
import { validateObjectExpressionLayerBroker } from './validate-object-expression-layer-broker';
import { validateObjectExpressionLayerBrokerProxy } from './validate-object-expression-layer-broker.proxy';

describe('validateObjectExpressionLayerBroker', () => {
  describe('object with no properties', () => {
    it('VALID: {properties: []} => does not report', () => {
      validateObjectExpressionLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const objectNode = ObjectExpressionStub({ code: 'const o = {  };' });

      validateObjectExpressionLayerBroker({ objectNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('object with valid properties', () => {
    it('VALID: {property.type: Property, key.name: "returns"} => does not report', () => {
      validateObjectExpressionLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const objectNode = ObjectExpressionStub({ code: 'const o = { returns: v };' });

      validateObjectExpressionLayerBroker({ objectNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {property.type: Property, key.name: "throws"} => does not report', () => {
      validateObjectExpressionLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const objectNode = ObjectExpressionStub({ code: 'const o = { throws: v };' });

      validateObjectExpressionLayerBroker({ objectNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('object with bootstrap property', () => {
    it('INVALID: {property.type: Property, key.name: "bootstrap"} => reports proxyNoBootstrapMethod', () => {
      validateObjectExpressionLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const objectNode = ObjectExpressionStub({ code: 'const o = { bootstrap: v };' });
      const [property] = objectNode.properties;

      validateObjectExpressionLayerBroker({ objectNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: property,
        messageId: 'proxyNoBootstrapMethod',
      });
    });
  });

  describe('object with forbidden words in property names', () => {
    it('INVALID: {key.name: "mockUser"} => reports proxyHelperNoMockInName with forbiddenWord "mock"', () => {
      validateObjectExpressionLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const objectNode = ObjectExpressionStub({ code: 'const o = { mockUser: v };' });
      const [property] = objectNode.properties;

      validateObjectExpressionLayerBroker({ objectNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: property,
        messageId: 'proxyHelperNoMockInName',
        data: { name: 'mockUser', forbiddenWord: 'mock' },
      });
    });

    it('INVALID: {key.name: "stubUser"} => reports proxyHelperNoMockInName with forbiddenWord "stub"', () => {
      validateObjectExpressionLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const objectNode = ObjectExpressionStub({ code: 'const o = { stubUser: v };' });
      const [property] = objectNode.properties;

      validateObjectExpressionLayerBroker({ objectNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: property,
        messageId: 'proxyHelperNoMockInName',
        data: { name: 'stubUser', forbiddenWord: 'stub' },
      });
    });

    it('INVALID: {key.name: "fakeData"} => reports proxyHelperNoMockInName with forbiddenWord "fake"', () => {
      validateObjectExpressionLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const objectNode = ObjectExpressionStub({ code: 'const o = { fakeData: v };' });
      const [property] = objectNode.properties;

      validateObjectExpressionLayerBroker({ objectNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: property,
        messageId: 'proxyHelperNoMockInName',
        data: { name: 'fakeData', forbiddenWord: 'fake' },
      });
    });

    it('INVALID: {key.name: "spyOnUser"} => reports proxyHelperNoMockInName with forbiddenWord "spy"', () => {
      validateObjectExpressionLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const objectNode = ObjectExpressionStub({ code: 'const o = { spyOnUser: v };' });
      const [property] = objectNode.properties;

      validateObjectExpressionLayerBroker({ objectNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: property,
        messageId: 'proxyHelperNoMockInName',
        data: { name: 'spyOnUser', forbiddenWord: 'spy' },
      });
    });

    it('INVALID: {key.name: "jestMocked"} => reports proxyHelperNoMockInName with forbiddenWord "mock"', () => {
      validateObjectExpressionLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const objectNode = ObjectExpressionStub({ code: 'const o = { jestMocked: v };' });
      const [property] = objectNode.properties;

      validateObjectExpressionLayerBroker({ objectNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: property,
        messageId: 'proxyHelperNoMockInName',
        data: { name: 'jestMocked', forbiddenWord: 'mock' },
      });
    });

    it('INVALID: {key.name: "dummyData"} => reports proxyHelperNoMockInName with forbiddenWord "dummy"', () => {
      validateObjectExpressionLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const objectNode = ObjectExpressionStub({ code: 'const o = { dummyData: v };' });
      const [property] = objectNode.properties;

      validateObjectExpressionLayerBroker({ objectNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: property,
        messageId: 'proxyHelperNoMockInName',
        data: { name: 'dummyData', forbiddenWord: 'dummy' },
      });
    });

    it('INVALID: {key.name: "setupMOCKUser"} (case-insensitive) => reports proxyHelperNoMockInName with forbiddenWord "mock"', () => {
      validateObjectExpressionLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const objectNode = ObjectExpressionStub({ code: 'const o = { setupMOCKUser: v };' });
      const [property] = objectNode.properties;

      validateObjectExpressionLayerBroker({ objectNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: property,
        messageId: 'proxyHelperNoMockInName',
        data: { name: 'setupMOCKUser', forbiddenWord: 'mock' },
      });
    });
  });

  describe('object with non-Property or non-MethodDefinition property types', () => {
    it('VALID: {property.type: SpreadElement} => does not report', () => {
      validateObjectExpressionLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const objectNode = ObjectExpressionStub({ code: 'const o = { ...x };' });

      validateObjectExpressionLayerBroker({ objectNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('object with property without key name', () => {
    it("EDGE: {property keyed by the string 'mock-user'} => does not report", () => {
      validateObjectExpressionLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const objectNode = ObjectExpressionStub({ code: "const o = { 'mock-user': v };" });

      validateObjectExpressionLayerBroker({ objectNode, context: mockContext });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('object with multiple properties', () => {
    it('INVALID: {properties: [bootstrap, mockUser]} => reports both violations', () => {
      validateObjectExpressionLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const objectNode = ObjectExpressionStub({ code: 'const o = { bootstrap: v, mockUser: v };' });
      const [property1, property2] = objectNode.properties;

      validateObjectExpressionLayerBroker({ objectNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(2);
      expect(mockReport).toHaveBeenNthCalledWith(1, {
        node: property1,
        messageId: 'proxyNoBootstrapMethod',
      });
      expect(mockReport).toHaveBeenNthCalledWith(2, {
        node: property2,
        messageId: 'proxyHelperNoMockInName',
        data: { name: 'mockUser', forbiddenWord: 'mock' },
      });
    });
  });
});

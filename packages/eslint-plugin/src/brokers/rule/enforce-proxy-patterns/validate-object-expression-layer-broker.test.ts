import { validateObjectExpressionLayerBroker } from './validate-object-expression-layer-broker';
import { validateObjectExpressionLayerBrokerProxy } from './validate-object-expression-layer-broker.proxy';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';

describe('validateObjectExpressionLayerBroker', () => {
  describe('object with no properties', () => {
    it('EMPTY: {properties: undefined} => does not report', () => {
      validateObjectExpressionLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: undefined,
      });

      validateObjectExpressionLayerBroker({ objectNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: {properties: []} => does not report', () => {
      validateObjectExpressionLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [],
      });

      validateObjectExpressionLayerBroker({ objectNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('object with valid properties', () => {
    it('VALID: {property.type: Property, key.name: "returns"} => does not report', () => {
      validateObjectExpressionLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [
          TsestreeStub({
            type: TsestreeNodeType.Property,
            key: TsestreeStub({
              type: TsestreeNodeType.Identifier,
              name: 'returns',
            }),
          }),
        ],
      });

      validateObjectExpressionLayerBroker({ objectNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: {property.type: Property, key.name: "throws"} => does not report', () => {
      validateObjectExpressionLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [
          TsestreeStub({
            type: TsestreeNodeType.Property,
            key: TsestreeStub({
              type: TsestreeNodeType.Identifier,
              name: 'throws',
            }),
          }),
        ],
      });

      validateObjectExpressionLayerBroker({ objectNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: {property.type: MethodDefinition, key.name: "setupProxy"} => does not report', () => {
      validateObjectExpressionLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [
          TsestreeStub({
            type: TsestreeNodeType.MethodDefinition,
            key: TsestreeStub({
              type: TsestreeNodeType.Identifier,
              name: 'setupProxy',
            }),
          }),
        ],
      });

      validateObjectExpressionLayerBroker({ objectNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('object with bootstrap property', () => {
    it('INVALID: {property.type: Property, key.name: "bootstrap"} => reports proxyNoBootstrapMethod', () => {
      validateObjectExpressionLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const property = TsestreeStub({
        type: TsestreeNodeType.Property,
        key: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: 'bootstrap',
        }),
      });

      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [property],
      });

      validateObjectExpressionLayerBroker({ objectNode, context: mockContext });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: property,
        messageId: 'proxyNoBootstrapMethod',
      });
    });

    it('INVALID: {property.type: MethodDefinition, key.name: "bootstrap"} => reports proxyNoBootstrapMethod', () => {
      validateObjectExpressionLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const property = TsestreeStub({
        type: TsestreeNodeType.MethodDefinition,
        key: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: 'bootstrap',
        }),
      });

      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [property],
      });

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
      const mockContext = EslintContextStub({ report: mockReport });
      const property = TsestreeStub({
        type: TsestreeNodeType.Property,
        key: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: 'mockUser',
        }),
      });

      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [property],
      });

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
      const mockContext = EslintContextStub({ report: mockReport });
      const property = TsestreeStub({
        type: TsestreeNodeType.Property,
        key: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: 'stubUser',
        }),
      });

      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [property],
      });

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
      const mockContext = EslintContextStub({ report: mockReport });
      const property = TsestreeStub({
        type: TsestreeNodeType.Property,
        key: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: 'fakeData',
        }),
      });

      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [property],
      });

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
      const mockContext = EslintContextStub({ report: mockReport });
      const property = TsestreeStub({
        type: TsestreeNodeType.Property,
        key: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: 'spyOnUser',
        }),
      });

      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [property],
      });

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
      const mockContext = EslintContextStub({ report: mockReport });
      const property = TsestreeStub({
        type: TsestreeNodeType.Property,
        key: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: 'jestMocked',
        }),
      });

      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [property],
      });

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
      const mockContext = EslintContextStub({ report: mockReport });
      const property = TsestreeStub({
        type: TsestreeNodeType.Property,
        key: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: 'dummyData',
        }),
      });

      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [property],
      });

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
      const mockContext = EslintContextStub({ report: mockReport });
      const property = TsestreeStub({
        type: TsestreeNodeType.Property,
        key: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: 'setupMOCKUser',
        }),
      });

      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [property],
      });

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
      const mockContext = EslintContextStub({ report: mockReport });
      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [
          TsestreeStub({
            type: TsestreeNodeType.SpreadElement,
          }),
        ],
      });

      validateObjectExpressionLayerBroker({ objectNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('object with property without key name', () => {
    it('EDGE: {property.key: undefined} => does not report', () => {
      validateObjectExpressionLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [
          TsestreeStub({
            type: TsestreeNodeType.Property,
            key: undefined,
          }),
        ],
      });

      validateObjectExpressionLayerBroker({ objectNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('EDGE: {property.key.name: undefined} => does not report', () => {
      validateObjectExpressionLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [
          TsestreeStub({
            type: TsestreeNodeType.Property,
            key: TsestreeStub({
              type: TsestreeNodeType.Identifier,
              name: undefined,
            }),
          }),
        ],
      });

      validateObjectExpressionLayerBroker({ objectNode, context: mockContext });

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('object with multiple properties', () => {
    it('INVALID_MULTIPLE: {properties: [bootstrap, mockUser]} => reports both violations', () => {
      validateObjectExpressionLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const property1 = TsestreeStub({
        type: TsestreeNodeType.Property,
        key: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: 'bootstrap',
        }),
      });

      const property2 = TsestreeStub({
        type: TsestreeNodeType.Property,
        key: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: 'mockUser',
        }),
      });

      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [property1, property2],
      });

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

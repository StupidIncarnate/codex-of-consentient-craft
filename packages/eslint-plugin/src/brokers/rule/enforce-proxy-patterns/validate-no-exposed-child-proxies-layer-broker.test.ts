import { validateNoExposedChildProxiesLayerBroker } from './validate-no-exposed-child-proxies-layer-broker';
import { validateNoExposedChildProxiesLayerBrokerProxy } from './validate-no-exposed-child-proxies-layer-broker.proxy';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';
import { IdentifierStub } from '@dungeonmaster/shared/contracts';

type Identifier = ReturnType<typeof IdentifierStub>;

describe('validateNoExposedChildProxiesLayerBroker', () => {
  describe('object with no properties', () => {
    it('EMPTY: {properties: undefined} => does not report', () => {
      validateNoExposedChildProxiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: undefined,
      });
      const proxyVariables = new Map<Identifier, Identifier>();

      validateNoExposedChildProxiesLayerBroker({
        objectNode,
        proxyVariables,
        context: mockContext,
      });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: {properties: []} => does not report', () => {
      validateNoExposedChildProxiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [],
      });
      const proxyVariables = new Map<Identifier, Identifier>();

      validateNoExposedChildProxiesLayerBroker({
        objectNode,
        proxyVariables,
        context: mockContext,
      });

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('valid patterns - semantic methods that delegate', () => {
    it('VALID: {method: ArrowFunctionExpression} => does not report (function, not identifier)', () => {
      validateNoExposedChildProxiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [
          TsestreeStub({
            type: TsestreeNodeType.Property,
            shorthand: false,
            key: TsestreeStub({
              type: TsestreeNodeType.Identifier,
              name: IdentifierStub({ value: 'setupQuestFile' }),
            }),
            value: TsestreeStub({
              type: TsestreeNodeType.ArrowFunctionExpression,
            }),
          }),
        ],
      });
      const childProxyId = IdentifierStub({ value: 'childProxy' });
      const childBrokerProxyId = IdentifierStub({ value: 'childBrokerProxy' });
      const proxyVariables = new Map<Identifier, Identifier>([[childProxyId, childBrokerProxyId]]);

      validateNoExposedChildProxiesLayerBroker({
        objectNode,
        proxyVariables,
        context: mockContext,
      });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: {nonProxyIdentifier} => does not report (identifier not in proxyVariables)', () => {
      validateNoExposedChildProxiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [
          TsestreeStub({
            type: TsestreeNodeType.Property,
            shorthand: true,
            key: TsestreeStub({
              type: TsestreeNodeType.Identifier,
              name: IdentifierStub({ value: 'myConfig' }),
            }),
          }),
        ],
      });
      const childProxyId = IdentifierStub({ value: 'childProxy' });
      const childBrokerProxyId = IdentifierStub({ value: 'childBrokerProxy' });
      const proxyVariables = new Map<Identifier, Identifier>([[childProxyId, childBrokerProxyId]]);

      validateNoExposedChildProxiesLayerBroker({
        objectNode,
        proxyVariables,
        context: mockContext,
      });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: {child: nonProxyIdentifier} => does not report (explicit identifier not in proxyVariables)', () => {
      validateNoExposedChildProxiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [
          TsestreeStub({
            type: TsestreeNodeType.Property,
            shorthand: false,
            key: TsestreeStub({
              type: TsestreeNodeType.Identifier,
              name: IdentifierStub({ value: 'config' }),
            }),
            value: {
              type: 'Identifier',
              name: IdentifierStub({ value: 'myConfig' }),
            },
          }),
        ],
      });
      const childProxyId = IdentifierStub({ value: 'childProxy' });
      const childBrokerProxyId = IdentifierStub({ value: 'childBrokerProxy' });
      const proxyVariables = new Map<Identifier, Identifier>([[childProxyId, childBrokerProxyId]]);

      validateNoExposedChildProxiesLayerBroker({
        objectNode,
        proxyVariables,
        context: mockContext,
      });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('VALID: {count: Literal} => does not report (primitive value)', () => {
      validateNoExposedChildProxiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [
          TsestreeStub({
            type: TsestreeNodeType.Property,
            shorthand: false,
            key: TsestreeStub({
              type: TsestreeNodeType.Identifier,
              name: IdentifierStub({ value: 'count' }),
            }),
            value: {
              type: 'Literal',
              value: 42,
            },
          }),
        ],
      });
      const childProxyId = IdentifierStub({ value: 'childProxy' });
      const childBrokerProxyId = IdentifierStub({ value: 'childBrokerProxy' });
      const proxyVariables = new Map<Identifier, Identifier>([[childProxyId, childBrokerProxyId]]);

      validateNoExposedChildProxiesLayerBroker({
        objectNode,
        proxyVariables,
        context: mockContext,
      });

      expect(mockReport).not.toHaveBeenCalled();
    });
  });

  describe('invalid patterns - exposed child proxies via shorthand', () => {
    it('INVALID: {childProxy} (shorthand) => reports exposedChildProxy', () => {
      validateNoExposedChildProxiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const childProxyId = IdentifierStub({ value: 'childProxy' });
      const property = TsestreeStub({
        type: TsestreeNodeType.Property,
        shorthand: true,
        key: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: childProxyId,
        }),
      });
      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [property],
      });
      const childBrokerProxyId = IdentifierStub({ value: 'childBrokerProxy' });
      const proxyVariables = new Map<Identifier, Identifier>([[childProxyId, childBrokerProxyId]]);

      validateNoExposedChildProxiesLayerBroker({
        objectNode,
        proxyVariables,
        context: mockContext,
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: property,
        messageId: 'exposedChildProxy',
        data: { proxyName: childProxyId },
      });
    });

    it('INVALID: {slotManagerProxy} (shorthand) => reports exposedChildProxy', () => {
      validateNoExposedChildProxiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const slotManagerProxyId = IdentifierStub({ value: 'slotManagerProxy' });
      const property = TsestreeStub({
        type: TsestreeNodeType.Property,
        shorthand: true,
        key: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: slotManagerProxyId,
        }),
      });
      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [property],
      });
      const slotManagerOrchestrateBrokerProxyId = IdentifierStub({
        value: 'slotManagerOrchestrateBrokerProxy',
      });
      const proxyVariables = new Map<Identifier, Identifier>([
        [slotManagerProxyId, slotManagerOrchestrateBrokerProxyId],
      ]);

      validateNoExposedChildProxiesLayerBroker({
        objectNode,
        proxyVariables,
        context: mockContext,
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: property,
        messageId: 'exposedChildProxy',
        data: { proxyName: slotManagerProxyId },
      });
    });
  });

  describe('invalid patterns - exposed child proxies via explicit assignment', () => {
    it('INVALID: {child: childProxy} => reports exposedChildProxy', () => {
      validateNoExposedChildProxiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const childProxyId = IdentifierStub({ value: 'childProxy' });
      const property = TsestreeStub({
        type: TsestreeNodeType.Property,
        shorthand: false,
        key: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: IdentifierStub({ value: 'child' }),
        }),
        value: {
          type: 'Identifier',
          name: childProxyId,
        },
      });
      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [property],
      });
      const childBrokerProxyId = IdentifierStub({ value: 'childBrokerProxy' });
      const proxyVariables = new Map<Identifier, Identifier>([[childProxyId, childBrokerProxyId]]);

      validateNoExposedChildProxiesLayerBroker({
        objectNode,
        proxyVariables,
        context: mockContext,
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: property,
        messageId: 'exposedChildProxy',
        data: { proxyName: childProxyId },
      });
    });

    it('INVALID: {childProxy: childProxy} (same name) => reports exposedChildProxy', () => {
      validateNoExposedChildProxiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const childProxyId = IdentifierStub({ value: 'childProxy' });
      const property = TsestreeStub({
        type: TsestreeNodeType.Property,
        shorthand: false,
        key: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: childProxyId,
        }),
        value: {
          type: 'Identifier',
          name: childProxyId,
        },
      });
      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [property],
      });
      const childBrokerProxyId = IdentifierStub({ value: 'childBrokerProxy' });
      const proxyVariables = new Map<Identifier, Identifier>([[childProxyId, childBrokerProxyId]]);

      validateNoExposedChildProxiesLayerBroker({
        objectNode,
        proxyVariables,
        context: mockContext,
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: property,
        messageId: 'exposedChildProxy',
        data: { proxyName: childProxyId },
      });
    });
  });

  describe('multiple exposed child proxies', () => {
    it('INVALID: {childProxy, otherProxy} => reports both exposedChildProxy errors', () => {
      validateNoExposedChildProxiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const childProxyId = IdentifierStub({ value: 'childProxy' });
      const otherProxyId = IdentifierStub({ value: 'otherProxy' });
      const property1 = TsestreeStub({
        type: TsestreeNodeType.Property,
        shorthand: true,
        key: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: childProxyId,
        }),
      });
      const property2 = TsestreeStub({
        type: TsestreeNodeType.Property,
        shorthand: true,
        key: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: otherProxyId,
        }),
      });
      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [property1, property2],
      });
      const childBrokerProxyId = IdentifierStub({ value: 'childBrokerProxy' });
      const otherBrokerProxyId = IdentifierStub({ value: 'otherBrokerProxy' });
      const proxyVariables = new Map<Identifier, Identifier>([
        [childProxyId, childBrokerProxyId],
        [otherProxyId, otherBrokerProxyId],
      ]);

      validateNoExposedChildProxiesLayerBroker({
        objectNode,
        proxyVariables,
        context: mockContext,
      });

      expect(mockReport).toHaveBeenCalledTimes(2);
      expect(mockReport).toHaveBeenNthCalledWith(1, {
        node: property1,
        messageId: 'exposedChildProxy',
        data: { proxyName: childProxyId },
      });
      expect(mockReport).toHaveBeenNthCalledWith(2, {
        node: property2,
        messageId: 'exposedChildProxy',
        data: { proxyName: otherProxyId },
      });
    });

    it('INVALID: {childProxy, other: otherProxy} (mixed shorthand and explicit) => reports both', () => {
      validateNoExposedChildProxiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const childProxyId = IdentifierStub({ value: 'childProxy' });
      const otherProxyId = IdentifierStub({ value: 'otherProxy' });
      const property1 = TsestreeStub({
        type: TsestreeNodeType.Property,
        shorthand: true,
        key: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: childProxyId,
        }),
      });
      const property2 = TsestreeStub({
        type: TsestreeNodeType.Property,
        shorthand: false,
        key: TsestreeStub({
          type: TsestreeNodeType.Identifier,
          name: IdentifierStub({ value: 'other' }),
        }),
        value: {
          type: 'Identifier',
          name: otherProxyId,
        },
      });
      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [property1, property2],
      });
      const childBrokerProxyId = IdentifierStub({ value: 'childBrokerProxy' });
      const otherBrokerProxyId = IdentifierStub({ value: 'otherBrokerProxy' });
      const proxyVariables = new Map<Identifier, Identifier>([
        [childProxyId, childBrokerProxyId],
        [otherProxyId, otherBrokerProxyId],
      ]);

      validateNoExposedChildProxiesLayerBroker({
        objectNode,
        proxyVariables,
        context: mockContext,
      });

      expect(mockReport).toHaveBeenCalledTimes(2);
      expect(mockReport).toHaveBeenNthCalledWith(1, {
        node: property1,
        messageId: 'exposedChildProxy',
        data: { proxyName: childProxyId },
      });
      expect(mockReport).toHaveBeenNthCalledWith(2, {
        node: property2,
        messageId: 'exposedChildProxy',
        data: { proxyName: otherProxyId },
      });
    });
  });

  describe('edge cases', () => {
    it('EDGE: {SpreadElement} => does not report (not a Property)', () => {
      validateNoExposedChildProxiesLayerBrokerProxy();
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
      const childProxyId = IdentifierStub({ value: 'childProxy' });
      const childBrokerProxyId = IdentifierStub({ value: 'childBrokerProxy' });
      const proxyVariables = new Map<Identifier, Identifier>([[childProxyId, childBrokerProxyId]]);

      validateNoExposedChildProxiesLayerBroker({
        objectNode,
        proxyVariables,
        context: mockContext,
      });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('EDGE: {property.key: undefined} => does not report', () => {
      validateNoExposedChildProxiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [
          TsestreeStub({
            type: TsestreeNodeType.Property,
            shorthand: true,
            key: undefined,
          }),
        ],
      });
      const childProxyId = IdentifierStub({ value: 'childProxy' });
      const childBrokerProxyId = IdentifierStub({ value: 'childBrokerProxy' });
      const proxyVariables = new Map<Identifier, Identifier>([[childProxyId, childBrokerProxyId]]);

      validateNoExposedChildProxiesLayerBroker({
        objectNode,
        proxyVariables,
        context: mockContext,
      });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('EDGE: {property.key.name: undefined} => does not report', () => {
      validateNoExposedChildProxiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [
          TsestreeStub({
            type: TsestreeNodeType.Property,
            shorthand: true,
            key: TsestreeStub({
              type: TsestreeNodeType.Identifier,
              name: undefined,
            }),
          }),
        ],
      });
      const childProxyId = IdentifierStub({ value: 'childProxy' });
      const childBrokerProxyId = IdentifierStub({ value: 'childBrokerProxy' });
      const proxyVariables = new Map<Identifier, Identifier>([[childProxyId, childBrokerProxyId]]);

      validateNoExposedChildProxiesLayerBroker({
        objectNode,
        proxyVariables,
        context: mockContext,
      });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('EDGE: {empty proxyVariables map} => does not report', () => {
      validateNoExposedChildProxiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = EslintContextStub({ report: mockReport });
      const objectNode = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [
          TsestreeStub({
            type: TsestreeNodeType.Property,
            shorthand: true,
            key: TsestreeStub({
              type: TsestreeNodeType.Identifier,
              name: IdentifierStub({ value: 'childProxy' }),
            }),
          }),
        ],
      });
      const proxyVariables = new Map<Identifier, Identifier>();

      validateNoExposedChildProxiesLayerBroker({
        objectNode,
        proxyVariables,
        context: mockContext,
      });

      expect(mockReport).not.toHaveBeenCalled();
    });
  });
});

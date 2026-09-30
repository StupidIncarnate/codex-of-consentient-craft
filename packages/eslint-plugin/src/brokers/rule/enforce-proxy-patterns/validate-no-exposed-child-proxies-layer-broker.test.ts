import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import { ObjectExpressionStub } from '#gateway/npm/typescript-eslint__utils/object-expression/object-expression.stub';
import { validateNoExposedChildProxiesLayerBroker } from './validate-no-exposed-child-proxies-layer-broker';
import { validateNoExposedChildProxiesLayerBrokerProxy } from './validate-no-exposed-child-proxies-layer-broker.proxy';

type Identifier = string;

describe('validateNoExposedChildProxiesLayerBroker', () => {
  describe('object with no properties', () => {
    it('VALID: {properties: []} => does not report', () => {
      validateNoExposedChildProxiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const objectNode = ObjectExpressionStub({ code: 'const o = {  };' });
      const proxyVariables = new Map<Identifier, Identifier>();

      validateNoExposedChildProxiesLayerBroker({
        objectNode,
        proxyVariables,
        context: mockContext,
      });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('valid patterns - semantic methods that delegate', () => {
    it('VALID: {method: ArrowFunctionExpression} => does not report (function, not identifier)', () => {
      validateNoExposedChildProxiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const objectNode = ObjectExpressionStub({ code: 'const o = { setupQuestFile: () => {} };' });
      const childProxyId = 'childProxy';
      const childBrokerProxyId = 'childBrokerProxy';
      const proxyVariables = new Map<Identifier, Identifier>([[childProxyId, childBrokerProxyId]]);

      validateNoExposedChildProxiesLayerBroker({
        objectNode,
        proxyVariables,
        context: mockContext,
      });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {nonProxyIdentifier} => does not report (identifier not in proxyVariables)', () => {
      validateNoExposedChildProxiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const objectNode = ObjectExpressionStub({ code: 'const o = { myConfig };' });
      const childProxyId = 'childProxy';
      const childBrokerProxyId = 'childBrokerProxy';
      const proxyVariables = new Map<Identifier, Identifier>([[childProxyId, childBrokerProxyId]]);

      validateNoExposedChildProxiesLayerBroker({
        objectNode,
        proxyVariables,
        context: mockContext,
      });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {child: nonProxyIdentifier} => does not report (explicit identifier not in proxyVariables)', () => {
      validateNoExposedChildProxiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const objectNode = ObjectExpressionStub({ code: 'const o = { config: myConfig };' });
      const childProxyId = 'childProxy';
      const childBrokerProxyId = 'childBrokerProxy';
      const proxyVariables = new Map<Identifier, Identifier>([[childProxyId, childBrokerProxyId]]);

      validateNoExposedChildProxiesLayerBroker({
        objectNode,
        proxyVariables,
        context: mockContext,
      });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {count: Literal} => does not report (primitive value)', () => {
      validateNoExposedChildProxiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const objectNode = ObjectExpressionStub({ code: 'const o = { count: 42 };' });
      const childProxyId = 'childProxy';
      const childBrokerProxyId = 'childBrokerProxy';
      const proxyVariables = new Map<Identifier, Identifier>([[childProxyId, childBrokerProxyId]]);

      validateNoExposedChildProxiesLayerBroker({
        objectNode,
        proxyVariables,
        context: mockContext,
      });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });

  describe('invalid patterns - exposed child proxies via shorthand', () => {
    it('INVALID: {childProxy} (shorthand) => reports exposedChildProxy', () => {
      validateNoExposedChildProxiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const childProxyId = 'childProxy';
      const objectNode = ObjectExpressionStub({ code: 'const o = { childProxy };' });
      const [property] = objectNode.properties;
      const childBrokerProxyId = 'childBrokerProxy';
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
      const mockContext = RuleContextStub({ report: mockReport });
      const slotManagerProxyId = 'slotManagerProxy';
      const objectNode = ObjectExpressionStub({ code: 'const o = { slotManagerProxy };' });
      const [property] = objectNode.properties;
      const slotManagerOrchestrateBrokerProxyId = 'slotManagerOrchestrateBrokerProxy';
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
      const mockContext = RuleContextStub({ report: mockReport });
      const childProxyId = 'childProxy';
      const objectNode = ObjectExpressionStub({ code: 'const o = { child: childProxy };' });
      const [property] = objectNode.properties;
      const childBrokerProxyId = 'childBrokerProxy';
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
      const mockContext = RuleContextStub({ report: mockReport });
      const childProxyId = 'childProxy';
      const objectNode = ObjectExpressionStub({ code: 'const o = { childProxy: childProxy };' });
      const [property] = objectNode.properties;
      const childBrokerProxyId = 'childBrokerProxy';
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
      const mockContext = RuleContextStub({ report: mockReport });
      const childProxyId = 'childProxy';
      const otherProxyId = 'otherProxy';
      const objectNode = ObjectExpressionStub({ code: 'const o = { childProxy, otherProxy };' });
      const [property1, property2] = objectNode.properties;
      const childBrokerProxyId = 'childBrokerProxy';
      const otherBrokerProxyId = 'otherBrokerProxy';
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
      const mockContext = RuleContextStub({ report: mockReport });
      const childProxyId = 'childProxy';
      const otherProxyId = 'otherProxy';
      const objectNode = ObjectExpressionStub({
        code: 'const o = { childProxy, other: otherProxy };',
      });
      const [property1, property2] = objectNode.properties;
      const childBrokerProxyId = 'childBrokerProxy';
      const otherBrokerProxyId = 'otherBrokerProxy';
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
      const mockContext = RuleContextStub({ report: mockReport });
      const objectNode = ObjectExpressionStub({ code: 'const o = { ...x };' });
      const childProxyId = 'childProxy';
      const childBrokerProxyId = 'childBrokerProxy';
      const proxyVariables = new Map<Identifier, Identifier>([[childProxyId, childBrokerProxyId]]);

      validateNoExposedChildProxiesLayerBroker({
        objectNode,
        proxyVariables,
        context: mockContext,
      });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('EDGE: {empty proxyVariables map} => does not report', () => {
      validateNoExposedChildProxiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const mockContext = RuleContextStub({ report: mockReport });
      const objectNode = ObjectExpressionStub({ code: 'const o = { childProxy };' });
      const proxyVariables = new Map<Identifier, Identifier>();

      validateNoExposedChildProxiesLayerBroker({
        objectNode,
        proxyVariables,
        context: mockContext,
      });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });
});

import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import { ArrowFunctionExpressionStub } from '#gateway/npm/typescript-eslint__utils/arrow-function-expression/arrow-function-expression.stub';
import { TSTypeLiteralStub } from '#gateway/npm/typescript-eslint__utils/ts-type-literal/ts-type-literal.stub';
import { checkUnboundTypePropertiesLayerBroker } from './check-unbound-type-properties-layer-broker';
import { checkUnboundTypePropertiesLayerBrokerProxy } from './check-unbound-type-properties-layer-broker.proxy';

describe('checkUnboundTypePropertiesLayerBroker', () => {
  describe('non-firing inputs', () => {
    it('VALID: no node => does not report', () => {
      checkUnboundTypePropertiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });

      checkUnboundTypePropertiesLayerBroker({ ctx });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: no ctx => does not report', () => {
      checkUnboundTypePropertiesLayerBrokerProxy();
      const mockReport = jest.fn();
      RuleContextStub({ report: mockReport });
      const node = ArrowFunctionExpressionStub({
        code: 'const f = ({ contents }: { filepath: string; contents: string }) => {};',
      });

      checkUnboundTypePropertiesLayerBroker({ node });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: no params => does not report', () => {
      checkUnboundTypePropertiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const node = ArrowFunctionExpressionStub({ code: 'const f = () => {};' });

      checkUnboundTypePropertiesLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: non-object-pattern param => does not report', () => {
      checkUnboundTypePropertiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const node = ArrowFunctionExpressionStub({ code: 'const f = (filepath: string) => {};' });

      checkUnboundTypePropertiesLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: object pattern with no type annotation => does not report', () => {
      checkUnboundTypePropertiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const node = ArrowFunctionExpressionStub({ code: 'const f = ({ filepath }) => {};' });

      checkUnboundTypePropertiesLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: type annotation is not a type literal => does not report', () => {
      checkUnboundTypePropertiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const node = ArrowFunctionExpressionStub({
        code: 'const f = ({ filepath }: FilepathArgs) => {};',
      });

      checkUnboundTypePropertiesLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: rest element consumes the remainder => does not report', () => {
      checkUnboundTypePropertiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const node = ArrowFunctionExpressionStub({
        code: 'const f = ({ filepath, ...rest }: { filepath: string; contents: string }) => {};',
      });

      checkUnboundTypePropertiesLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: every declared property is bound => does not report', () => {
      checkUnboundTypePropertiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const node = ArrowFunctionExpressionStub({
        code: 'const f = ({ filepath, contents }: { filepath: string; contents: string }) => {};',
      });

      checkUnboundTypePropertiesLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: renamed binding matches by source key name => does not report', () => {
      checkUnboundTypePropertiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const node = ArrowFunctionExpressionStub({
        code: 'const f = ({ filepath: renamed }: { filepath: string }) => {};',
      });

      checkUnboundTypePropertiesLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: defaulted object-pattern param (AssignmentPattern) fully bound => does not report', () => {
      checkUnboundTypePropertiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const node = ArrowFunctionExpressionStub({
        code: 'const f = ({ filepath }: { filepath: string } = { filepath: "a" }) => {};',
      });

      checkUnboundTypePropertiesLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });
  });

  describe('reporting', () => {
    it('INVALID: declared property never destructured => reports unboundProxyParam', () => {
      checkUnboundTypePropertiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const code = 'const f = ({ contents }: { filepath: string; contents: string }) => {};';
      const typeLiteral = TSTypeLiteralStub({ code });
      const node = ArrowFunctionExpressionStub({ code });

      checkUnboundTypePropertiesLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: typeLiteral.members[0],
        messageId: 'unboundProxyParam',
        data: { propertyName: 'filepath' },
      });
    });

    it('INVALID: multiple declared properties never destructured => reports one per property', () => {
      checkUnboundTypePropertiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const code = 'const f = ({}: { filepath: string; contents: string }) => {};';
      const typeLiteral = TSTypeLiteralStub({ code });
      const node = ArrowFunctionExpressionStub({ code });

      checkUnboundTypePropertiesLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(2);
      expect(mockReport).toHaveBeenNthCalledWith(1, {
        node: typeLiteral.members[0],
        messageId: 'unboundProxyParam',
        data: { propertyName: 'filepath' },
      });
      expect(mockReport).toHaveBeenNthCalledWith(2, {
        node: typeLiteral.members[1],
        messageId: 'unboundProxyParam',
        data: { propertyName: 'contents' },
      });
    });

    it('INVALID: renaming a different property leaves the unbound one reported', () => {
      checkUnboundTypePropertiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const code =
        'const f = ({ contents: renamed }: { filepath: string; contents: string }) => {};';
      const typeLiteral = TSTypeLiteralStub({ code });
      const node = ArrowFunctionExpressionStub({ code });

      checkUnboundTypePropertiesLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: typeLiteral.members[0],
        messageId: 'unboundProxyParam',
        data: { propertyName: 'filepath' },
      });
    });

    it('INVALID: only the second of two params has an unbound property => reports once', () => {
      checkUnboundTypePropertiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const code = 'const f = ({ a }, { b }: { b: string; c: string }) => {};';
      const typeLiteral = TSTypeLiteralStub({ code });
      const node = ArrowFunctionExpressionStub({ code });

      checkUnboundTypePropertiesLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: typeLiteral.members[1],
        messageId: 'unboundProxyParam',
        data: { propertyName: 'c' },
      });
    });
  });
});

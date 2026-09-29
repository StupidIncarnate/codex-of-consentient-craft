import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { PropertyStub } from '#gateway/npm/typescript-eslint__utils/property/property.stub';
import { checkDiscriminatedUnionVariantsLayerBroker } from './check-discriminated-union-variants-layer-broker';
import { checkDiscriminatedUnionVariantsLayerBrokerProxy } from './check-discriminated-union-variants-layer-broker.proxy';

describe('checkDiscriminatedUnionVariantsLayerBroker', () => {
  describe('non-firing inputs', () => {
    it('VALID: no node => does not report', () => {
      checkDiscriminatedUnionVariantsLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });

      checkDiscriminatedUnionVariantsLayerBroker({ ctx });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: non-discriminatedUnion CallExpression => does not report', () => {
      checkDiscriminatedUnionVariantsLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const node = CallExpressionStub({ code: 'z.object({});' });

      checkDiscriminatedUnionVariantsLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: discriminatedUnion with non-array second-arg => does not report', () => {
      checkDiscriminatedUnionVariantsLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const node = CallExpressionStub({ code: 'z.discriminatedUnion("type", variants);' });

      checkDiscriminatedUnionVariantsLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: Raw-suffixed property with z.unknown() => does not report', () => {
      checkDiscriminatedUnionVariantsLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const node = CallExpressionStub({
        code: 'z.discriminatedUnion("type", [z.object({ payloadRaw: z.unknown() })]);',
      });

      checkDiscriminatedUnionVariantsLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });
  });

  describe('reporting', () => {
    it('INVALID: variant property z.unknown() => reports banUnknownPayload', () => {
      checkDiscriminatedUnionVariantsLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const code = 'z.discriminatedUnion("type", [z.object({ payload: z.unknown() })]);';
      const node = CallExpressionStub({ code });
      const offendingProp = PropertyStub({ code });

      checkDiscriminatedUnionVariantsLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: offendingProp,
        messageId: 'banUnknownPayload',
        data: { propertyName: 'payload' },
      });
    });

    it('INVALID: variant property z.record(*, z.unknown()) => reports banUnknownRecordPayload', () => {
      checkDiscriminatedUnionVariantsLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const code =
        'z.discriminatedUnion("type", [z.object({ payload: z.record(z.string(), z.unknown()) })]);';
      const node = CallExpressionStub({ code });
      const offendingProp = PropertyStub({ code });

      checkDiscriminatedUnionVariantsLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: offendingProp,
        messageId: 'banUnknownRecordPayload',
        data: { propertyName: 'payload' },
      });
    });
  });
});

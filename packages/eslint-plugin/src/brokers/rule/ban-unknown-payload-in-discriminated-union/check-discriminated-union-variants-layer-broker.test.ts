import { checkDiscriminatedUnionVariantsLayerBroker } from './check-discriminated-union-variants-layer-broker';
import { checkDiscriminatedUnionVariantsLayerBrokerProxy } from './check-discriminated-union-variants-layer-broker.proxy';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';
import { IdentifierStub } from '@dungeonmaster/shared/contracts';

// Build z.<method>(...args) CallExpression node
const buildZCall = ({
  method,
  args,
}: {
  method: 'discriminatedUnion' | 'object' | 'unknown' | 'record' | 'literal' | 'string';
  args: ReturnType<typeof TsestreeStub>[];
}): ReturnType<typeof TsestreeStub> =>
  TsestreeStub({
    type: TsestreeNodeType.CallExpression,
    callee: TsestreeStub({
      type: TsestreeNodeType.MemberExpression,
      object: TsestreeStub({
        type: TsestreeNodeType.Identifier,
        name: IdentifierStub({ value: 'z' }),
      }),
      property: TsestreeStub({
        type: TsestreeNodeType.Identifier,
        name: IdentifierStub({ value: method }),
      }),
    }),
    arguments: args,
  });

const buildProperty = ({
  keyName,
  value,
}: {
  keyName: string;
  value: ReturnType<typeof TsestreeStub>;
}): ReturnType<typeof TsestreeStub> =>
  TsestreeStub({
    type: TsestreeNodeType.Property,
    key: TsestreeStub({
      type: TsestreeNodeType.Identifier,
      name: IdentifierStub({ value: keyName }),
    }),
    value,
  });

describe('checkDiscriminatedUnionVariantsLayerBroker', () => {
  describe('non-firing inputs', () => {
    it('VALID: no node => does not report', () => {
      checkDiscriminatedUnionVariantsLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });

      const result = checkDiscriminatedUnionVariantsLayerBroker({ ctx });

      expect(mockReport).toHaveBeenCalledTimes(0);
      expect(result.success).toBe(true);
    });

    it('VALID: non-discriminatedUnion CallExpression => does not report', () => {
      checkDiscriminatedUnionVariantsLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const node = buildZCall({ method: 'object', args: [] });

      checkDiscriminatedUnionVariantsLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: discriminatedUnion with non-array second-arg => does not report', () => {
      checkDiscriminatedUnionVariantsLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const node = buildZCall({
        method: 'discriminatedUnion',
        args: [
          TsestreeStub({ type: TsestreeNodeType.Literal, value: 'type' }),
          // 2nd arg is an Identifier reference, not an ArrayExpression
          TsestreeStub({
            type: TsestreeNodeType.Identifier,
            name: IdentifierStub({ value: 'variants' }),
          }),
        ],
      });

      checkDiscriminatedUnionVariantsLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });
  });

  describe('reporting', () => {
    it('INVALID: variant property z.unknown() => reports banUnknownPayload', () => {
      checkDiscriminatedUnionVariantsLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });

      const offendingProp = buildProperty({
        keyName: 'payload',
        value: buildZCall({ method: 'unknown', args: [] }),
      });

      const variant = buildZCall({
        method: 'object',
        args: [
          TsestreeStub({
            type: TsestreeNodeType.ObjectExpression,
            properties: [offendingProp],
          }),
        ],
      });

      const node = buildZCall({
        method: 'discriminatedUnion',
        args: [
          TsestreeStub({ type: TsestreeNodeType.Literal, value: 'type' }),
          TsestreeStub({
            type: TsestreeNodeType.ArrayExpression,
            elements: [variant],
          }),
        ],
      });

      checkDiscriminatedUnionVariantsLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: offendingProp,
        messageId: 'banUnknownPayload',
        data: { propertyName: 'payload' },
      });
    });

    it('VALID: Raw-suffixed property with z.unknown() => does not report', () => {
      checkDiscriminatedUnionVariantsLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });

      const exemptProp = buildProperty({
        keyName: 'payloadRaw',
        value: buildZCall({ method: 'unknown', args: [] }),
      });

      const variant = buildZCall({
        method: 'object',
        args: [
          TsestreeStub({
            type: TsestreeNodeType.ObjectExpression,
            properties: [exemptProp],
          }),
        ],
      });

      const node = buildZCall({
        method: 'discriminatedUnion',
        args: [
          TsestreeStub({ type: TsestreeNodeType.Literal, value: 'type' }),
          TsestreeStub({
            type: TsestreeNodeType.ArrayExpression,
            elements: [variant],
          }),
        ],
      });

      checkDiscriminatedUnionVariantsLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('INVALID: variant property z.record(*, z.unknown()) => reports banUnknownRecordPayload', () => {
      checkDiscriminatedUnionVariantsLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });

      const offendingProp = buildProperty({
        keyName: 'payload',
        value: buildZCall({
          method: 'record',
          args: [
            buildZCall({ method: 'string', args: [] }),
            buildZCall({ method: 'unknown', args: [] }),
          ],
        }),
      });

      const variant = buildZCall({
        method: 'object',
        args: [
          TsestreeStub({
            type: TsestreeNodeType.ObjectExpression,
            properties: [offendingProp],
          }),
        ],
      });

      const node = buildZCall({
        method: 'discriminatedUnion',
        args: [
          TsestreeStub({ type: TsestreeNodeType.Literal, value: 'type' }),
          TsestreeStub({
            type: TsestreeNodeType.ArrayExpression,
            elements: [variant],
          }),
        ],
      });

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

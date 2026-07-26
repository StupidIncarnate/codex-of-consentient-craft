import { checkUnboundTypePropertiesLayerBroker } from './check-unbound-type-properties-layer-broker';
import { checkUnboundTypePropertiesLayerBrokerProxy } from './check-unbound-type-properties-layer-broker.proxy';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';
import { IdentifierStub } from '@dungeonmaster/shared/contracts';

const buildIdentifier = ({ name }: { name: string }): ReturnType<typeof TsestreeStub> =>
  TsestreeStub({
    type: TsestreeNodeType.Identifier,
    name: IdentifierStub({ value: name }),
  });

const buildPropertySignature = ({
  keyName,
}: {
  keyName: string;
}): ReturnType<typeof TsestreeStub> =>
  TsestreeStub({
    type: TsestreeNodeType.TSPropertySignature,
    key: buildIdentifier({ name: keyName }),
  });

const buildTypeLiteral = ({
  memberNames,
}: {
  memberNames: string[];
}): ReturnType<typeof TsestreeStub> =>
  TsestreeStub({
    type: TsestreeNodeType.TSTypeLiteral,
    members: memberNames.map((keyName) => buildPropertySignature({ keyName })),
  });

const buildBoundProperty = ({ keyName }: { keyName: string }): ReturnType<typeof TsestreeStub> =>
  TsestreeStub({
    type: TsestreeNodeType.Property,
    key: buildIdentifier({ name: keyName }),
  });

const buildObjectPatternParam = ({
  boundNames,
  typeMemberNames,
  withRest = false,
}: {
  boundNames: string[];
  typeMemberNames?: string[];
  withRest?: boolean;
}): ReturnType<typeof TsestreeStub> =>
  TsestreeStub({
    type: TsestreeNodeType.ObjectPattern,
    properties: [
      ...boundNames.map((keyName) => buildBoundProperty({ keyName })),
      ...(withRest ? [TsestreeStub({ type: TsestreeNodeType.RestElement })] : []),
    ],
    ...(typeMemberNames
      ? {
          typeAnnotation: TsestreeStub({
            type: TsestreeNodeType.TSTypeAnnotation,
            typeAnnotation: buildTypeLiteral({ memberNames: typeMemberNames }),
          }),
        }
      : {}),
  });

const buildFunctionNode = ({
  params,
}: {
  params: ReturnType<typeof TsestreeStub>[];
}): ReturnType<typeof TsestreeStub> =>
  TsestreeStub({
    type: TsestreeNodeType.ArrowFunctionExpression,
    params,
  });

describe('checkUnboundTypePropertiesLayerBroker', () => {
  describe('non-firing inputs', () => {
    it('VALID: no node => does not report', () => {
      checkUnboundTypePropertiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });

      const result = checkUnboundTypePropertiesLayerBroker({ ctx });

      expect(mockReport).toHaveBeenCalledTimes(0);
      expect(result.success).toBe(true);
    });

    it('VALID: no ctx => does not report', () => {
      checkUnboundTypePropertiesLayerBrokerProxy();
      const node = buildFunctionNode({ params: [] });

      const result = checkUnboundTypePropertiesLayerBroker({ node });

      expect(result.success).toBe(true);
    });

    it('VALID: no params => does not report', () => {
      checkUnboundTypePropertiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const node = buildFunctionNode({ params: [] });

      checkUnboundTypePropertiesLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: non-object-pattern param => does not report', () => {
      checkUnboundTypePropertiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const param = buildIdentifier({ name: 'filepath' });
      const node = buildFunctionNode({ params: [param] });

      checkUnboundTypePropertiesLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: object pattern with no type annotation => does not report', () => {
      checkUnboundTypePropertiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const param = buildObjectPatternParam({ boundNames: ['filepath'] });
      const node = buildFunctionNode({ params: [param] });

      checkUnboundTypePropertiesLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: type annotation is not a type literal => does not report', () => {
      checkUnboundTypePropertiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const param = TsestreeStub({
        type: TsestreeNodeType.ObjectPattern,
        properties: [buildBoundProperty({ keyName: 'filepath' })],
        typeAnnotation: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: TsestreeStub({
            type: TsestreeNodeType.TSTypeReference,
            typeName: buildIdentifier({ name: 'FilepathArgs' }),
          }),
        }),
      });
      const node = buildFunctionNode({ params: [param] });

      checkUnboundTypePropertiesLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: rest element consumes the remainder => does not report', () => {
      checkUnboundTypePropertiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const param = buildObjectPatternParam({
        boundNames: ['filepath'],
        typeMemberNames: ['filepath', 'contents'],
        withRest: true,
      });
      const node = buildFunctionNode({ params: [param] });

      checkUnboundTypePropertiesLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: every declared property is bound => does not report', () => {
      checkUnboundTypePropertiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const param = buildObjectPatternParam({
        boundNames: ['filepath', 'contents'],
        typeMemberNames: ['filepath', 'contents'],
      });
      const node = buildFunctionNode({ params: [param] });

      checkUnboundTypePropertiesLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: renamed binding matches by source key name => does not report', () => {
      checkUnboundTypePropertiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const param = TsestreeStub({
        type: TsestreeNodeType.ObjectPattern,
        properties: [
          TsestreeStub({
            type: TsestreeNodeType.Property,
            key: buildIdentifier({ name: 'filepath' }),
            value: buildIdentifier({ name: 'renamed' }),
          }),
        ],
        typeAnnotation: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: buildTypeLiteral({ memberNames: ['filepath'] }),
        }),
      });
      const node = buildFunctionNode({ params: [param] });

      checkUnboundTypePropertiesLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: defaulted object-pattern param (AssignmentPattern) fully bound => does not report', () => {
      checkUnboundTypePropertiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const objectPattern = buildObjectPatternParam({
        boundNames: ['filepath'],
        typeMemberNames: ['filepath'],
      });
      const param = TsestreeStub({
        type: TsestreeNodeType.AssignmentPattern,
        left: objectPattern,
      });
      const node = buildFunctionNode({ params: [param] });

      checkUnboundTypePropertiesLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });
  });

  describe('reporting', () => {
    it('INVALID: declared property never destructured => reports unboundProxyParam', () => {
      checkUnboundTypePropertiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const typeLiteral = buildTypeLiteral({ memberNames: ['filepath', 'contents'] });
      const param = TsestreeStub({
        type: TsestreeNodeType.ObjectPattern,
        properties: [buildBoundProperty({ keyName: 'contents' })],
        typeAnnotation: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: typeLiteral,
        }),
      });
      const node = buildFunctionNode({ params: [param] });

      checkUnboundTypePropertiesLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: typeLiteral.members?.[0],
        messageId: 'unboundProxyParam',
        data: { propertyName: 'filepath' },
      });
    });

    it('INVALID: multiple declared properties never destructured => reports one per property', () => {
      checkUnboundTypePropertiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const typeLiteral = buildTypeLiteral({ memberNames: ['filepath', 'contents'] });
      const param = TsestreeStub({
        type: TsestreeNodeType.ObjectPattern,
        properties: [],
        typeAnnotation: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: typeLiteral,
        }),
      });
      const node = buildFunctionNode({ params: [param] });

      checkUnboundTypePropertiesLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(2);
      expect(mockReport).toHaveBeenNthCalledWith(1, {
        node: typeLiteral.members?.[0],
        messageId: 'unboundProxyParam',
        data: { propertyName: 'filepath' },
      });
      expect(mockReport).toHaveBeenNthCalledWith(2, {
        node: typeLiteral.members?.[1],
        messageId: 'unboundProxyParam',
        data: { propertyName: 'contents' },
      });
    });

    it('INVALID: renaming a different property leaves the unbound one reported', () => {
      checkUnboundTypePropertiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const typeLiteral = buildTypeLiteral({ memberNames: ['filepath', 'contents'] });
      const param = TsestreeStub({
        type: TsestreeNodeType.ObjectPattern,
        properties: [
          TsestreeStub({
            type: TsestreeNodeType.Property,
            key: buildIdentifier({ name: 'contents' }),
            value: buildIdentifier({ name: 'renamed' }),
          }),
        ],
        typeAnnotation: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: typeLiteral,
        }),
      });
      const node = buildFunctionNode({ params: [param] });

      checkUnboundTypePropertiesLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: typeLiteral.members?.[0],
        messageId: 'unboundProxyParam',
        data: { propertyName: 'filepath' },
      });
    });

    it('INVALID: only the second of two params has an unbound property => reports once', () => {
      checkUnboundTypePropertiesLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const firstParam = buildObjectPatternParam({
        boundNames: ['a'],
        typeMemberNames: ['a'],
      });
      const secondTypeLiteral = buildTypeLiteral({ memberNames: ['b', 'c'] });
      const secondParam = TsestreeStub({
        type: TsestreeNodeType.ObjectPattern,
        properties: [buildBoundProperty({ keyName: 'b' })],
        typeAnnotation: TsestreeStub({
          type: TsestreeNodeType.TSTypeAnnotation,
          typeAnnotation: secondTypeLiteral,
        }),
      });
      const node = buildFunctionNode({ params: [firstParam, secondParam] });

      checkUnboundTypePropertiesLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node: secondTypeLiteral.members?.[1],
        messageId: 'unboundProxyParam',
        data: { propertyName: 'c' },
      });
    });
  });
});

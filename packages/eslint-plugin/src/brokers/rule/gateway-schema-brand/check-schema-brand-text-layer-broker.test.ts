import { checkSchemaBrandTextLayerBroker } from './check-schema-brand-text-layer-broker';
import { checkSchemaBrandTextLayerBrokerProxy } from './check-schema-brand-text-layer-broker.proxy';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';

const instanceofBrandNode = ({ brandText }: { brandText: string }) =>
  TsestreeStub({
    type: TsestreeNodeType.CallExpression,
    callee: {
      type: TsestreeNodeType.MemberExpression,
      object: {
        type: TsestreeNodeType.CallExpression,
        callee: {
          type: TsestreeNodeType.MemberExpression,
          object: { type: TsestreeNodeType.Identifier, name: 'z' },
          property: { type: TsestreeNodeType.Identifier, name: 'instanceof' },
        },
        arguments: [{ type: TsestreeNodeType.Identifier, name: 'ChildProcess' }],
      },
      property: { type: TsestreeNodeType.Identifier, name: 'brand' },
    },
    typeArguments: {
      type: TsestreeNodeType.TSTypeParameterInstantiation,
      params: [
        {
          type: TsestreeNodeType.TSLiteralType,
          literal: { type: TsestreeNodeType.Literal, value: brandText },
        },
      ],
    },
  });

const customBrandNode = ({ brandText }: { brandText: string }) =>
  TsestreeStub({
    type: TsestreeNodeType.CallExpression,
    callee: {
      type: TsestreeNodeType.MemberExpression,
      object: {
        type: TsestreeNodeType.CallExpression,
        callee: {
          type: TsestreeNodeType.MemberExpression,
          object: { type: TsestreeNodeType.Identifier, name: 'z' },
          property: { type: TsestreeNodeType.Identifier, name: 'custom' },
        },
        typeArguments: {
          type: TsestreeNodeType.TSTypeParameterInstantiation,
          params: [
            {
              type: TsestreeNodeType.TSTypeReference,
              typeName: { type: TsestreeNodeType.Identifier, name: 'WalkedFile' },
            },
          ],
        },
        arguments: [{ type: TsestreeNodeType.ArrowFunctionExpression }],
      },
      property: { type: TsestreeNodeType.Identifier, name: 'brand' },
    },
    typeArguments: {
      type: TsestreeNodeType.TSTypeParameterInstantiation,
      params: [
        {
          type: TsestreeNodeType.TSLiteralType,
          literal: { type: TsestreeNodeType.Literal, value: brandText },
        },
      ],
    },
  });

describe('checkSchemaBrandTextLayerBroker', () => {
  describe('z.instanceof receiver', () => {
    it('VALID: {brand: #GatewayChildProcess for z.instanceof(ChildProcess)} => reports nothing', () => {
      checkSchemaBrandTextLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = instanceofBrandNode({ brandText: '#GatewayChildProcess' });

      checkSchemaBrandTextLayerBroker({ node, context });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('INVALID: {brand: #GatewayWrongName for z.instanceof(ChildProcess)} => reports wrongBrandText', () => {
      checkSchemaBrandTextLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = instanceofBrandNode({ brandText: '#GatewayWrongName' });

      checkSchemaBrandTextLayerBroker({ node, context });

      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'wrongBrandText',
        data: { brandText: '#GatewayWrongName', expectedBrandText: '#GatewayChildProcess' },
      });
    });
  });

  describe('z.custom receiver', () => {
    it('VALID: {brand: #GatewayWalkedFile for z.custom<WalkedFile>(fn)} => reports nothing', () => {
      checkSchemaBrandTextLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = customBrandNode({ brandText: '#GatewayWalkedFile' });

      checkSchemaBrandTextLayerBroker({ node, context });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('INVALID: {brand: #GatewayWrongName for z.custom<WalkedFile>(fn)} => reports wrongBrandText', () => {
      checkSchemaBrandTextLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = customBrandNode({ brandText: '#GatewayWrongName' });

      checkSchemaBrandTextLayerBroker({ node, context });

      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'wrongBrandText',
        data: { brandText: '#GatewayWrongName', expectedBrandText: '#GatewayWalkedFile' },
      });
    });
  });

  describe('unrecognized receiver shape', () => {
    it('EMPTY: {.brand() chained off a plain function call, not instanceof/custom} => reports nothing', () => {
      checkSchemaBrandTextLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: {
          type: TsestreeNodeType.MemberExpression,
          object: {
            type: TsestreeNodeType.CallExpression,
            callee: {
              type: TsestreeNodeType.MemberExpression,
              object: { type: TsestreeNodeType.Identifier, name: 'z' },
              property: { type: TsestreeNodeType.Identifier, name: 'string' },
            },
          },
          property: { type: TsestreeNodeType.Identifier, name: 'brand' },
        },
        typeArguments: {
          type: TsestreeNodeType.TSTypeParameterInstantiation,
          params: [
            {
              type: TsestreeNodeType.TSLiteralType,
              literal: { type: TsestreeNodeType.Literal, value: 'AnyText' },
            },
          ],
        },
      });

      checkSchemaBrandTextLayerBroker({ node, context });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });
  });
});

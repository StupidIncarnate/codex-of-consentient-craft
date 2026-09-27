import { isTypeNameReferencedLayerBroker } from './is-type-name-referenced-layer-broker';
import { isTypeNameReferencedLayerBrokerProxy } from './is-type-name-referenced-layer-broker.proxy';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';

describe('isTypeNameReferencedLayerBroker', () => {
  it('VALID: {node: a bare "T" type reference} => returns true', () => {
    isTypeNameReferencedLayerBrokerProxy();
    const node = TsestreeStub({
      type: TsestreeNodeType.TSTypeReference,
      typeName: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'T' }),
    });

    expect(isTypeNameReferencedLayerBroker({ node, typeParameterName: 'T' })).toBe(true);
  });

  it('VALID: {node: "T[]"} => returns true', () => {
    isTypeNameReferencedLayerBrokerProxy();
    const node = TsestreeStub({
      type: TsestreeNodeType.TSArrayType,
      elementType: TsestreeStub({
        type: TsestreeNodeType.TSTypeReference,
        typeName: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'T' }),
      }),
    });

    expect(isTypeNameReferencedLayerBroker({ node, typeParameterName: 'T' })).toBe(true);
  });

  it('VALID: {node: "Array<T>"} => returns true', () => {
    isTypeNameReferencedLayerBrokerProxy();
    const node = TsestreeStub({
      type: TsestreeNodeType.TSTypeReference,
      typeName: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'Array' }),
      typeArguments: TsestreeStub({
        type: TsestreeNodeType.TSTypeParameterInstantiation,
        params: [
          TsestreeStub({
            type: TsestreeNodeType.TSTypeReference,
            typeName: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'T' }),
          }),
        ],
      }),
    });

    expect(isTypeNameReferencedLayerBroker({ node, typeParameterName: 'T' })).toBe(true);
  });

  it('VALID: {node: an object pattern parameter typed "{ value: T }"} => returns true', () => {
    isTypeNameReferencedLayerBrokerProxy();
    const node = TsestreeStub({
      type: TsestreeNodeType.ObjectPattern,
      typeAnnotation: TsestreeStub({
        type: TsestreeNodeType.TSTypeAnnotation,
        typeAnnotation: TsestreeStub({
          type: TsestreeNodeType.TSTypeLiteral,
          members: [
            TsestreeStub({
              type: TsestreeNodeType.TSPropertySignature,
              key: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'value' }),
              typeAnnotation: TsestreeStub({
                type: TsestreeNodeType.TSTypeAnnotation,
                typeAnnotation: TsestreeStub({
                  type: TsestreeNodeType.TSTypeReference,
                  typeName: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'T' }),
                }),
              }),
            }),
          ],
        }),
      }),
    });

    expect(isTypeNameReferencedLayerBroker({ node, typeParameterName: 'T' })).toBe(true);
  });

  it('INVALID: {node: a parameter typed "string", target "T"} => returns false', () => {
    isTypeNameReferencedLayerBrokerProxy();
    const node = TsestreeStub({
      type: TsestreeNodeType.ObjectPattern,
      typeAnnotation: TsestreeStub({
        type: TsestreeNodeType.TSTypeAnnotation,
        typeAnnotation: TsestreeStub({
          type: TsestreeNodeType.TSTypeLiteral,
          members: [
            TsestreeStub({
              type: TsestreeNodeType.TSPropertySignature,
              key: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'url' }),
              typeAnnotation: TsestreeStub({
                type: TsestreeNodeType.TSTypeAnnotation,
                typeAnnotation: TsestreeStub({ type: TsestreeNodeType.TSStringKeyword }),
              }),
            }),
          ],
        }),
      }),
    });

    expect(isTypeNameReferencedLayerBroker({ node, typeParameterName: 'T' })).toBe(false);
  });

  it('EMPTY: {node: undefined} => returns false', () => {
    isTypeNameReferencedLayerBrokerProxy();

    expect(isTypeNameReferencedLayerBroker({ node: undefined, typeParameterName: 'T' })).toBe(
      false,
    );
  });
});

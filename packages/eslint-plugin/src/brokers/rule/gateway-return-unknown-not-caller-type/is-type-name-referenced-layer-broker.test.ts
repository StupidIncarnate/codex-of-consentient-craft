import { TSTypeReferenceStub } from '#gateway/npm/typescript-eslint__utils/ts-type-reference/ts-type-reference.stub';
import { TSArrayTypeStub } from '#gateway/npm/typescript-eslint__utils/ts-array-type/ts-array-type.stub';
import { ObjectPatternStub } from '#gateway/npm/typescript-eslint__utils/object-pattern/object-pattern.stub';
import { isTypeNameReferencedLayerBroker } from './is-type-name-referenced-layer-broker';
import { isTypeNameReferencedLayerBrokerProxy } from './is-type-name-referenced-layer-broker.proxy';

describe('isTypeNameReferencedLayerBroker', () => {
  it('VALID: {node: a bare "T" type reference} => returns true', () => {
    isTypeNameReferencedLayerBrokerProxy();
    const node = TSTypeReferenceStub({ code: 'let x: T;' });

    expect(isTypeNameReferencedLayerBroker({ node, typeParameterName: 'T' })).toBe(true);
  });

  it('VALID: {node: "T[]"} => returns true', () => {
    isTypeNameReferencedLayerBrokerProxy();
    const node = TSArrayTypeStub({ code: 'let x: T[];' });

    expect(isTypeNameReferencedLayerBroker({ node, typeParameterName: 'T' })).toBe(true);
  });

  it('VALID: {node: "Array<T>"} => returns true', () => {
    isTypeNameReferencedLayerBrokerProxy();
    const node = TSTypeReferenceStub({ code: 'let x: Array<T>;' });

    expect(isTypeNameReferencedLayerBroker({ node, typeParameterName: 'T' })).toBe(true);
  });

  it('VALID: {node: an object pattern parameter typed "{ value: T }"} => returns true', () => {
    isTypeNameReferencedLayerBrokerProxy();
    const node = ObjectPatternStub({ code: 'const {  }: { value: T } = y;' });

    expect(isTypeNameReferencedLayerBroker({ node, typeParameterName: 'T' })).toBe(true);
  });

  it('INVALID: {node: a parameter typed "string", target "T"} => returns false', () => {
    isTypeNameReferencedLayerBrokerProxy();
    const node = ObjectPatternStub({ code: 'const {  }: { url: string } = y;' });

    expect(isTypeNameReferencedLayerBroker({ node, typeParameterName: 'T' })).toBe(false);
  });

  it('EMPTY: {node: undefined} => returns false', () => {
    isTypeNameReferencedLayerBrokerProxy();

    expect(isTypeNameReferencedLayerBroker({ node: undefined, typeParameterName: 'T' })).toBe(
      false,
    );
  });
});

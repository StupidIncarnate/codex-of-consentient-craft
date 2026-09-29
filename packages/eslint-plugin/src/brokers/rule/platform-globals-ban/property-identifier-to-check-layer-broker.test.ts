import { IdentifierStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { MemberExpressionStub } from '#gateway/npm/typescript-eslint__utils/member-expression/member-expression.stub';
import { propertyIdentifierToCheckLayerBroker } from './property-identifier-to-check-layer-broker';
import { propertyIdentifierToCheckLayerBrokerProxy } from './property-identifier-to-check-layer-broker.proxy';

describe('propertyIdentifierToCheckLayerBroker', () => {
  it('VALID: {a bare reference outside any member access} => returns the same node', () => {
    propertyIdentifierToCheckLayerBrokerProxy();
    const node = IdentifierStub({ code: 'document;' });

    const result = propertyIdentifierToCheckLayerBroker({ node });

    expect(result).toBe(node);
  });

  it('VALID: {the property of process.stdout} => returns undefined, a label and not a reference', () => {
    propertyIdentifierToCheckLayerBrokerProxy();
    const { property: node } = MemberExpressionStub({ code: 'process.stdout;' });

    const result = propertyIdentifierToCheckLayerBroker({ node });

    expect(result).toBe(undefined);
  });

  it('VALID: {the property of globalThis.fetch} => returns the same node, a global reached explicitly', () => {
    propertyIdentifierToCheckLayerBrokerProxy();
    const { property: node } = MemberExpressionStub({ code: 'globalThis.fetch;' });

    const result = propertyIdentifierToCheckLayerBroker({ node });

    expect(result).toBe(node);
  });

  it('VALID: {a computed property} => returns the same node, since it names a reference', () => {
    propertyIdentifierToCheckLayerBrokerProxy();
    const { property: node } = MemberExpressionStub({ code: 'process[stdout];' });

    const result = propertyIdentifierToCheckLayerBroker({ node });

    expect(result).toBe(node);
  });
});

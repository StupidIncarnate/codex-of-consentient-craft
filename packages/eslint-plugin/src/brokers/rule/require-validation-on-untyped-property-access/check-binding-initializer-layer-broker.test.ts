import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { IdentifierStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { checkBindingInitializerLayerBroker } from './check-binding-initializer-layer-broker';
import { checkBindingInitializerLayerBrokerProxy } from './check-binding-initializer-layer-broker.proxy';

describe('checkBindingInitializerLayerBroker', () => {
  it('VALID: identifier bound in enclosing block returns the init AST node', () => {
    checkBindingInitializerLayerBrokerProxy();

    const code = '{ const parsed = f(); }';
    const initNode = CallExpressionStub({ code });
    const identifierNode = IdentifierStub({ code });

    const result = checkBindingInitializerLayerBroker({ identifierNode });

    expect(result).toStrictEqual(initNode);
  });

  it('EDGE: no matching declarator in enclosing block returns undefined', () => {
    checkBindingInitializerLayerBrokerProxy();

    const identifierNode = IdentifierStub({ code: '{ unknownName; }' });

    const result = checkBindingInitializerLayerBroker({ identifierNode });

    expect(result).toBe(undefined);
  });

  it('EDGE: identifier with no enclosing block or program returns undefined', () => {
    checkBindingInitializerLayerBrokerProxy();

    const identifierNode = IdentifierStub({ code: 'orphan;' });

    const result = checkBindingInitializerLayerBroker({ identifierNode });

    expect(result).toBe(undefined);
  });

  it('EDGE: non-identifier node returns undefined', () => {
    checkBindingInitializerLayerBrokerProxy();

    const node = CallExpressionStub({ code: 'f();' });

    const result = checkBindingInitializerLayerBroker({ identifierNode: node });

    expect(result).toBe(undefined);
  });
});

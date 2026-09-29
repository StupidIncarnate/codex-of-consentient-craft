import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { IdentifierStub as IdentifierNodeStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { checkResolveSchemaBindingLayerBroker } from './check-resolve-schema-binding-layer-broker';
import { checkResolveSchemaBindingLayerBrokerProxy } from './check-resolve-schema-binding-layer-broker.proxy';

describe('checkResolveSchemaBindingLayerBroker', () => {
  it('VALID: identifier bound at Program level returns the init AST node', () => {
    checkResolveSchemaBindingLayerBrokerProxy();

    const code = 'const genericPayloadSchema = f();';
    const initNode = CallExpressionStub({ code });
    const identifierNode = IdentifierNodeStub({ code });

    const result = checkResolveSchemaBindingLayerBroker({ identifierNode });

    expect(result).toStrictEqual(initNode);
  });

  it('VALID: identifier bound via export const at Program level returns the init AST node', () => {
    checkResolveSchemaBindingLayerBrokerProxy();

    const code = 'export const exportedSchema = f();';
    const initNode = CallExpressionStub({ code });
    const identifierNode = IdentifierNodeStub({ code });

    const result = checkResolveSchemaBindingLayerBroker({ identifierNode });

    expect(result).toStrictEqual(initNode);
  });

  it('EDGE: no matching declarator at Program level returns undefined', () => {
    checkResolveSchemaBindingLayerBrokerProxy();

    const identifierNode = IdentifierNodeStub({ code: 'unknownName;' });

    const result = checkResolveSchemaBindingLayerBroker({ identifierNode });

    expect(result).toBe(undefined);
  });

  it('EDGE: identifier with no enclosing scope returns undefined', () => {
    checkResolveSchemaBindingLayerBrokerProxy();

    const identifierNode = IdentifierNodeStub({ code: 'orphan;' });

    const result = checkResolveSchemaBindingLayerBroker({ identifierNode });

    expect(result).toBe(undefined);
  });

  it('EDGE: non-identifier node returns undefined', () => {
    checkResolveSchemaBindingLayerBrokerProxy();

    const node = CallExpressionStub({ code: 'f();' });

    const result = checkResolveSchemaBindingLayerBroker({ identifierNode: node });

    expect(result).toBe(undefined);
  });
});

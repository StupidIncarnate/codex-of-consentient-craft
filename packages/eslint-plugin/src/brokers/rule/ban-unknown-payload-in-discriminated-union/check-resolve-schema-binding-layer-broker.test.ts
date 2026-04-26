import { checkResolveSchemaBindingLayerBroker } from './check-resolve-schema-binding-layer-broker';
import { checkResolveSchemaBindingLayerBrokerProxy } from './check-resolve-schema-binding-layer-broker.proxy';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';
import { IdentifierStub } from '@dungeonmaster/shared/contracts';

describe('checkResolveSchemaBindingLayerBroker', () => {
  it('VALID: identifier bound at Program level returns the init AST node', () => {
    checkResolveSchemaBindingLayerBrokerProxy();

    const initNode = TsestreeStub({ type: TsestreeNodeType.CallExpression });
    const declarator = TsestreeStub({
      type: TsestreeNodeType.VariableDeclarator,
      id: TsestreeStub({
        type: TsestreeNodeType.Identifier,
        name: IdentifierStub({ value: 'genericPayloadSchema' }),
      }),
      init: initNode,
    });
    const declaration = TsestreeStub({
      type: TsestreeNodeType.VariableDeclaration,
      kind: 'const',
      declarations: [declarator],
    });
    const program = TsestreeStub({
      type: TsestreeNodeType.Program,
      body: [declaration],
    });
    const identifierNode = TsestreeStub({
      type: TsestreeNodeType.Identifier,
      name: IdentifierStub({ value: 'genericPayloadSchema' }),
      parent: program,
    });

    const result = checkResolveSchemaBindingLayerBroker({ identifierNode });

    expect(result).toStrictEqual(initNode);
  });

  it('VALID: identifier bound via export const at Program level returns the init AST node', () => {
    checkResolveSchemaBindingLayerBrokerProxy();

    const initNode = TsestreeStub({ type: TsestreeNodeType.CallExpression });
    const declarator = TsestreeStub({
      type: TsestreeNodeType.VariableDeclarator,
      id: TsestreeStub({
        type: TsestreeNodeType.Identifier,
        name: IdentifierStub({ value: 'exportedSchema' }),
      }),
      init: initNode,
    });
    const innerDeclaration = TsestreeStub({
      type: TsestreeNodeType.VariableDeclaration,
      kind: 'const',
      declarations: [declarator],
    });
    const exportDeclaration = TsestreeStub({
      type: TsestreeNodeType.ExportNamedDeclaration,
      declaration: innerDeclaration,
    });
    const program = TsestreeStub({
      type: TsestreeNodeType.Program,
      body: [exportDeclaration],
    });
    const identifierNode = TsestreeStub({
      type: TsestreeNodeType.Identifier,
      name: IdentifierStub({ value: 'exportedSchema' }),
      parent: program,
    });

    const result = checkResolveSchemaBindingLayerBroker({ identifierNode });

    expect(result).toStrictEqual(initNode);
  });

  it('EDGE: no matching declarator at Program level returns undefined', () => {
    checkResolveSchemaBindingLayerBrokerProxy();

    const program = TsestreeStub({
      type: TsestreeNodeType.Program,
      body: [],
    });
    const identifierNode = TsestreeStub({
      type: TsestreeNodeType.Identifier,
      name: IdentifierStub({ value: 'unknownName' }),
      parent: program,
    });

    const result = checkResolveSchemaBindingLayerBroker({ identifierNode });

    expect(result).toBe(undefined);
  });

  it('EDGE: identifier with no enclosing scope returns undefined', () => {
    checkResolveSchemaBindingLayerBrokerProxy();

    const identifierNode = TsestreeStub({
      type: TsestreeNodeType.Identifier,
      name: IdentifierStub({ value: 'orphan' }),
    });

    const result = checkResolveSchemaBindingLayerBroker({ identifierNode });

    expect(result).toBe(undefined);
  });

  it('EDGE: non-identifier node returns undefined', () => {
    checkResolveSchemaBindingLayerBrokerProxy();

    const node = TsestreeStub({ type: TsestreeNodeType.CallExpression });

    const result = checkResolveSchemaBindingLayerBroker({ identifierNode: node });

    expect(result).toBe(undefined);
  });
});

import { checkBindingInitializerLayerBroker } from './check-binding-initializer-layer-broker';
import { checkBindingInitializerLayerBrokerProxy } from './check-binding-initializer-layer-broker.proxy';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';

describe('checkBindingInitializerLayerBroker', () => {
  it('VALID: identifier bound in enclosing block returns the init AST node', () => {
    checkBindingInitializerLayerBrokerProxy();

    const initNode = TsestreeStub({ type: TsestreeNodeType.CallExpression });
    const declarator = TsestreeStub({
      type: TsestreeNodeType.VariableDeclarator,
      id: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'parsed' }),
      init: initNode,
    });
    const declaration = TsestreeStub({
      type: TsestreeNodeType.VariableDeclaration,
      kind: 'const',
      declarations: [declarator],
    });
    const block = TsestreeStub({
      type: TsestreeNodeType.BlockStatement,
      body: [declaration],
    });
    const identifierNode = TsestreeStub({
      type: TsestreeNodeType.Identifier,
      name: 'parsed',
      parent: block,
    });

    const result = checkBindingInitializerLayerBroker({ identifierNode });

    expect(result).toStrictEqual(initNode);
  });

  it('EDGE: no matching declarator in enclosing block returns undefined', () => {
    checkBindingInitializerLayerBrokerProxy();

    const block = TsestreeStub({
      type: TsestreeNodeType.BlockStatement,
      body: [],
    });
    const identifierNode = TsestreeStub({
      type: TsestreeNodeType.Identifier,
      name: 'unknownName',
      parent: block,
    });

    const result = checkBindingInitializerLayerBroker({ identifierNode });

    expect(result).toBe(undefined);
  });

  it('EDGE: identifier with no enclosing block or program returns undefined', () => {
    checkBindingInitializerLayerBrokerProxy();

    const identifierNode = TsestreeStub({
      type: TsestreeNodeType.Identifier,
      name: 'orphan',
    });

    const result = checkBindingInitializerLayerBroker({ identifierNode });

    expect(result).toBe(undefined);
  });

  it('EDGE: non-identifier node returns undefined', () => {
    checkBindingInitializerLayerBrokerProxy();

    const node = TsestreeStub({ type: TsestreeNodeType.CallExpression });

    const result = checkBindingInitializerLayerBroker({ identifierNode: node });

    expect(result).toBe(undefined);
  });
});

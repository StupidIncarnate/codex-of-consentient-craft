import { findEnclosingFunctionLayerBroker } from './find-enclosing-function-layer-broker';
import { findEnclosingFunctionLayerBrokerProxy } from './find-enclosing-function-layer-broker.proxy';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';

describe('findEnclosingFunctionLayerBroker', () => {
  it('VALID: {node: a block two levels under an ArrowFunctionExpression} => returns the arrow function', () => {
    findEnclosingFunctionLayerBrokerProxy();
    const arrowNode = TsestreeStub({ type: TsestreeNodeType.ArrowFunctionExpression });
    const blockNode = TsestreeStub({ type: TsestreeNodeType.BlockStatement, parent: arrowNode });

    const result = findEnclosingFunctionLayerBroker({ node: blockNode });

    expect(result).toStrictEqual(arrowNode);
  });

  it('VALID: {node: a block under a FunctionDeclaration} => returns the function declaration', () => {
    findEnclosingFunctionLayerBrokerProxy();
    const functionNode = TsestreeStub({ type: TsestreeNodeType.FunctionDeclaration });
    const blockNode = TsestreeStub({ type: TsestreeNodeType.BlockStatement, parent: functionNode });

    const result = findEnclosingFunctionLayerBroker({ node: blockNode });

    expect(result).toStrictEqual(functionNode);
  });

  it('VALID: {node: a block under a FunctionExpression} => returns the function expression', () => {
    findEnclosingFunctionLayerBrokerProxy();
    const functionNode = TsestreeStub({ type: TsestreeNodeType.FunctionExpression });
    const blockNode = TsestreeStub({ type: TsestreeNodeType.BlockStatement, parent: functionNode });

    const result = findEnclosingFunctionLayerBroker({ node: blockNode });

    expect(result).toStrictEqual(functionNode);
  });

  it('EMPTY: {node: undefined} => returns undefined', () => {
    findEnclosingFunctionLayerBrokerProxy();

    const result = findEnclosingFunctionLayerBroker({ node: undefined });

    expect(result).toBe(undefined);
  });

  it('EMPTY: {node: a chain with no function ancestor} => returns undefined', () => {
    findEnclosingFunctionLayerBrokerProxy();
    const programNode = TsestreeStub({ type: TsestreeNodeType.Program, parent: null });
    const blockNode = TsestreeStub({ type: TsestreeNodeType.BlockStatement, parent: programNode });

    const result = findEnclosingFunctionLayerBroker({ node: blockNode });

    expect(result).toBe(undefined);
  });
});

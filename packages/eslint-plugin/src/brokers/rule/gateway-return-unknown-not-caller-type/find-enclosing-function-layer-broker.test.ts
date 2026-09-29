import { ArrowFunctionExpressionStub } from '#gateway/npm/typescript-eslint__utils/arrow-function-expression/arrow-function-expression.stub';
import { BlockStatementStub } from '#gateway/npm/typescript-eslint__utils/block-statement/block-statement.stub';
import { FunctionDeclarationStub } from '#gateway/npm/typescript-eslint__utils/function-declaration/function-declaration.stub';
import { FunctionExpressionStub } from '#gateway/npm/typescript-eslint__utils/function-expression/function-expression.stub';
import { findEnclosingFunctionLayerBroker } from './find-enclosing-function-layer-broker';
import { findEnclosingFunctionLayerBrokerProxy } from './find-enclosing-function-layer-broker.proxy';

describe('findEnclosingFunctionLayerBroker', () => {
  it('VALID: {node: a block two levels under an ArrowFunctionExpression} => returns the arrow function', () => {
    findEnclosingFunctionLayerBrokerProxy();
    const code = 'const f = () => {};';
    const arrowNode = ArrowFunctionExpressionStub({ code });
    const blockNode = BlockStatementStub({ code });

    const result = findEnclosingFunctionLayerBroker({ node: blockNode });

    expect(result).toStrictEqual(arrowNode);
  });

  it('VALID: {node: a block under a FunctionDeclaration} => returns the function declaration', () => {
    findEnclosingFunctionLayerBrokerProxy();
    const code = 'function f() {}';
    const functionNode = FunctionDeclarationStub({ code });
    const blockNode = BlockStatementStub({ code });

    const result = findEnclosingFunctionLayerBroker({ node: blockNode });

    expect(result).toStrictEqual(functionNode);
  });

  it('VALID: {node: a block under a FunctionExpression} => returns the function expression', () => {
    findEnclosingFunctionLayerBrokerProxy();
    const code = 'const f = function () {};';
    const functionNode = FunctionExpressionStub({ code });
    const blockNode = BlockStatementStub({ code });

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
    const blockNode = BlockStatementStub({ code: '{  }' });

    const result = findEnclosingFunctionLayerBroker({ node: blockNode });

    expect(result).toBe(undefined);
  });
});

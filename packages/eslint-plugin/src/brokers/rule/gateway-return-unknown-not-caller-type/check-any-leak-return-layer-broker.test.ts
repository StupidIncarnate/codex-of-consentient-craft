import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import { ReturnStatementStub } from '#gateway/npm/typescript-eslint__utils/return-statement/return-statement.stub';
import { BlockStatementStub } from '#gateway/npm/typescript-eslint__utils/block-statement/block-statement.stub';
import { checkAnyLeakReturnLayerBroker } from './check-any-leak-return-layer-broker';
import { checkAnyLeakReturnLayerBrokerProxy } from './check-any-leak-return-layer-broker.proxy';

describe('checkAnyLeakReturnLayerBroker', () => {
  it('VALID: {return JSON.parse(text) directly, no declared return type} => reports anyLeakNoReturnType', () => {
    checkAnyLeakReturnLayerBrokerProxy();
    const mockReport = jest.fn();
    const context = RuleContextStub({ report: mockReport });
    const code = 'const f = () => { return JSON.parse(); };';
    const returnStatement = ReturnStatementStub({ code });
    const blockNode = BlockStatementStub({ code });
    returnStatement.parent = blockNode;

    checkAnyLeakReturnLayerBroker({ node: returnStatement, context });

    expect(mockReport).toHaveBeenCalledWith({
      node: returnStatement,
      messageId: 'anyLeakNoReturnType',
    });
  });

  it('VALID: {const data = JSON.parse(text); return data;, no declared return type} => reports anyLeakNoReturnType', () => {
    checkAnyLeakReturnLayerBrokerProxy();
    const mockReport = jest.fn();
    const context = RuleContextStub({ report: mockReport });
    const code = 'const f = () => { const data = JSON.parse(); return data; };';
    const returnStatement = ReturnStatementStub({ code });
    const blockNode = BlockStatementStub({ code });
    returnStatement.parent = blockNode;

    checkAnyLeakReturnLayerBroker({ node: returnStatement, context });

    expect(mockReport).toHaveBeenCalledWith({
      node: returnStatement,
      messageId: 'anyLeakNoReturnType',
    });
  });

  it('EMPTY: {enclosing function declares a return type} => reports nothing', () => {
    checkAnyLeakReturnLayerBrokerProxy();
    const mockReport = jest.fn();
    const context = RuleContextStub({ report: mockReport });
    const code = 'const f = (): unknown => { return JSON.parse(); };';
    const returnStatement = ReturnStatementStub({ code });
    const blockNode = BlockStatementStub({ code });
    returnStatement.parent = blockNode;

    checkAnyLeakReturnLayerBroker({ node: returnStatement, context });

    expect(mockReport).toHaveBeenCalledTimes(0);
  });

  it('EMPTY: {returned identifier traces to a non-JSON.parse/import initializer} => reports nothing', () => {
    checkAnyLeakReturnLayerBrokerProxy();
    const mockReport = jest.fn();
    const context = RuleContextStub({ report: mockReport });
    const code = 'const f = () => { const data = 5; return data; };';
    const returnStatement = ReturnStatementStub({ code });
    const blockNode = BlockStatementStub({ code });
    returnStatement.parent = blockNode;

    checkAnyLeakReturnLayerBroker({ node: returnStatement, context });

    expect(mockReport).toHaveBeenCalledTimes(0);
  });
});

import { hasMeaningfulStatementLayerBrokerProxy } from './has-meaningful-statement-layer-broker.proxy';
import { TsestreeStub } from '../../../contracts/tsestree/tsestree.stub';

describe('hasMeaningfulStatementLayerBroker', () => {
  it('THROW: ThrowStatement => returns true', () => {
    const proxy = hasMeaningfulStatementLayerBrokerProxy();

    const result = proxy.hasMeaningfulStatementLayerBroker({
      statements: [TsestreeStub({ type: 'ThrowStatement' })],
    });

    expect(result).toBe(true);
  });

  it('RETURN_VALUE: ReturnStatement with argument => returns true', () => {
    const proxy = hasMeaningfulStatementLayerBrokerProxy();

    const result = proxy.hasMeaningfulStatementLayerBroker({
      statements: [
        TsestreeStub({
          type: 'ReturnStatement',
          argument: TsestreeStub({ type: 'Literal', value: 42 }),
        }),
      ],
    });

    expect(result).toBe(true);
  });

  it('RETURN_BARE: ReturnStatement without argument => returns false', () => {
    const proxy = hasMeaningfulStatementLayerBrokerProxy();

    const result = proxy.hasMeaningfulStatementLayerBroker({
      statements: [TsestreeStub({ type: 'ReturnStatement', argument: null })],
    });

    expect(result).toBe(false);
  });

  it('RETURN_UNDEFINED: ReturnStatement with undefined identifier => returns false', () => {
    const proxy = hasMeaningfulStatementLayerBrokerProxy();

    const result = proxy.hasMeaningfulStatementLayerBroker({
      statements: [
        TsestreeStub({
          type: 'ReturnStatement',
          argument: TsestreeStub({ type: 'Identifier', name: 'undefined' }),
        }),
      ],
    });

    expect(result).toBe(false);
  });

  it('CALL: ExpressionStatement with CallExpression => returns true', () => {
    const proxy = hasMeaningfulStatementLayerBrokerProxy();

    const result = proxy.hasMeaningfulStatementLayerBroker({
      statements: [
        TsestreeStub({
          type: 'ExpressionStatement',
          expression: TsestreeStub({ type: 'CallExpression' }),
        }),
      ],
    });

    expect(result).toBe(true);
  });

  it('ASSIGNMENT: ExpressionStatement with AssignmentExpression => returns true', () => {
    const proxy = hasMeaningfulStatementLayerBrokerProxy();

    const result = proxy.hasMeaningfulStatementLayerBroker({
      statements: [
        TsestreeStub({
          type: 'ExpressionStatement',
          expression: TsestreeStub({ type: 'AssignmentExpression' }),
        }),
      ],
    });

    expect(result).toBe(true);
  });

  it('VARIABLE: VariableDeclaration => returns true', () => {
    const proxy = hasMeaningfulStatementLayerBrokerProxy();

    const result = proxy.hasMeaningfulStatementLayerBroker({
      statements: [TsestreeStub({ type: 'VariableDeclaration' })],
    });

    expect(result).toBe(true);
  });

  it('IF: IfStatement => returns true', () => {
    const proxy = hasMeaningfulStatementLayerBrokerProxy();

    const result = proxy.hasMeaningfulStatementLayerBroker({
      statements: [TsestreeStub({ type: 'IfStatement' })],
    });

    expect(result).toBe(true);
  });

  it('EMPTY: empty array => returns false', () => {
    const proxy = hasMeaningfulStatementLayerBrokerProxy();

    const result = proxy.hasMeaningfulStatementLayerBroker({
      statements: [],
    });

    expect(result).toBe(false);
  });

  it('AWAIT: ExpressionStatement with AwaitExpression => returns true', () => {
    const proxy = hasMeaningfulStatementLayerBrokerProxy();

    const result = proxy.hasMeaningfulStatementLayerBroker({
      statements: [
        TsestreeStub({
          type: 'ExpressionStatement',
          expression: TsestreeStub({ type: 'AwaitExpression' }),
        }),
      ],
    });

    expect(result).toBe(true);
  });

  it('UPDATE: ExpressionStatement with UpdateExpression => returns true', () => {
    const proxy = hasMeaningfulStatementLayerBrokerProxy();

    const result = proxy.hasMeaningfulStatementLayerBroker({
      statements: [
        TsestreeStub({
          type: 'ExpressionStatement',
          expression: TsestreeStub({ type: 'UpdateExpression' }),
        }),
      ],
    });

    expect(result).toBe(true);
  });

  it('EXPRESSION_OTHER: ExpressionStatement with non-meaningful expression => returns false', () => {
    const proxy = hasMeaningfulStatementLayerBrokerProxy();

    const result = proxy.hasMeaningfulStatementLayerBroker({
      statements: [
        TsestreeStub({
          type: 'ExpressionStatement',
          expression: TsestreeStub({ type: 'Identifier' }),
        }),
      ],
    });

    expect(result).toBe(false);
  });
});

import { hasMeaningfulStatementLayerBrokerProxy } from './has-meaningful-statement-layer-broker.proxy';
import { TsestreeStub } from '../../../contracts/tsestree/tsestree.stub';

describe('hasMeaningfulStatementLayerBroker', () => {
  it('VALID: ThrowStatement => returns true', () => {
    const proxy = hasMeaningfulStatementLayerBrokerProxy();

    const result = proxy.hasMeaningfulStatementLayerBroker({
      statements: [TsestreeStub({ type: 'ThrowStatement' })],
    });

    expect(result).toBe(true);
  });

  it('VALID: ReturnStatement with argument => returns true', () => {
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

  it('INVALID: ReturnStatement without argument => returns false', () => {
    const proxy = hasMeaningfulStatementLayerBrokerProxy();

    const result = proxy.hasMeaningfulStatementLayerBroker({
      statements: [TsestreeStub({ type: 'ReturnStatement', argument: null })],
    });

    expect(result).toBe(false);
  });

  it('INVALID: ReturnStatement with undefined identifier => returns false', () => {
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

  it('VALID: ExpressionStatement with CallExpression => returns true', () => {
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

  it('VALID: ExpressionStatement with AssignmentExpression => returns true', () => {
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

  it('VALID: VariableDeclaration => returns true', () => {
    const proxy = hasMeaningfulStatementLayerBrokerProxy();

    const result = proxy.hasMeaningfulStatementLayerBroker({
      statements: [TsestreeStub({ type: 'VariableDeclaration' })],
    });

    expect(result).toBe(true);
  });

  it('VALID: IfStatement => returns true', () => {
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

  it('VALID: ExpressionStatement with AwaitExpression => returns true', () => {
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

  it('VALID: ExpressionStatement with UpdateExpression => returns true', () => {
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

  it('INVALID: ExpressionStatement with non-meaningful expression => returns false', () => {
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

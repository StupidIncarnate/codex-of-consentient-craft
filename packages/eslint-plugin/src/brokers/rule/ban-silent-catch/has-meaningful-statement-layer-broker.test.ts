import { ThrowStatementStub } from '#gateway/npm/typescript-eslint__utils/throw-statement/throw-statement.stub';
import { ReturnStatementStub } from '#gateway/npm/typescript-eslint__utils/return-statement/return-statement.stub';
import { ExpressionStatementStub } from '#gateway/npm/typescript-eslint__utils/expression-statement/expression-statement.stub';
import { VariableDeclarationStub } from '#gateway/npm/typescript-eslint__utils/variable-declaration/variable-declaration.stub';
import { IfStatementStub } from '#gateway/npm/typescript-eslint__utils/if-statement/if-statement.stub';
import { hasMeaningfulStatementLayerBrokerProxy } from './has-meaningful-statement-layer-broker.proxy';

describe('hasMeaningfulStatementLayerBroker', () => {
  it('VALID: ThrowStatement => returns true', () => {
    const proxy = hasMeaningfulStatementLayerBrokerProxy();

    const result = proxy.hasMeaningfulStatementLayerBroker({
      statements: [ThrowStatementStub({ code: 'throw x;' })],
    });

    expect(result).toBe(true);
  });

  it('VALID: ReturnStatement with argument => returns true', () => {
    const proxy = hasMeaningfulStatementLayerBrokerProxy();

    const result = proxy.hasMeaningfulStatementLayerBroker({
      statements: [ReturnStatementStub({ code: 'return 42;' })],
    });

    expect(result).toBe(true);
  });

  it('INVALID: ReturnStatement without argument => returns false', () => {
    const proxy = hasMeaningfulStatementLayerBrokerProxy();

    const result = proxy.hasMeaningfulStatementLayerBroker({
      statements: [ReturnStatementStub({ code: 'return;' })],
    });

    expect(result).toBe(false);
  });

  it('INVALID: ReturnStatement with undefined identifier => returns false', () => {
    const proxy = hasMeaningfulStatementLayerBrokerProxy();

    const result = proxy.hasMeaningfulStatementLayerBroker({
      statements: [ReturnStatementStub({ code: 'return undefined;' })],
    });

    expect(result).toBe(false);
  });

  it('VALID: ExpressionStatement with CallExpression => returns true', () => {
    const proxy = hasMeaningfulStatementLayerBrokerProxy();

    const result = proxy.hasMeaningfulStatementLayerBroker({
      statements: [ExpressionStatementStub({ code: 'f();' })],
    });

    expect(result).toBe(true);
  });

  it('VALID: ExpressionStatement with AssignmentExpression => returns true', () => {
    const proxy = hasMeaningfulStatementLayerBrokerProxy();

    const result = proxy.hasMeaningfulStatementLayerBroker({
      statements: [ExpressionStatementStub({ code: 'x = 0;' })],
    });

    expect(result).toBe(true);
  });

  it('VALID: VariableDeclaration => returns true', () => {
    const proxy = hasMeaningfulStatementLayerBrokerProxy();

    const result = proxy.hasMeaningfulStatementLayerBroker({
      statements: [VariableDeclarationStub({ code: 'const x;' })],
    });

    expect(result).toBe(true);
  });

  it('VALID: IfStatement => returns true', () => {
    const proxy = hasMeaningfulStatementLayerBrokerProxy();

    const result = proxy.hasMeaningfulStatementLayerBroker({
      statements: [IfStatementStub({ code: 'if (x) {}' })],
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
      statements: [ExpressionStatementStub({ code: 'await x;' })],
    });

    expect(result).toBe(true);
  });

  it('VALID: ExpressionStatement with UpdateExpression => returns true', () => {
    const proxy = hasMeaningfulStatementLayerBrokerProxy();

    const result = proxy.hasMeaningfulStatementLayerBroker({
      statements: [ExpressionStatementStub({ code: 'x++;' })],
    });

    expect(result).toBe(true);
  });

  it('INVALID: ExpressionStatement with non-meaningful expression => returns false', () => {
    const proxy = hasMeaningfulStatementLayerBrokerProxy();

    const result = proxy.hasMeaningfulStatementLayerBroker({
      statements: [ExpressionStatementStub({ code: 'x;' })],
    });

    expect(result).toBe(false);
  });
});

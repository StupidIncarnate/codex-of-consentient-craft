import { BlockStatementStub } from '#gateway/npm/typescript-eslint__utils/block-statement/block-statement.stub';
import { IdentifierStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { UnaryExpressionStub } from '#gateway/npm/typescript-eslint__utils/unary-expression/unary-expression.stub';
import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { isSilentBodyLayerBrokerProxy } from './is-silent-body-layer-broker.proxy';

describe('isSilentBodyLayerBroker', () => {
  it('EDGE: null body => returns true', () => {
    const proxy = isSilentBodyLayerBrokerProxy();

    const result = proxy.isSilentBodyLayerBroker({ body: null });

    expect(result).toBe(true);
  });

  it('EDGE: undefined body => returns true', () => {
    const proxy = isSilentBodyLayerBrokerProxy();

    const result = proxy.isSilentBodyLayerBroker({ body: undefined });

    expect(result).toBe(true);
  });

  it('EMPTY: BlockStatement with no statements => returns true', () => {
    const proxy = isSilentBodyLayerBrokerProxy();

    const result = proxy.isSilentBodyLayerBroker({
      body: BlockStatementStub({ code: '{  }' }),
    });

    expect(result).toBe(true);
  });

  it('EDGE: expression body with undefined identifier => returns true', () => {
    const proxy = isSilentBodyLayerBrokerProxy();

    const result = proxy.isSilentBodyLayerBroker({
      body: IdentifierStub({ code: 'undefined;' }),
    });

    expect(result).toBe(true);
  });

  it('EDGE: UnaryExpression with literal 0 => returns true', () => {
    const proxy = isSilentBodyLayerBrokerProxy();

    const result = proxy.isSilentBodyLayerBroker({
      body: UnaryExpressionStub({ code: '!0' }),
    });

    expect(result).toBe(true);
  });

  it('VALID: expression body with CallExpression => returns false', () => {
    const proxy = isSilentBodyLayerBrokerProxy();

    const result = proxy.isSilentBodyLayerBroker({
      body: CallExpressionStub({ code: 'f();' }),
    });

    expect(result).toBe(false);
  });

  it('VALID: BlockStatement with ThrowStatement => returns false', () => {
    const proxy = isSilentBodyLayerBrokerProxy();

    const result = proxy.isSilentBodyLayerBroker({
      body: BlockStatementStub({ code: '{ throw x; }' }),
    });

    expect(result).toBe(false);
  });

  it('EDGE: BlockStatement with only return undefined => returns true', () => {
    const proxy = isSilentBodyLayerBrokerProxy();

    const result = proxy.isSilentBodyLayerBroker({
      body: BlockStatementStub({ code: '{ return undefined; }' }),
    });

    expect(result).toBe(true);
  });
});

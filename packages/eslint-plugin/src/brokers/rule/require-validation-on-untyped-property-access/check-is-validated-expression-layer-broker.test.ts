import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { MemberExpressionStub } from '#gateway/npm/typescript-eslint__utils/member-expression/member-expression.stub';
import { IdentifierStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { checkIsValidatedExpressionLayerBroker } from './check-is-validated-expression-layer-broker';
import { checkIsValidatedExpressionLayerBrokerProxy } from './check-is-validated-expression-layer-broker.proxy';

describe('checkIsValidatedExpressionLayerBroker', () => {
  it('VALID: direct contract.parse(...) CallExpression returns true', () => {
    checkIsValidatedExpressionLayerBrokerProxy();

    const node = CallExpressionStub({ code: 'userContract.parse();' });

    expect(checkIsValidatedExpressionLayerBroker({ node })).toBe(true);
  });

  it('VALID: member-expression chain rooted in contract.parse(...) returns true', () => {
    checkIsValidatedExpressionLayerBrokerProxy();

    const node = MemberExpressionStub({ code: 'userContract.parse().name;' });

    expect(checkIsValidatedExpressionLayerBroker({ node })).toBe(true);
  });

  it('VALID: safeParse(...).data chain returns true', () => {
    checkIsValidatedExpressionLayerBrokerProxy();

    const node = MemberExpressionStub({ code: 'userContract.safeParse().data;' });

    expect(checkIsValidatedExpressionLayerBroker({ node })).toBe(true);
  });

  it('INVALID: plain Identifier node returns false', () => {
    checkIsValidatedExpressionLayerBrokerProxy();

    const node = IdentifierStub({ code: 'someValue;' });

    expect(checkIsValidatedExpressionLayerBroker({ node })).toBe(false);
  });

  it('INVALID: unrelated CallExpression returns false', () => {
    checkIsValidatedExpressionLayerBrokerProxy();

    const node = CallExpressionStub({ code: 'doSomething();' });

    expect(checkIsValidatedExpressionLayerBroker({ node })).toBe(false);
  });

  it('EDGE: null node returns false', () => {
    checkIsValidatedExpressionLayerBrokerProxy();

    expect(checkIsValidatedExpressionLayerBroker({ node: null })).toBe(false);
  });

  it('EDGE: missing node returns false', () => {
    checkIsValidatedExpressionLayerBrokerProxy();

    expect(checkIsValidatedExpressionLayerBroker({})).toBe(false);
  });
});

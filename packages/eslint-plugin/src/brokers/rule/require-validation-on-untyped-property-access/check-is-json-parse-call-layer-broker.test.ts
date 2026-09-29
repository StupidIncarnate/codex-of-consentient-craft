import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { IdentifierStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { checkIsJsonParseCallLayerBroker } from './check-is-json-parse-call-layer-broker';
import { checkIsJsonParseCallLayerBrokerProxy } from './check-is-json-parse-call-layer-broker.proxy';

describe('checkIsJsonParseCallLayerBroker', () => {
  it('VALID: CallExpression whose callee is JSON.parse returns true', () => {
    checkIsJsonParseCallLayerBrokerProxy();

    const node = CallExpressionStub({ code: 'JSON.parse();' });

    expect(checkIsJsonParseCallLayerBroker({ node })).toBe(true);
  });

  it('INVALID: CallExpression with a different callee returns false', () => {
    checkIsJsonParseCallLayerBrokerProxy();

    const node = CallExpressionStub({ code: 'someContract.parse();' });

    expect(checkIsJsonParseCallLayerBroker({ node })).toBe(false);
  });

  it('INVALID: Identifier node returns false', () => {
    checkIsJsonParseCallLayerBrokerProxy();

    const node = IdentifierStub({ code: 'something;' });

    expect(checkIsJsonParseCallLayerBroker({ node })).toBe(false);
  });

  it('EDGE: null node returns false', () => {
    checkIsJsonParseCallLayerBrokerProxy();

    expect(checkIsJsonParseCallLayerBroker({ node: null })).toBe(false);
  });

  it('EDGE: missing node returns false', () => {
    checkIsJsonParseCallLayerBrokerProxy();

    expect(checkIsJsonParseCallLayerBroker({})).toBe(false);
  });
});

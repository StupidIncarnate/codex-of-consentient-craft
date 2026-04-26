import { checkIsJsonParseCallLayerBroker } from './check-is-json-parse-call-layer-broker';
import { checkIsJsonParseCallLayerBrokerProxy } from './check-is-json-parse-call-layer-broker.proxy';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';

describe('checkIsJsonParseCallLayerBroker', () => {
  it('VALID: CallExpression whose callee is JSON.parse returns true', () => {
    checkIsJsonParseCallLayerBrokerProxy();

    const node = TsestreeStub({
      type: TsestreeNodeType.CallExpression,
      callee: TsestreeStub({
        type: TsestreeNodeType.MemberExpression,
        object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'JSON' }),
        property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'parse' }),
      }),
    });

    expect(checkIsJsonParseCallLayerBroker({ node })).toBe(true);
  });

  it('INVALID: CallExpression with a different callee returns false', () => {
    checkIsJsonParseCallLayerBrokerProxy();

    const node = TsestreeStub({
      type: TsestreeNodeType.CallExpression,
      callee: TsestreeStub({
        type: TsestreeNodeType.MemberExpression,
        object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'someContract' }),
        property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'parse' }),
      }),
    });

    expect(checkIsJsonParseCallLayerBroker({ node })).toBe(false);
  });

  it('INVALID: Identifier node returns false', () => {
    checkIsJsonParseCallLayerBrokerProxy();

    const node = TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'something' });

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

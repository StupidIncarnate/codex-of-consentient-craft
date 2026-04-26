import { checkIsValidatedExpressionLayerBroker } from './check-is-validated-expression-layer-broker';
import { checkIsValidatedExpressionLayerBrokerProxy } from './check-is-validated-expression-layer-broker.proxy';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';

describe('checkIsValidatedExpressionLayerBroker', () => {
  it('VALID: direct contract.parse(...) CallExpression returns true', () => {
    checkIsValidatedExpressionLayerBrokerProxy();

    const node = TsestreeStub({
      type: TsestreeNodeType.CallExpression,
      callee: TsestreeStub({
        type: TsestreeNodeType.MemberExpression,
        object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'userContract' }),
        property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'parse' }),
      }),
    });

    expect(checkIsValidatedExpressionLayerBroker({ node })).toBe(true);
  });

  it('VALID: member-expression chain rooted in contract.parse(...) returns true', () => {
    checkIsValidatedExpressionLayerBrokerProxy();

    const parseCall = TsestreeStub({
      type: TsestreeNodeType.CallExpression,
      callee: TsestreeStub({
        type: TsestreeNodeType.MemberExpression,
        object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'userContract' }),
        property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'parse' }),
      }),
    });
    const node = TsestreeStub({
      type: TsestreeNodeType.MemberExpression,
      object: parseCall,
      property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'name' }),
    });

    expect(checkIsValidatedExpressionLayerBroker({ node })).toBe(true);
  });

  it('VALID: safeParse(...).data chain returns true', () => {
    checkIsValidatedExpressionLayerBrokerProxy();

    const safeParseCall = TsestreeStub({
      type: TsestreeNodeType.CallExpression,
      callee: TsestreeStub({
        type: TsestreeNodeType.MemberExpression,
        object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'userContract' }),
        property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'safeParse' }),
      }),
    });
    const node = TsestreeStub({
      type: TsestreeNodeType.MemberExpression,
      object: safeParseCall,
      property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'data' }),
    });

    expect(checkIsValidatedExpressionLayerBroker({ node })).toBe(true);
  });

  it('INVALID: plain Identifier node returns false', () => {
    checkIsValidatedExpressionLayerBrokerProxy();

    const node = TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'someValue' });

    expect(checkIsValidatedExpressionLayerBroker({ node })).toBe(false);
  });

  it('INVALID: unrelated CallExpression returns false', () => {
    checkIsValidatedExpressionLayerBrokerProxy();

    const node = TsestreeStub({
      type: TsestreeNodeType.CallExpression,
      callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'doSomething' }),
    });

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

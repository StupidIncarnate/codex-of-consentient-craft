import { isSilentBodyLayerBrokerProxy } from './is-silent-body-layer-broker.proxy';
import { TsestreeStub } from '../../../contracts/tsestree/tsestree.stub';

describe('isSilentBodyLayerBroker', () => {
  it('NULL_BODY: null body => returns true', () => {
    const proxy = isSilentBodyLayerBrokerProxy();

    const result = proxy.isSilentBodyLayerBroker({ body: null });

    expect(result).toBe(true);
  });

  it('UNDEFINED_BODY: undefined body => returns true', () => {
    const proxy = isSilentBodyLayerBrokerProxy();

    const result = proxy.isSilentBodyLayerBroker({ body: undefined });

    expect(result).toBe(true);
  });

  it('EMPTY_BLOCK: BlockStatement with no statements => returns true', () => {
    const proxy = isSilentBodyLayerBrokerProxy();

    const result = proxy.isSilentBodyLayerBroker({
      body: TsestreeStub({ type: 'BlockStatement', body: [] }),
    });

    expect(result).toBe(true);
  });

  it('UNDEFINED_IDENTIFIER: expression body with undefined identifier => returns true', () => {
    const proxy = isSilentBodyLayerBrokerProxy();

    const result = proxy.isSilentBodyLayerBroker({
      body: TsestreeStub({ type: 'Identifier', name: 'undefined' }),
    });

    expect(result).toBe(true);
  });

  it('VOID_ZERO: UnaryExpression with literal 0 => returns true', () => {
    const proxy = isSilentBodyLayerBrokerProxy();

    const result = proxy.isSilentBodyLayerBroker({
      body: TsestreeStub({
        type: 'UnaryExpression',
        argument: TsestreeStub({ type: 'Literal', value: 0 }),
      }),
    });

    expect(result).toBe(true);
  });

  it('MEANINGFUL_EXPRESSION: expression body with CallExpression => returns false', () => {
    const proxy = isSilentBodyLayerBrokerProxy();

    const result = proxy.isSilentBodyLayerBroker({
      body: TsestreeStub({ type: 'CallExpression' }),
    });

    expect(result).toBe(false);
  });

  it('MEANINGFUL_BLOCK: BlockStatement with ThrowStatement => returns false', () => {
    const proxy = isSilentBodyLayerBrokerProxy();

    const result = proxy.isSilentBodyLayerBroker({
      body: TsestreeStub({
        type: 'BlockStatement',
        body: [TsestreeStub({ type: 'ThrowStatement' })],
      }),
    });

    expect(result).toBe(false);
  });

  it('BLOCK_RETURN_UNDEFINED: BlockStatement with only return undefined => returns true', () => {
    const proxy = isSilentBodyLayerBrokerProxy();

    const result = proxy.isSilentBodyLayerBroker({
      body: TsestreeStub({
        type: 'BlockStatement',
        body: [
          TsestreeStub({
            type: 'ReturnStatement',
            argument: TsestreeStub({ type: 'Identifier', name: 'undefined' }),
          }),
        ],
      }),
    });

    expect(result).toBe(true);
  });
});

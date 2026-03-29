import { isSilentBodyLayerBrokerProxy } from './is-silent-body-layer-broker.proxy';
import { TsestreeStub } from '../../../contracts/tsestree/tsestree.stub';

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
      body: TsestreeStub({ type: 'BlockStatement', body: [] }),
    });

    expect(result).toBe(true);
  });

  it('EDGE: expression body with undefined identifier => returns true', () => {
    const proxy = isSilentBodyLayerBrokerProxy();

    const result = proxy.isSilentBodyLayerBroker({
      body: TsestreeStub({ type: 'Identifier', name: 'undefined' }),
    });

    expect(result).toBe(true);
  });

  it('EDGE: UnaryExpression with literal 0 => returns true', () => {
    const proxy = isSilentBodyLayerBrokerProxy();

    const result = proxy.isSilentBodyLayerBroker({
      body: TsestreeStub({
        type: 'UnaryExpression',
        argument: TsestreeStub({ type: 'Literal', value: 0 }),
      }),
    });

    expect(result).toBe(true);
  });

  it('VALID: expression body with CallExpression => returns false', () => {
    const proxy = isSilentBodyLayerBrokerProxy();

    const result = proxy.isSilentBodyLayerBroker({
      body: TsestreeStub({ type: 'CallExpression' }),
    });

    expect(result).toBe(false);
  });

  it('VALID: BlockStatement with ThrowStatement => returns false', () => {
    const proxy = isSilentBodyLayerBrokerProxy();

    const result = proxy.isSilentBodyLayerBroker({
      body: TsestreeStub({
        type: 'BlockStatement',
        body: [TsestreeStub({ type: 'ThrowStatement' })],
      }),
    });

    expect(result).toBe(false);
  });

  it('EDGE: BlockStatement with only return undefined => returns true', () => {
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

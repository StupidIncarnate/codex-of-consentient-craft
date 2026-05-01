import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { hasResponderCreateLayerBrokerProxy } from './has-responder-create-layer-broker.proxy';
import { hasResponderCreateLayerBroker } from './has-responder-create-layer-broker';

describe('hasResponderCreateLayerBroker', () => {
  it('VALID: {responders with rule/create/} => returns true', () => {
    const proxy = hasResponderCreateLayerBrokerProxy();
    proxy.setupWithCreate({ domainName: 'rule' });

    const result = hasResponderCreateLayerBroker({
      respondersDirPath: AbsoluteFilePathStub({ value: '/project/src/responders' }),
    });

    expect(result).toBe(true);
  });

  it('INVALID: {responders with no create subdir} => returns false', () => {
    const proxy = hasResponderCreateLayerBrokerProxy();
    proxy.setupWithoutCreate({ domainNames: ['rule', 'handle'] });

    const result = hasResponderCreateLayerBroker({
      respondersDirPath: AbsoluteFilePathStub({ value: '/project/src/responders' }),
    });

    expect(result).toBe(false);
  });

  it('EMPTY: {no responders dir} => returns false', () => {
    const proxy = hasResponderCreateLayerBrokerProxy();
    proxy.setupEmpty();

    const result = hasResponderCreateLayerBroker({
      respondersDirPath: AbsoluteFilePathStub({ value: '/project/src/responders' }),
    });

    expect(result).toBe(false);
  });
});

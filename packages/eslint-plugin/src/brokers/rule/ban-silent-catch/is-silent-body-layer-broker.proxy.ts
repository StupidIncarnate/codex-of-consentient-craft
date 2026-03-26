import { hasMeaningfulStatementLayerBrokerProxy } from './has-meaningful-statement-layer-broker.proxy';
import { isSilentBodyLayerBroker as implementation } from './is-silent-body-layer-broker';

export const isSilentBodyLayerBrokerProxy = (): {
  isSilentBodyLayerBroker: typeof implementation;
} => {
  hasMeaningfulStatementLayerBrokerProxy();

  return {
    isSilentBodyLayerBroker: implementation,
  };
};

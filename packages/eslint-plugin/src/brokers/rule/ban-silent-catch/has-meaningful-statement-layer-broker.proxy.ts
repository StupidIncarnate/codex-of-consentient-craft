import { hasMeaningfulStatementLayerBroker as implementation } from './has-meaningful-statement-layer-broker';

export const hasMeaningfulStatementLayerBrokerProxy = (): {
  hasMeaningfulStatementLayerBroker: typeof implementation;
} => ({
  hasMeaningfulStatementLayerBroker: implementation,
});

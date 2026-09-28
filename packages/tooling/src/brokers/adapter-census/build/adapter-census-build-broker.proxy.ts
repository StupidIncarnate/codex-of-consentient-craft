import { adapterCensusBuildGatewayLayerBrokerProxy } from './adapter-census-build-gateway-layer-broker.proxy';
import { adapterCensusBuildImportersLayerBrokerProxy } from './adapter-census-build-importers-layer-broker.proxy';
import { adapterCensusBuildRecordsLayerBrokerProxy } from './adapter-census-build-records-layer-broker.proxy';
import { sourceFactsExtractBrokerProxy } from '../../source-facts/extract/source-facts-extract-broker.proxy';

// The build reads only the sources it is handed and parses them for real, so the only proxies to
// compose are the (empty) ones of the steps it calls.
export const adapterCensusBuildBrokerProxy = (): Record<PropertyKey, never> => {
  sourceFactsExtractBrokerProxy();
  adapterCensusBuildGatewayLayerBrokerProxy();
  adapterCensusBuildImportersLayerBrokerProxy();
  adapterCensusBuildRecordsLayerBrokerProxy();
  return {};
};

import { checkFolderReturnTypeLayerBrokerProxy } from './check-folder-return-type-layer-broker.proxy';

export const ruleEnforceFolderReturnTypesBrokerProxy = (): Record<PropertyKey, never> => {
  checkFolderReturnTypeLayerBrokerProxy();
  return {};
};

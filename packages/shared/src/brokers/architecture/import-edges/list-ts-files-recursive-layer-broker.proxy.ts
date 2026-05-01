import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';

export const listTsFilesRecursiveLayerBrokerProxy = (): Record<PropertyKey, never> => {
  // listTsFilesRecursiveLayerBroker uses safeReaddirLayerBroker internally.
  // The parent proxy (architectureImportEdgesBrokerProxy) controls the shared readdir
  // mock via setupImplementation on the safeReaddirLayerBrokerProxy below, which
  // routes through the stack-based registerMock dispatcher.
  safeReaddirLayerBrokerProxy();
  return {};
};

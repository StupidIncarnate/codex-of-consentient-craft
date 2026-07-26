import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';

export const listTsFilesRecursiveLayerBrokerProxy = (): Record<PropertyKey, never> => {
  // listTsFilesRecursiveLayerBroker uses safeReaddirLayerBroker internally.
  // The parent proxy (architectureImportEdgesBrokerProxy) controls the shared readdir
  // mock via setupImplementation on the safeReaddirLayerBrokerProxy below. Staging is
  // shared across every proxy mocking that function, so the parent's description
  // answers this broker's reads too.
  safeReaddirLayerBrokerProxy();
  return {};
};

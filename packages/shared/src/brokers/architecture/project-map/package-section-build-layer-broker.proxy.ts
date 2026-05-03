import { architectureBootTreeBrokerProxy } from '../boot-tree/architecture-boot-tree-broker.proxy';
import { headlineDispatchLayerBrokerProxy } from './headline-dispatch-layer-broker.proxy';

export const packageSectionBuildLayerBrokerProxy = (): {
  setupLibraryPackage: () => void;
  setupHttpBackendPackage: () => void;
} => {
  architectureBootTreeBrokerProxy();
  const headlineProxy = headlineDispatchLayerBrokerProxy();

  return {
    setupLibraryPackage: (): void => {
      // Library packages skip the boot tree in the implementation, so bootTreeProxy is not
      // called here — calling bootTreeProxy.setupNoStartupFiles() would queue a ReturnValueOnce
      // that could contaminate readdir call ordering in composer-level proxy tests.
      headlineProxy.setupForLibrary();
    },

    setupHttpBackendPackage: (): void => {
      // http-backend packages skip the boot tree (Boot section removed in favour of Routes),
      // so bootTreeProxy is not called here for the same reason as library packages.
      headlineProxy.setupForHttpBackend();
    },
  };
};

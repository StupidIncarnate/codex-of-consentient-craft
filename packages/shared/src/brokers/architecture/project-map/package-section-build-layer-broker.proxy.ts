import { architectureBootTreeBrokerProxy } from '../boot-tree/architecture-boot-tree-broker.proxy';
import { headlineDispatchLayerBrokerProxy } from './headline-dispatch-layer-broker.proxy';
import { architectureSideChannelBrokerProxy } from '../side-channel/architecture-side-channel-broker.proxy';

export const packageSectionBuildLayerBrokerProxy = (): {
  setupLibraryPackage: () => void;
} => {
  architectureBootTreeBrokerProxy();
  const headlineProxy = headlineDispatchLayerBrokerProxy();
  const sideChannelProxy = architectureSideChannelBrokerProxy();

  return {
    setupLibraryPackage: (): void => {
      // Library packages skip the boot tree in the implementation, so bootTreeProxy is not
      // called here — calling bootTreeProxy.setupNoStartupFiles() would queue a ReturnValueOnce
      // that could contaminate readdir call ordering in composer-level proxy tests.
      headlineProxy.setupForLibrary();
      sideChannelProxy.setup({ sourceFiles: [] });
    },
  };
};

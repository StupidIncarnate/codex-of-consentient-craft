import { architectureBootTreeBrokerProxy } from '../boot-tree/architecture-boot-tree-broker.proxy';
import { headlineDispatchLayerBrokerProxy } from './headline-dispatch-layer-broker.proxy';
import { architectureSideChannelBrokerProxy } from '../side-channel/architecture-side-channel-broker.proxy';
import { architectureExcludedAuditBrokerProxy } from '../excluded-audit/architecture-excluded-audit-broker.proxy';
import { architecturePackageInventoryBrokerProxy } from '../package-inventory/architecture-package-inventory-broker.proxy';

export const packageSectionBuildLayerBrokerProxy = (): {
  setupLibraryPackage: ({ packageName }: { packageName: string }) => void;
} => {
  architectureBootTreeBrokerProxy();
  const headlineProxy = headlineDispatchLayerBrokerProxy();
  const sideChannelProxy = architectureSideChannelBrokerProxy();
  const excludedAuditProxy = architectureExcludedAuditBrokerProxy();
  const inventoryProxy = architecturePackageInventoryBrokerProxy();

  return {
    setupLibraryPackage: ({ packageName }: { packageName: string }): void => {
      // Library packages skip the boot tree in the implementation, so bootTreeProxy is not
      // called here — calling bootTreeProxy.setupNoStartupFiles() would queue a ReturnValueOnce
      // that could contaminate readdir call ordering in composer-level proxy tests.
      headlineProxy.setupForLibrary();
      sideChannelProxy.setup({ sourceFiles: [] });
      excludedAuditProxy.setupEmpty();
      inventoryProxy.setupPackage({ packageName, folders: [] });
    },
  };
};

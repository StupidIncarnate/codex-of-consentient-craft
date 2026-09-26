import { workspaceDiscoverBrokerProxy } from '../../workspace/discover/workspace-discover-broker.proxy';
import { gatewayDependencyNamesReadLayerBrokerProxy } from './gateway-dependency-names-read-layer-broker.proxy';
import { installedPackageVersionReadOptionalLayerBrokerProxy } from './installed-package-version-read-optional-layer-broker.proxy';

// This unit proxy only stages the "no workspace packages at all" shortcut — every scenario needing
// a real package tree (a gateway package, a second install location) is a real fixture repo in this
// file's own `.integration.test.ts` instead, because `installTestbedCreateBroker` does real
// filesystem I/O that this repo's unit-test I/O trap refuses.
export const duplicateInstallCheckBrokerProxy = (): {
  setupNoWorkspaces: () => void;
} => {
  const workspaceProxy = workspaceDiscoverBrokerProxy();
  // Constructed only to satisfy enforce-proxy-child-creation — the "no workspaces" scenario never
  // reaches either of these.
  gatewayDependencyNamesReadLayerBrokerProxy();
  installedPackageVersionReadOptionalLayerBrokerProxy();

  return {
    setupNoWorkspaces: (): void => {
      workspaceProxy.setupNoPackageJson();
    },
  };
};

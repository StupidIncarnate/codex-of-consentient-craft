import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { architecturePackageTypeDetectBrokerProxy } from '@dungeonmaster/shared/testing';
import { workspaceDiscoverBrokerProxy } from '../../workspace/discover/workspace-discover-broker.proxy';
import { globDiscoverFilesBrokerProxy } from '../../glob/discover-files/glob-discover-files-broker.proxy';
import { gatewayPackageNamesReadLayerBrokerProxy } from './gateway-package-names-read-layer-broker.proxy';
import { walkGatewayCrossingsLayerBrokerProxy } from './walk-gateway-crossings-layer-broker.proxy';

// This unit proxy only stages the "no workspace packages at all" shortcut — every scenario that
// needs a real package tree (a browser package, a barrel, a second workspace package) is a real
// fixture repo in this file's own `.integration.test.ts` instead, because `installTestbedCreateBroker`
// does real filesystem I/O that this repo's unit-test I/O trap refuses.
export const platformCrossingCheckBrokerProxy = (): {
  setupNoWorkspaces: () => void;
} => {
  const workspaceProxy = workspaceDiscoverBrokerProxy();
  // Constructed only to satisfy enforce-proxy-child-creation — the "no workspaces" scenario never
  // reaches any of these.
  architecturePackageTypeDetectBrokerProxy();
  globDiscoverFilesBrokerProxy();
  readFileProxy();
  // '/project' matches the fixed root `workspaceDiscoverBrokerProxy` itself already assumes.
  gatewayPackageNamesReadLayerBrokerProxy({ rootPath: FilePathStub({ value: '/project' }) });
  walkGatewayCrossingsLayerBrokerProxy();

  return {
    setupNoWorkspaces: (): void => {
      workspaceProxy.setupNoPackageJson();
    },
  };
};
